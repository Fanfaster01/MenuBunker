// Fase 6 — FINAL READ ONLY: mapeo definitivo de nuestros 21 items a sus familias reales.
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

  console.log('\n========== Mapeo definitivo: 21 items → sus familias en T_POS_PRODUCT_FAMILY ==========');
  const r = await pool.request().query(`
    SELECT
      i.item_id, i.item_name, p.product_id,
      pf.family_id, f.family_name, f.family_status_id,
      pf.is_family_default, pf.product_position
    FROM T_POS_ITEM i
    JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    LEFT JOIN T_POS_PRODUCT_FAMILY pf ON pf.product_id = p.product_id
    LEFT JOIN T_POS_FAMILY f ON f.family_id = pf.family_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY i.item_id, pf.is_family_default DESC, f.family_name;
  `);
  console.table(r.recordset);

  console.log('\n========== Sumario: una fila por item (su familia default) ==========');
  const d = await pool.request().query(`
    SELECT
      i.item_id, i.item_name,
      pf.family_id, f.family_name, f.family_status_id
    FROM T_POS_ITEM i
    JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    JOIN T_POS_PRODUCT_FAMILY pf ON pf.product_id = p.product_id AND pf.is_family_default = 1
    LEFT JOIN T_POS_FAMILY f ON f.family_id = pf.family_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY pf.family_id, i.item_id;
  `);
  console.table(d.recordset);

  console.log('\n========== T_POS_MENU: ¿qué menús existen? ==========');
  try {
    const m = await pool.request().query(`SELECT * FROM T_POS_MENU;`).catch(()=>null);
    if (m) console.log(JSON.stringify(m.recordset, null, 2));
  } catch(e) { console.log('  T_POS_MENU no existe o:', e.message); }

  console.log('\n========== T_POS_WEB_SYSTEM (para external_system_id=6) ==========');
  try {
    const m = await pool.request().query(`SELECT TOP 20 * FROM T_POS_EXTERNAL_SYSTEM;`).catch(()=>null);
    if (m) console.log(JSON.stringify(m.recordset.slice(0, 10), null, 2));
  } catch(e) { /* ignore */ }

  await pool.close();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
