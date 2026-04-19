/** Encontrar la combinación de flags que da ~311 productos activos */
const fs = require('fs'); const path = require('path'); const sql = require('mssql');
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const t = line.trim(); if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('='); if (eq === -1) return;
  const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
});
const config = {
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST, database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { trustServerCertificate: true, encrypt: false, enableArithAbort: true },
};

async function main() {
  const pool = await sql.connect(config);

  console.log('\n========== Tablas de estado relevantes ==========');
  try {
    const ps = await pool.request().query(`SELECT * FROM T_POS_PRODUCT_STATUS;`);
    console.log('T_POS_PRODUCT_STATUS:'); console.log(JSON.stringify(ps.recordset, null, 2));
  } catch(e) { console.log('T_POS_PRODUCT_STATUS:', e.message); }

  console.log('\n========== Distribución de flags en T_POS_PRODUCT ==========');
  const dist = await pool.request().query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN p.is_enabled = 1 THEN 1 ELSE 0 END)              AS is_enabled_1,
      SUM(CASE WHEN p.is_visible_for_touch = 1 THEN 1 ELSE 0 END)    AS visible_touch_1,
      SUM(CASE WHEN p.product_status_id = 1 THEN 1 ELSE 0 END)       AS pstatus_1,
      SUM(CASE WHEN p.product_status_id IS NULL THEN 1 ELSE 0 END)   AS pstatus_null,
      SUM(CASE WHEN p.applyDigitalMenu = 1 THEN 1 ELSE 0 END)        AS apply_menu_1,
      SUM(CASE WHEN p.applyEcommerce = 1 THEN 1 ELSE 0 END)          AS apply_ecom_1,
      SUM(CASE WHEN p.isStillLife = 1 THEN 1 ELSE 0 END)             AS still_life_1,
      SUM(CASE WHEN p.is_restrict_by_stock = 1 THEN 1 ELSE 0 END)    AS restrict_stock_1
    FROM T_POS_PRODUCT p;
  `);
  console.table(dist.recordset);

  console.log('\n========== Combinaciones con T_POS_PRODUCT_FAMILY (con familia default) ==========');
  const combos = await pool.request().query(`
    WITH PF AS (
      SELECT DISTINCT product_id FROM T_POS_PRODUCT_FAMILY WHERE is_family_default = 1
    )
    SELECT
      -- Base: tiene family_default
      (SELECT COUNT(DISTINCT p.product_id) FROM T_POS_PRODUCT p INNER JOIN PF ON PF.product_id = p.product_id) AS with_family_default,
      -- + is_enabled
      (SELECT COUNT(DISTINCT p.product_id) FROM T_POS_PRODUCT p INNER JOIN PF ON PF.product_id = p.product_id WHERE p.is_enabled = 1) AS plus_is_enabled,
      -- + is_visible_for_touch
      (SELECT COUNT(DISTINCT p.product_id) FROM T_POS_PRODUCT p INNER JOIN PF ON PF.product_id = p.product_id WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1) AS plus_visible_touch,
      -- Con JOIN a T_POS_ITEM visible_for_web
      (SELECT COUNT(DISTINCT p.product_id)
         FROM T_POS_PRODUCT p
         INNER JOIN PF ON PF.product_id = p.product_id
         INNER JOIN T_POS_ITEM i ON i.item_id = p.item_id
         WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1 AND i.visible_for_web = 1) AS plus_web_visible,
      -- Agregando item_status_id = 1 (Habilitado)
      (SELECT COUNT(DISTINCT p.product_id)
         FROM T_POS_PRODUCT p
         INNER JOIN PF ON PF.product_id = p.product_id
         INNER JOIN T_POS_ITEM i ON i.item_id = p.item_id
         WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1 AND i.visible_for_web = 1 AND i.item_status_id = 1) AS plus_item_status_1;
  `);
  console.table(combos.recordset);

  console.log('\n========== Verificar nuestros 21 items con el filtro is_enabled + is_visible_for_touch ==========');
  const BUNKER_IDS = [7217,7216,2456,3624,4115,7061,2346,6441,7115,6415,6729,6731,6734,6737,6741,6728,6743,6747,6744,6745,6791];
  const check = await pool.request().query(`
    SELECT
      i.item_id, i.item_name,
      CAST(i.visible_for_web AS INT)   AS ivw,
      i.item_status_id                 AS istat,
      CAST(p.is_enabled AS INT)        AS penab,
      CAST(p.is_visible_for_touch AS INT) AS pvtouch,
      p.product_status_id              AS pstat,
      CAST(p.isStillLife AS INT)       AS still
    FROM T_POS_ITEM i
    JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY i.item_id;
  `);
  console.table(check.recordset);

  console.log('\n========== Contar HAMBURGUESAS (family 1050) con cada combinación ==========');
  const burgerCheck = await pool.request().query(`
    WITH PF AS (SELECT DISTINCT product_id FROM T_POS_PRODUCT_FAMILY WHERE is_family_default = 1 AND family_id = 1050)
    SELECT
      (SELECT COUNT(*) FROM PF) AS total_in_family,
      (SELECT COUNT(*) FROM PF INNER JOIN T_POS_PRODUCT p ON p.product_id = PF.product_id
         WHERE p.is_enabled = 1) AS with_is_enabled,
      (SELECT COUNT(*) FROM PF INNER JOIN T_POS_PRODUCT p ON p.product_id = PF.product_id
         WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1) AS with_is_visible_touch,
      (SELECT COUNT(*) FROM PF INNER JOIN T_POS_PRODUCT p ON p.product_id = PF.product_id
         INNER JOIN T_POS_ITEM i ON i.item_id = p.item_id
         WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1 AND i.visible_for_web = 1) AS plus_web,
      (SELECT COUNT(*) FROM PF INNER JOIN T_POS_PRODUCT p ON p.product_id = PF.product_id
         INNER JOIN T_POS_ITEM i ON i.item_id = p.item_id
         WHERE p.is_enabled = 1 AND p.is_visible_for_touch = 1 AND i.visible_for_web = 1 AND i.item_status_id = 1) AS plus_istat_1;
  `);
  console.table(burgerCheck.recordset);

  // Ver las hamburguesas que pasan cada filtro
  console.log('\n========== Detalle hamburguesas (family 1050) con flags ==========');
  const burgerDetails = await pool.request().query(`
    SELECT
      i.item_name,
      CAST(i.visible_for_web AS INT) AS ivw,
      i.item_status_id AS istat,
      CAST(p.is_enabled AS INT) AS penab,
      CAST(p.is_visible_for_touch AS INT) AS pvtouch
    FROM T_POS_PRODUCT_FAMILY pf
    INNER JOIN T_POS_PRODUCT p ON p.product_id = pf.product_id
    INNER JOIN T_POS_ITEM i ON i.item_id = p.item_id
    WHERE pf.family_id = 1050 AND pf.is_family_default = 1
    ORDER BY i.item_name;
  `);
  console.table(burgerDetails.recordset);

  await pool.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
