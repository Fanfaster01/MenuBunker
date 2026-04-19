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

  console.log('\n========== Escenarios de conteo ==========');
  const r = await pool.request().query(`
    WITH PF AS (SELECT DISTINCT product_id FROM T_POS_PRODUCT_FAMILY WHERE is_family_default = 1)
    SELECT
      -- Solo item_status_id=1
      (SELECT COUNT(DISTINCT i.item_id)
         FROM T_POS_ITEM i INNER JOIN T_POS_PRODUCT p ON p.item_id = i.item_id INNER JOIN PF ON PF.product_id = p.product_id
         WHERE i.item_status_id = 1) AS only_status_1,
      -- Solo visible_for_web=1
      (SELECT COUNT(DISTINCT i.item_id)
         FROM T_POS_ITEM i INNER JOIN T_POS_PRODUCT p ON p.item_id = i.item_id INNER JOIN PF ON PF.product_id = p.product_id
         WHERE i.visible_for_web = 1) AS only_visible_web,
      -- Ambos (actual)
      (SELECT COUNT(DISTINCT i.item_id)
         FROM T_POS_ITEM i INNER JOIN T_POS_PRODUCT p ON p.item_id = i.item_id INNER JOIN PF ON PF.product_id = p.product_id
         WHERE i.item_status_id = 1 AND i.visible_for_web = 1) AS both,
      -- status=1 AND NOT visible (ocultos pero activos)
      (SELECT COUNT(DISTINCT i.item_id)
         FROM T_POS_ITEM i INNER JOIN T_POS_PRODUCT p ON p.item_id = i.item_id INNER JOIN PF ON PF.product_id = p.product_id
         WHERE i.item_status_id = 1 AND i.visible_for_web = 0) AS status_1_not_visible_web;
  `);
  console.table(r.recordset);

  // Ver cuáles items son activos pero no visibles en web
  console.log('\n========== Items status=1 pero visible_for_web=0 ==========');
  const hidden = await pool.request().query(`
    SELECT DISTINCT i.item_id, i.item_name, pf.family_id, f.family_name
    FROM T_POS_ITEM i
    INNER JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    INNER JOIN T_POS_PRODUCT_FAMILY pf ON pf.product_id = p.product_id AND pf.is_family_default = 1
    LEFT JOIN T_POS_FAMILY f ON f.family_id = pf.family_id
    WHERE i.item_status_id = 1 AND i.visible_for_web = 0
    ORDER BY f.family_name, i.item_name;
  `);
  console.table(hidden.recordset);

  await pool.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
