/** Debug: ¿por qué algunos items no pasan los filtros del sync? */
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
const BUNKER_IDS = [7217,7216,2456,3624,4115,7061,2346,6441,7115,6415,6729,6731,6734,6737,6741,6728,6743,6747,6744,6745,6791];

async function main() {
  const pool = await sql.connect(config);

  console.log('========== Estado de cada filtro para los 21 items ==========');
  const r = await pool.request().query(`
    SELECT
      i.item_id,
      i.item_name,
      CAST(i.visible_for_web AS INT) AS visible_for_web,
      CAST(i.allows_sale AS INT)     AS allows_sale,
      i.item_status_id,
      p.product_id,
      CAST(p.is_enabled AS INT)      AS product_is_enabled,
      (SELECT COUNT(*) FROM T_POS_PRODUCT_FAMILY pf WHERE pf.product_id = p.product_id) AS pf_total,
      (SELECT COUNT(*) FROM T_POS_PRODUCT_FAMILY pf WHERE pf.product_id = p.product_id AND pf.is_family_default = 1) AS pf_default_count
    FROM T_POS_ITEM i
    LEFT JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY i.item_id;
  `);
  console.table(r.recordset);

  // Count totals por filtro (sanity check)
  console.log('\n========== Totales por filtro ==========');
  const tots = await pool.request().query(`
    SELECT
      SUM(CASE WHEN i.visible_for_web = 1 THEN 1 ELSE 0 END) AS visible_web,
      SUM(CASE WHEN i.allows_sale = 1     THEN 1 ELSE 0 END) AS allows_sale,
      SUM(CASE WHEN i.item_status_id = 1  THEN 1 ELSE 0 END) AS status_1,
      COUNT(*) AS total
    FROM T_POS_ITEM i;
  `);
  console.table(tots.recordset);

  // Item_status_id distribution
  console.log('\n========== Distribución item_status_id ==========');
  const statDist = await pool.request().query(`
    SELECT i.item_status_id, COUNT(*) AS count FROM T_POS_ITEM i GROUP BY i.item_status_id;
  `);
  console.table(statDist.recordset);

  try {
    const stat = await pool.request().query(`SELECT * FROM T_POS_ITEM_STATUS;`);
    console.log('T_POS_ITEM_STATUS:', JSON.stringify(stat.recordset, null, 2));
  } catch(e) {}

  await pool.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
