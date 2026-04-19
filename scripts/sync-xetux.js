/**
 * Sync script: Xetux (SQL Server) → Supabase (Postgres)
 *
 * Qué hace:
 *   1. Pull T_POS_FAMILY habilitadas (status_id = 1) → upsert bunker_family_cache
 *   2. Pull T_POS_ITEM + T_POS_PRODUCT + T_POS_PRODUCT_FAMILY (is_family_default=true,
 *      visible_for_web=true, allows_sale=true) → upsert bunker_item_cache
 *   3. Calcula final_price según tax_id (2 = IVA 16%)
 *
 * 100% read-only contra Xetux. Solo escribe a Supabase vía service_role.
 *
 * Uso: node scripts/sync-xetux.js
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { createClient } = require('@supabase/supabase-js');

// ========== Cargar .env ==========
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
});

// ========== Config ==========
const xetuxConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { trustServerCertificate: true, encrypt: false, enableArithAbort: true },
  connectionTimeout: 30000,
  requestTimeout: 60000,
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ========== Helpers ==========
/**
 * Calcula precio final con IVA según tax_id.
 * tax_id = 1 → sin IVA
 * tax_id = 2 → con IVA 16%
 */
function calcFinalPrice(salePrice1, taxId) {
  if (salePrice1 == null) return null;
  const price = Number(salePrice1);
  if (Number.isNaN(price)) return null;
  const multiplier = taxId === 2 ? 1.16 : 1;
  return Math.round(price * multiplier * 100) / 100;
}

/**
 * Genera un slug URL-safe desde un texto.
 * CORTES AL CARBON → cortes-al-carbon
 * CAFE / TODDY → cafe-toddy
 */
function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// ========== 1. Sync familias + auto-seed meta ==========
async function syncFamilies(pool) {
  console.log('📥 [1/2] Fetching families from Xetux...');
  const result = await pool.request().query(`
    SELECT
      family_id,
      family_name,
      family_description,
      family_parent_id,
      family_position,
      family_status_id
    FROM T_POS_FAMILY
    WHERE family_status_id = 1;
  `);
  console.log(`   ${result.recordset.length} familias habilitadas encontradas.`);

  const rows = result.recordset.map(r => ({
    family_id: r.family_id,
    family_name: r.family_name,
    family_description: r.family_description,
    family_parent_id: r.family_parent_id,
    family_position: r.family_position,
    family_status_id: r.family_status_id,
    synced_at: new Date().toISOString(),
  }));

  console.log('📤 Upserting bunker_family_cache...');
  const { error } = await supabase
    .from('bunker_family_cache')
    .upsert(rows, { onConflict: 'family_id' });
  if (error) throw new Error(`Supabase upsert families: ${error.message}`);
  console.log(`   ✅ ${rows.length} familias sincronizadas.`);

  // Auto-seed meta rows (solo inserta si no existen; no sobrescribe ediciones del admin)
  console.log('📤 Auto-seeding bunker_family_meta (solo familias nuevas)...');
  const { data: existing } = await supabase.from('bunker_family_meta').select('family_id, slug');
  const existingIds = new Set((existing || []).map(e => e.family_id));
  const existingSlugs = new Set((existing || []).map(e => e.slug));

  const metaToInsert = [];
  for (const r of rows) {
    if (existingIds.has(r.family_id)) continue;
    let baseSlug = slugify(r.family_name) || `familia-${r.family_id}`;
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    existingSlugs.add(slug);
    metaToInsert.push({
      family_id: r.family_id,
      slug,
      sort_order: r.family_position ?? 0,
      is_visible_on_menu: true,
    });
  }

  if (metaToInsert.length > 0) {
    const { error: metaErr } = await supabase.from('bunker_family_meta').insert(metaToInsert);
    if (metaErr) throw new Error(`Supabase insert family_meta: ${metaErr.message}`);
    console.log(`   ✅ ${metaToInsert.length} meta rows creadas (familias nuevas).\n`);
  } else {
    console.log(`   ✅ Sin familias nuevas; meta intacta.\n`);
  }

  return rows.length;
}

// ========== 2. Sync items ==========
async function syncItems(pool) {
  console.log('📥 [2/2] Fetching items from Xetux...');
  const result = await pool.request().query(`
    SELECT
      i.item_id         AS xetux_item_id,
      p.product_id      AS xetux_product_id,
      i.item_name,
      i.ecommerce_name,
      i.item_description,
      i.tax_id,
      pf.family_id      AS default_family_id,
      p.sale_price_1,
      CAST(i.visible_for_web AS INT) AS visible_for_web,
      CAST(i.allows_sale AS INT)     AS allows_sale,
      pf.product_position
    FROM T_POS_ITEM i
    JOIN T_POS_PRODUCT p        ON p.item_id = i.item_id
    JOIN T_POS_PRODUCT_FAMILY pf ON pf.product_id = p.product_id AND pf.is_family_default = 1
    WHERE i.visible_for_web = 1
      AND i.item_status_id = 1;  -- 1 = Habilitado (filtra eliminados históricos)
  `);
  console.log(`   ${result.recordset.length} items encontrados.`);

  // Obtener family_ids válidos para filtrar items cuya familia default no está habilitada
  const { data: validFamilies } = await supabase
    .from('bunker_family_cache')
    .select('family_id');
  const validFamilyIds = new Set(validFamilies.map(f => f.family_id));

  const filteredRows = [];
  let skippedFamily = 0;
  for (const r of result.recordset) {
    if (r.default_family_id != null && !validFamilyIds.has(r.default_family_id)) {
      skippedFamily++;
      continue;
    }
    filteredRows.push({
      xetux_item_id: r.xetux_item_id,
      xetux_product_id: r.xetux_product_id,
      item_name: r.item_name,
      ecommerce_name: r.ecommerce_name,
      item_description: r.item_description,
      tax_id: r.tax_id,
      default_family_id: r.default_family_id,
      sale_price_1: r.sale_price_1 != null ? Number(r.sale_price_1) : null,
      final_price: calcFinalPrice(r.sale_price_1, r.tax_id),
      visible_for_web: r.visible_for_web === 1,
      allows_sale: r.allows_sale === 1,
      product_position: r.product_position,
      synced_at: new Date().toISOString(),
    });
  }

  if (skippedFamily > 0) {
    console.log(`   ⚠️  ${skippedFamily} items omitidos (su familia default no está habilitada).`);
  }

  console.log(`📤 Upserting ${filteredRows.length} items a bunker_item_cache (por lotes de 500)...`);
  for (let i = 0; i < filteredRows.length; i += 500) {
    const batch = filteredRows.slice(i, i + 500);
    const { error } = await supabase
      .from('bunker_item_cache')
      .upsert(batch, { onConflict: 'xetux_item_id' });
    if (error) throw new Error(`Supabase upsert items batch ${i}: ${error.message}`);
    console.log(`   ✓ batch ${Math.floor(i / 500) + 1} (${batch.length} rows)`);
  }
  console.log(`   ✅ ${filteredRows.length} items sincronizados.\n`);
  return filteredRows.length;
}

// ========== Main ==========
async function main() {
  const startedAt = Date.now();
  console.log('═══════════════════════════════════════════════════');
  console.log('  XETUX → SUPABASE SYNC');
  console.log(`  Xetux:    ${xetuxConfig.server} / ${xetuxConfig.database}`);
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log('🔌 Connecting to Xetux...');
  const pool = await sql.connect(xetuxConfig);
  console.log('   ✅ connected.\n');

  try {
    const famCount = await syncFamilies(pool);
    const itemCount = await syncItems(pool);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Sync completado en ${elapsed}s`);
    console.log(`   Familias: ${famCount}`);
    console.log(`   Items:    ${itemCount}`);
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
