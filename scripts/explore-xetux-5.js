// Fase 5 — SOLO LECTURA. Quick check de 3 tablas candidatas + global count.

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('='); if (eq === -1) return;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
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

  const candidates = ['T_POS_PRODUCT_FAMILY', 'T_POS_MENU_FAMILY', 'T_POS_WEB_SYSTEM_FAMILY', 'T_POS_FIGURE_MENU_FAMILY', 'T_XSC_POS_PRODUCT_FAMILY', 'T_TABLET_FAMILY_IMAGE'];

  for (const tbl of candidates) {
    console.log(`\n========== ${tbl} ==========`);
    try {
      // Schema
      const schema = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tbl}' ORDER BY ORDINAL_POSITION;
      `);
      console.log('  schema:', schema.recordset.map(r => `${r.COLUMN_NAME}:${r.DATA_TYPE}`).join(', '));
      // Row count
      const cnt = await pool.request().query(`SELECT COUNT(*) AS c FROM ${tbl};`);
      console.log(`  total rows: ${cnt.recordset[0].c}`);
      // Sample
      const sample = await pool.request().query(`SELECT TOP 3 * FROM ${tbl};`);
      console.log('  sample rows:', JSON.stringify(sample.recordset, null, 2));
      // If has product_id, check our 21 products
      if (schema.recordset.some(r => r.COLUMN_NAME === 'product_id')) {
        const prodIds = [2308, 2373, 3516, 3783, 4841, 4859, 5146, 5147, 5149, 5152, 5155, 5159, 5161, 5162, 5163, 5165, 5209, 5338, 5380, 5475, 5476];
        const q = await pool.request().query(`SELECT * FROM ${tbl} WHERE product_id IN (${prodIds.join(',')});`);
        console.log(`  rows for our 21 products: ${q.recordset.length}`);
        if (q.recordset.length > 0) console.log(JSON.stringify(q.recordset.slice(0, 5), null, 2));
      }
      // If has item_id, check
      if (schema.recordset.some(r => r.COLUMN_NAME === 'item_id')) {
        const q = await pool.request().query(`SELECT * FROM ${tbl} WHERE item_id IN (${BUNKER_IDS.join(',')});`);
        console.log(`  rows for our 21 items: ${q.recordset.length}`);
        if (q.recordset.length > 0) console.log(JSON.stringify(q.recordset.slice(0, 5), null, 2));
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }

  // Also: check if there's a triggered audit view or logs that show family assignment
  console.log('\n\n========== Check: columnas relacionadas a "menu" o "category" en T_POS_PRODUCT ==========');
  const prodCols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_PRODUCT'
      AND (COLUMN_NAME LIKE '%menu%' OR COLUMN_NAME LIKE '%categ%' OR COLUMN_NAME LIKE '%group%');
  `);
  console.log(prodCols.recordset);

  console.log('\n========== Check: views que mencionen family en conjunto con product ==========');
  const views = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
    WHERE TABLE_NAME LIKE '%PRODUCT%FAMILY%' OR TABLE_NAME LIKE '%FAMILY%PRODUCT%' OR TABLE_NAME LIKE '%MENU%';
  `);
  console.table(views.recordset);

  await pool.close();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
