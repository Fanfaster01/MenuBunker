import sql from 'mssql';
import { getSupabaseAdmin } from '../supabaseAdmin';

/**
 * Sync Xetux (SQL Server) → Supabase — módulo ESM reusable.
 *
 * Callers:
 *   - Vercel Cron (API route /api/cron/sync)
 *   - Admin UI Server Action (botón "Sincronizar ahora")
 *   - CLI script scripts/sync-xetux.js
 *
 * Retorna { ok, durationMs, familyCount, itemCount, log, error? }.
 * El callback `log` se invoca con cada línea para permitir streaming de progreso.
 */

export async function runXetuxSync({ log = noop } = {}) {
  const startedAt = Date.now();
  const lines = [];
  const push = (msg) => {
    lines.push(msg);
    log(msg);
  };

  // Validación temprana de credenciales
  const MISSING = [];
  if (!process.env.DB_HOST) MISSING.push('DB_HOST');
  if (!process.env.DB_USER) MISSING.push('DB_USER');
  if (!process.env.DB_PASSWORD) MISSING.push('DB_PASSWORD');
  if (!process.env.DB_NAME) MISSING.push('DB_NAME');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) MISSING.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) MISSING.push('SUPABASE_SERVICE_ROLE_KEY');
  if (MISSING.length > 0) {
    const err = `Faltan env vars: ${MISSING.join(', ')}`;
    return { ok: false, error: err, log: err, durationMs: 0, familyCount: 0, itemCount: 0 };
  }

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

  const supabase = getSupabaseAdmin();

  push('═══ XETUX → SUPABASE SYNC ═══');
  push(`Xetux: ${xetuxConfig.server}/${xetuxConfig.database}`);

  let pool;
  try {
    push('🔌 Connecting to Xetux...');
    pool = await sql.connect(xetuxConfig);
    push('   ✅ connected.');

    const famCount = await syncFamilies(pool, supabase, push);
    const itemCount = await syncItems(pool, supabase, push);

    const durationMs = Date.now() - startedAt;
    push(`✅ Sync completado en ${(durationMs / 1000).toFixed(1)}s · ${famCount} familias · ${itemCount} items`);

    return {
      ok: true,
      durationMs,
      familyCount: famCount,
      itemCount,
      log: lines.join('\n'),
    };
  } catch (err) {
    const msg = err?.message || String(err);
    push(`❌ FAILED: ${msg}`);
    return {
      ok: false,
      error: msg,
      durationMs: Date.now() - startedAt,
      familyCount: 0,
      itemCount: 0,
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

async function syncFamilies(pool, supabase, push) {
  push('📥 [1/2] Fetching families from Xetux...');
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
  push(`   ${result.recordset.length} familias habilitadas encontradas.`);

  const now = new Date().toISOString();
  const rows = result.recordset.map((r) => ({
    family_id: r.family_id,
    family_name: r.family_name,
    family_description: r.family_description,
    family_parent_id: r.family_parent_id,
    family_position: r.family_position,
    family_status_id: r.family_status_id,
    synced_at: now,
  }));

  const { error } = await supabase
    .from('bunker_family_cache')
    .upsert(rows, { onConflict: 'family_id' });
  if (error) throw new Error(`upsert bunker_family_cache: ${error.message}`);
  push(`   ✅ ${rows.length} familias sincronizadas.`);

  // Auto-seed meta rows (solo para familias nuevas)
  const { data: existing } = await supabase.from('bunker_family_meta').select('family_id, slug');
  const existingIds = new Set((existing || []).map((e) => e.family_id));
  const existingSlugs = new Set((existing || []).map((e) => e.slug));

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
    if (metaErr) throw new Error(`insert bunker_family_meta: ${metaErr.message}`);
    push(`   🆕 ${metaToInsert.length} meta rows creadas (familias nuevas).`);
  }

  return rows.length;
}

async function syncItems(pool, supabase, push) {
  push('📥 [2/2] Fetching items from Xetux...');
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
      AND i.item_status_id = 1;
  `);
  push(`   ${result.recordset.length} items encontrados en Xetux.`);

  const { data: validFamilies } = await supabase.from('bunker_family_cache').select('family_id');
  const validFamilyIds = new Set((validFamilies || []).map((f) => f.family_id));

  const now = new Date().toISOString();
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
      synced_at: now,
    });
  }
  if (skippedFamily > 0) {
    push(`   ⚠️  ${skippedFamily} items omitidos (familia default no habilitada).`);
  }

  push(`📤 Upserting ${filteredRows.length} items (lotes de 500)...`);
  for (let i = 0; i < filteredRows.length; i += 500) {
    const batch = filteredRows.slice(i, i + 500);
    const { error } = await supabase
      .from('bunker_item_cache')
      .upsert(batch, { onConflict: 'xetux_item_id' });
    if (error) throw new Error(`upsert bunker_item_cache batch ${i}: ${error.message}`);
  }
  push(`   ✅ ${filteredRows.length} items sincronizados.`);
  return filteredRows.length;
}

// ============================================================================
// Helpers
// ============================================================================

function calcFinalPrice(salePrice1, taxId) {
  if (salePrice1 == null) return null;
  const price = Number(salePrice1);
  if (Number.isNaN(price)) return null;
  const multiplier = taxId === 2 ? 1.16 : 1;
  return Math.round(price * multiplier * 100) / 100;
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
