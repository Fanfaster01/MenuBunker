/**
 * Sync: Victoriana DB (VAD10, SQL Server) → Supabase
 *
 * 1. MA_DEPARTAMENTOS → victoriana_department_cache
 * 2. MA_GRUPOS       → victoriana_group_cache
 * 3. MA_PRODUCTOS    → victoriana_product_cache (activos + precio > 0)
 *
 * Auto-crea meta rows para depts y groups nuevos con slug auto-generado.
 * Respeta is_visible_on_menu y overrides editados desde admin.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { createClient } = require('@supabase/supabase-js');

// .env loader
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const t = line.trim(); if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('='); if (eq === -1) return;
  const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
});

const victorianaConfig = {
  user: process.env.VICTORIANA_DB_USER,
  password: process.env.VICTORIANA_DB_PASSWORD,
  server: process.env.VICTORIANA_DB_HOST,
  database: process.env.VICTORIANA_DB_NAME,
  port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
  options: { trustServerCertificate: true, encrypt: false, enableArithAbort: true },
  connectionTimeout: 30000,
  requestTimeout: 120000,
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan env vars de Supabase');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function calcFinalPrice(precio, tax) {
  if (precio == null) return null;
  const p = Number(precio);
  if (Number.isNaN(p)) return null;
  const t = Number(tax) || 0;
  return Math.round(p * (1 + t / 100) * 100) / 100;
}

async function syncDepartments(pool) {
  console.log('📥 [1/3] Departamentos...');
  const res = await pool.request().query(`SELECT C_CODIGO, C_DESCRIPCIO FROM MA_DEPARTAMENTOS;`);
  console.log(`   ${res.recordset.length} departamentos.`);

  const rows = res.recordset.map(r => ({
    codigo: r.C_CODIGO,
    nombre: r.C_DESCRIPCIO,
    synced_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('victoriana_department_cache').upsert(rows, { onConflict: 'codigo' });
  if (error) throw new Error(`Supabase upsert depts: ${error.message}`);
  console.log(`   ✅ ${rows.length} sincronizados.`);

  // Auto-seed meta (solo nuevos)
  const { data: existing } = await supabase.from('victoriana_department_meta').select('codigo, slug');
  const existingCodes = new Set((existing || []).map(e => e.codigo));
  const existingSlugs = new Set((existing || []).map(e => e.slug));

  const metaToInsert = [];
  for (const r of rows) {
    if (existingCodes.has(r.codigo)) continue;
    let base = slugify(r.nombre) || `depto-${r.codigo}`;
    let slug = base, i = 2;
    while (existingSlugs.has(slug)) slug = `${base}-${i++}`;
    existingSlugs.add(slug);
    metaToInsert.push({
      codigo: r.codigo,
      slug,
      sort_order: 0,
      // INSUMOS (codigo 08) oculto por default
      is_visible_on_menu: r.codigo !== '08',
    });
  }
  if (metaToInsert.length > 0) {
    const { error: me } = await supabase.from('victoriana_department_meta').insert(metaToInsert);
    if (me) throw new Error(`Supabase insert dept_meta: ${me.message}`);
    console.log(`   ✅ ${metaToInsert.length} meta rows creadas.`);
  }
  return rows.length;
}

async function syncGroups(pool) {
  console.log('\n📥 [2/3] Grupos...');
  const res = await pool.request().query(`
    SELECT c_CODIGO, c_departamento, C_DESCRIPCIO FROM MA_GRUPOS
    WHERE c_departamento IS NOT NULL;
  `);
  console.log(`   ${res.recordset.length} grupos.`);

  const rows = res.recordset.map(r => ({
    codigo: r.c_CODIGO,
    departamento_codigo: r.c_departamento,
    nombre: r.C_DESCRIPCIO,
    synced_at: new Date().toISOString(),
  }));
  // Filtrar grupos cuyo depto no exista en cache (safety)
  const { data: validDepts } = await supabase.from('victoriana_department_cache').select('codigo');
  const validDeptCodes = new Set((validDepts || []).map(d => d.codigo));
  const filtered = rows.filter(r => validDeptCodes.has(r.departamento_codigo));

  for (let i = 0; i < filtered.length; i += 500) {
    const batch = filtered.slice(i, i + 500);
    const { error } = await supabase.from('victoriana_group_cache').upsert(batch, { onConflict: 'codigo,departamento_codigo' });
    if (error) throw new Error(`Supabase upsert groups batch: ${error.message}`);
  }
  console.log(`   ✅ ${filtered.length} sincronizados.`);

  // Auto-seed meta
  const { data: existing } = await supabase.from('victoriana_group_meta').select('codigo, departamento_codigo, slug');
  const existingKey = new Set((existing || []).map(e => `${e.departamento_codigo}:${e.codigo}`));
  const existingSlugsByDept = new Map();
  for (const e of existing || []) {
    if (!existingSlugsByDept.has(e.departamento_codigo)) existingSlugsByDept.set(e.departamento_codigo, new Set());
    existingSlugsByDept.get(e.departamento_codigo).add(e.slug);
  }

  const metaToInsert = [];
  for (const r of filtered) {
    const key = `${r.departamento_codigo}:${r.codigo}`;
    if (existingKey.has(key)) continue;
    if (!existingSlugsByDept.has(r.departamento_codigo)) existingSlugsByDept.set(r.departamento_codigo, new Set());
    const slugSet = existingSlugsByDept.get(r.departamento_codigo);
    let base = slugify(r.nombre) || `grupo-${r.codigo}`;
    let slug = base, i = 2;
    while (slugSet.has(slug)) slug = `${base}-${i++}`;
    slugSet.add(slug);
    metaToInsert.push({
      codigo: r.codigo,
      departamento_codigo: r.departamento_codigo,
      slug,
      sort_order: 0,
      is_visible_on_menu: true,
    });
  }
  if (metaToInsert.length > 0) {
    for (let i = 0; i < metaToInsert.length; i += 500) {
      const batch = metaToInsert.slice(i, i + 500);
      const { error: me } = await supabase.from('victoriana_group_meta').insert(batch);
      if (me) throw new Error(`Supabase insert group_meta: ${me.message}`);
    }
    console.log(`   ✅ ${metaToInsert.length} group_meta rows creadas.`);
  }
  return filtered.length;
}

async function syncProducts(pool) {
  console.log('\n📥 [3/3] Productos...');
  const res = await pool.request().query(`
    SELECT
      c_Codigo, c_Descri, cu_Descripcion_Corta, c_Marca, c_Presenta,
      n_Precio1, n_Impuesto1, c_Departamento, c_Grupo
    FROM MA_PRODUCTOS
    WHERE n_Activo = 1 AND n_Precio1 > 0;
  `);
  console.log(`   ${res.recordset.length} productos activos con precio.`);

  const rows = res.recordset.map(r => ({
    codigo: r.c_Codigo,
    descri: r.c_Descri,
    descri_corta: r.cu_Descripcion_Corta,
    marca: r.c_Marca || null,
    presentacion: r.c_Presenta || null,
    precio: r.n_Precio1 != null ? Number(r.n_Precio1) : null,
    tax_rate: r.n_Impuesto1 != null ? Number(r.n_Impuesto1) : 0,
    final_price: calcFinalPrice(r.n_Precio1, r.n_Impuesto1),
    departamento_codigo: r.c_Departamento,
    grupo_codigo: r.c_Grupo,
    synced_at: new Date().toISOString(),
  }));

  // Filtrar por depts válidos
  const { data: validDepts } = await supabase.from('victoriana_department_cache').select('codigo');
  const validDeptCodes = new Set((validDepts || []).map(d => d.codigo));
  const filtered = rows.filter(r => validDeptCodes.has(r.departamento_codigo));

  console.log(`📤 Upserting ${filtered.length} productos (batches de 500)...`);
  for (let i = 0; i < filtered.length; i += 500) {
    const batch = filtered.slice(i, i + 500);
    const { error } = await supabase.from('victoriana_product_cache').upsert(batch, { onConflict: 'codigo' });
    if (error) throw new Error(`Supabase upsert products batch ${i}: ${error.message}`);
    console.log(`   ✓ batch ${Math.floor(i / 500) + 1} (${batch.length} rows)`);
  }
  console.log(`   ✅ ${filtered.length} productos sincronizados.`);
  return filtered.length;
}

async function main() {
  const t0 = Date.now();
  console.log('═══════════════════════════════════════════════════');
  console.log('  VICTORIANA → SUPABASE SYNC');
  console.log(`  DB:       ${victorianaConfig.server}:${victorianaConfig.port} / ${victorianaConfig.database}`);
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log('🔌 Connecting to Victoriana DB...');
  const pool = await sql.connect(victorianaConfig);
  console.log('   ✅ connected.\n');

  try {
    const d = await syncDepartments(pool);
    const g = await syncGroups(pool);
    const p = await syncProducts(pool);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`✅ Sync completado en ${elapsed}s`);
    console.log(`   Departamentos: ${d}`);
    console.log(`   Grupos:        ${g}`);
    console.log(`   Productos:     ${p}`);
    console.log('═══════════════════════════════════════════════════');
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error('\n❌ Sync FAILED:', err.message);
  if (err.originalError) console.error('   original:', err.originalError.message);
  process.exit(1);
});
