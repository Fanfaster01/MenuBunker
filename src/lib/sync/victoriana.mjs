import sql from 'mssql';
import { getSupabaseAdmin } from '../supabaseAdmin.mjs';

/**
 * Sync Victoriana (VAD10, SQL Server) → Supabase.
 * Módulo ESM importable desde API routes / Server Actions / CLI.
 */

export async function runVictorianaSync({ log = noop } = {}) {
  const startedAt = Date.now();
  const lines = [];
  const push = (msg) => {
    lines.push(msg);
    log(msg);
  };

  const MISSING = [];
  if (!process.env.VICTORIANA_DB_HOST) MISSING.push('VICTORIANA_DB_HOST');
  if (!process.env.VICTORIANA_DB_USER) MISSING.push('VICTORIANA_DB_USER');
  if (!process.env.VICTORIANA_DB_PASSWORD) MISSING.push('VICTORIANA_DB_PASSWORD');
  if (!process.env.VICTORIANA_DB_NAME) MISSING.push('VICTORIANA_DB_NAME');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) MISSING.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) MISSING.push('SUPABASE_SERVICE_ROLE_KEY');
  if (MISSING.length > 0) {
    const err = `Faltan env vars: ${MISSING.join(', ')}`;
    return { ok: false, error: err, log: err, durationMs: 0, departmentCount: 0, groupCount: 0, productCount: 0 };
  }

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

  const supabase = getSupabaseAdmin();

  push('═══ VICTORIANA → SUPABASE SYNC ═══');
  push(`Victoriana: ${victorianaConfig.server}:${victorianaConfig.port}/${victorianaConfig.database}`);

  let pool;
  try {
    push('🔌 Connecting to Victoriana DB...');
    pool = await sql.connect(victorianaConfig);
    push('   ✅ connected.');

    const d = await syncDepartments(pool, supabase, push);
    const g = await syncGroups(pool, supabase, push);
    const p = await syncProducts(pool, supabase, push);

    const durationMs = Date.now() - startedAt;
    push(
      `✅ Sync completado en ${(durationMs / 1000).toFixed(1)}s · ${d} depts · ${g} grupos · ${p} productos`
    );
    return {
      ok: true,
      durationMs,
      departmentCount: d,
      groupCount: g,
      productCount: p,
      log: lines.join('\n'),
    };
  } catch (err) {
    const msg = err?.message || String(err);
    push(`❌ FAILED: ${msg}`);
    return {
      ok: false,
      error: msg,
      durationMs: Date.now() - startedAt,
      departmentCount: 0,
      groupCount: 0,
      productCount: 0,
      log: lines.join('\n'),
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch {
        /* ignore */
      }
    }
  }
}

// ============================================================================

async function syncDepartments(pool, supabase, push) {
  push('📥 [1/3] Departamentos...');
  const res = await pool.request().query(`SELECT C_CODIGO, C_DESCRIPCIO FROM MA_DEPARTAMENTOS;`);
  push(`   ${res.recordset.length} departamentos.`);

  const now = new Date().toISOString();
  const rows = res.recordset.map((r) => ({
    codigo: r.C_CODIGO,
    nombre: r.C_DESCRIPCIO,
    synced_at: now,
  }));
  const { error } = await supabase
    .from('victoriana_department_cache')
    .upsert(rows, { onConflict: 'codigo' });
  if (error) throw new Error(`upsert victoriana_department_cache: ${error.message}`);
  push(`   ✅ ${rows.length} sincronizados.`);

  // Delete-stale: depts que ya no existen en el ERP. Meta y grupos huérfanos
  // sobreviven (no hay FK CASCADE entre cache y meta; entre cache y cache de
  // grupos sí sigue habiendo CASCADE, eso es OK porque si un dept se va, sus
  // grupos también deben irse).
  const currentCodes = new Set(rows.map((r) => r.codigo));
  const cacheCodes = await fetchAllCachePks(supabase, 'victoriana_department_cache', 'codigo');
  const stale = cacheCodes.filter((c) => !currentCodes.has(c));
  if (stale.length > 0) {
    const { error: delErr } = await supabase
      .from('victoriana_department_cache')
      .delete()
      .in('codigo', stale);
    if (delErr) throw new Error(`delete stale victoriana_department_cache: ${delErr.message}`);
    push(`   🗑️  ${stale.length} departamentos eliminados del cache.`);
  }

  // Auto-seed meta (solo nuevos)
  const { data: existing } = await supabase.from('victoriana_department_meta').select('codigo, slug');
  const existingCodes = new Set((existing || []).map((e) => e.codigo));
  const existingSlugs = new Set((existing || []).map((e) => e.slug));

  const metaToInsert = [];
  for (const r of rows) {
    if (existingCodes.has(r.codigo)) continue;
    let base = slugify(r.nombre) || `depto-${r.codigo}`;
    let slug = base;
    let i = 2;
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
    if (me) throw new Error(`insert victoriana_department_meta: ${me.message}`);
    push(`   🆕 ${metaToInsert.length} meta rows creadas.`);
  }
  return rows.length;
}

async function syncGroups(pool, supabase, push) {
  push('📥 [2/3] Grupos...');
  const res = await pool.request().query(`
    SELECT c_CODIGO, c_departamento, C_DESCRIPCIO FROM MA_GRUPOS
    WHERE c_departamento IS NOT NULL;
  `);
  push(`   ${res.recordset.length} grupos.`);

  const now = new Date().toISOString();
  const rows = res.recordset.map((r) => ({
    codigo: r.c_CODIGO,
    departamento_codigo: r.c_departamento,
    nombre: r.C_DESCRIPCIO,
    synced_at: now,
  }));

  const { data: validDepts } = await supabase.from('victoriana_department_cache').select('codigo');
  const validDeptCodes = new Set((validDepts || []).map((d) => d.codigo));
  const filtered = rows.filter((r) => validDeptCodes.has(r.departamento_codigo));

  for (let i = 0; i < filtered.length; i += 500) {
    const batch = filtered.slice(i, i + 500);
    const { error } = await supabase
      .from('victoriana_group_cache')
      .upsert(batch, { onConflict: 'codigo,departamento_codigo' });
    if (error) throw new Error(`upsert victoriana_group_cache batch: ${error.message}`);
  }
  push(`   ✅ ${filtered.length} sincronizados.`);

  // Delete-stale grupos. PK compuesta (codigo, departamento_codigo).
  const currentKeys = new Set(filtered.map((r) => `${r.departamento_codigo}:${r.codigo}`));
  const { data: cacheGroups } = await supabase
    .from('victoriana_group_cache')
    .select('codigo, departamento_codigo');
  const staleGroups = (cacheGroups || []).filter(
    (g) => !currentKeys.has(`${g.departamento_codigo}:${g.codigo}`)
  );
  if (staleGroups.length > 0) {
    // Delete uno por uno con AND compuesto (mejor por API, son pocos)
    for (const g of staleGroups) {
      const { error: delErr } = await supabase
        .from('victoriana_group_cache')
        .delete()
        .eq('codigo', g.codigo)
        .eq('departamento_codigo', g.departamento_codigo);
      if (delErr) throw new Error(`delete stale group ${g.codigo}: ${delErr.message}`);
    }
    push(`   🗑️  ${staleGroups.length} grupos eliminados del cache.`);
  }

  // Auto-seed meta
  const { data: existing } = await supabase
    .from('victoriana_group_meta')
    .select('codigo, departamento_codigo, slug');
  const existingKey = new Set((existing || []).map((e) => `${e.departamento_codigo}:${e.codigo}`));
  const existingSlugsByDept = new Map();
  for (const e of existing || []) {
    if (!existingSlugsByDept.has(e.departamento_codigo))
      existingSlugsByDept.set(e.departamento_codigo, new Set());
    existingSlugsByDept.get(e.departamento_codigo).add(e.slug);
  }

  const metaToInsert = [];
  for (const r of filtered) {
    const key = `${r.departamento_codigo}:${r.codigo}`;
    if (existingKey.has(key)) continue;
    if (!existingSlugsByDept.has(r.departamento_codigo))
      existingSlugsByDept.set(r.departamento_codigo, new Set());
    const slugSet = existingSlugsByDept.get(r.departamento_codigo);
    let base = slugify(r.nombre) || `grupo-${r.codigo}`;
    let slug = base;
    let i = 2;
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
      if (me) throw new Error(`insert victoriana_group_meta: ${me.message}`);
    }
    push(`   🆕 ${metaToInsert.length} group_meta rows creadas.`);
  }
  return filtered.length;
}

async function syncProducts(pool, supabase, push) {
  push('📥 [3/3] Productos...');
  const res = await pool.request().query(`
    SELECT
      c_Codigo, c_Descri, cu_Descripcion_Corta, c_Marca, c_Presenta,
      n_Precio1, n_Impuesto1, c_Departamento, c_Grupo
    FROM MA_PRODUCTOS
    WHERE n_Activo = 1 AND n_Precio1 > 0;
  `);
  push(`   ${res.recordset.length} productos activos con precio.`);

  const now = new Date().toISOString();
  const rows = res.recordset.map((r) => ({
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
    synced_at: now,
  }));

  const { data: validDepts } = await supabase.from('victoriana_department_cache').select('codigo');
  const validDeptCodes = new Set((validDepts || []).map((d) => d.codigo));
  const filtered = rows.filter((r) => validDeptCodes.has(r.departamento_codigo));

  push(`📤 Upserting ${filtered.length} productos (batches de 500)...`);
  for (let i = 0; i < filtered.length; i += 500) {
    const batch = filtered.slice(i, i + 500);
    const { error } = await supabase
      .from('victoriana_product_cache')
      .upsert(batch, { onConflict: 'codigo' });
    if (error) throw new Error(`upsert victoriana_product_cache batch ${i}: ${error.message}`);
  }
  push(`   ✅ ${filtered.length} productos sincronizados.`);

  // Delete-stale productos. Meta sobrevive — si el producto se reactiva,
  // recupera descripción gourmet, imagen, flags.
  const currentCodes = new Set(filtered.map((r) => r.codigo));
  const cacheCodes = await fetchAllCachePks(supabase, 'victoriana_product_cache', 'codigo');
  const stale = cacheCodes.filter((c) => !currentCodes.has(c));
  if (stale.length > 0) {
    for (let i = 0; i < stale.length; i += 500) {
      const batch = stale.slice(i, i + 500);
      const { error: delErr } = await supabase
        .from('victoriana_product_cache')
        .delete()
        .in('codigo', batch);
      if (delErr) throw new Error(`delete stale victoriana_product_cache: ${delErr.message}`);
    }
    push(`   🗑️  ${stale.length} productos eliminados del cache (no estaban en Victoriana).`);
  }

  return filtered.length;
}

/**
 * Pagina toda la lista de PKs. Necesario porque PostgREST trunca a 1000 rows.
 */
async function fetchAllCachePks(supabase, tableName, pkColumn) {
  const CHUNK = 1000;
  const all = [];
  let from = 0;
  while (from < 100000) {
    const { data, error } = await supabase
      .from(tableName)
      .select(pkColumn)
      .range(from, from + CHUNK - 1);
    if (error) throw new Error(`fetch PKs ${tableName}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) all.push(row[pkColumn]);
    if (data.length < CHUNK) break;
    from += CHUNK;
  }
  return all;
}

// ============================================================================
// Helpers
// ============================================================================

function calcFinalPrice(precio, tax) {
  if (precio == null) return null;
  const p = Number(precio);
  if (Number.isNaN(p)) return null;
  const t = Number(tax) || 0;
  return Math.round(p * (1 + t / 100) * 100) / 100;
}

function slugify(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function noop() {}
