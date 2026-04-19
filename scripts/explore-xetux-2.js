// Fase 2 de exploración — SOLO LECTURA
// Uso: node scripts/explore-xetux-2.js
// Objetivo:
//   (a) Mapear family_id → nombre para las 148 familias
//   (b) family_id de cada uno de los 21 items actuales del menú
//   (c) Explorar T_POS_ITEM_CATEGORY como alternativa
//   (d) Entender el modelo de modifiers (T_POS_ADDITIONAL_*)

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
});

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { trustServerCertificate: true, encrypt: false, enableArithAbort: true },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

const BUNKER_IDS = [
  7217, 7216, 2456, 3624, 4115, 7061, 2346, 6441, 7115, 6415,
  6729, 6731, 6734, 6737, 6741, 6728, 6743, 6747, 6744, 6745, 6791,
];

async function main() {
  console.log('Connecting to Xetux DB...\n');
  const pool = await sql.connect(config);

  // ============================================================
  console.log('==================================================');
  console.log('A.1) SCHEMA de T_POS_FAMILY');
  console.log('==================================================');
  const famSchema = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_FAMILY'
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(famSchema.recordset);

  console.log('\n==================================================');
  console.log('A.2) TOP 30 familias (por nombre)');
  console.log('==================================================');
  // Adapt dynamic column names: family_id + family_name (likely)
  const famCols = famSchema.recordset.map(r => r.COLUMN_NAME);
  const nameCol = famCols.find(c => c.toLowerCase().includes('name')) || famCols[1];
  const idCol = famCols.find(c => c.toLowerCase() === 'family_id') || famCols[0];
  const statusCol = famCols.find(c => c.toLowerCase().includes('status'));
  console.log(`  Using id=${idCol}, name=${nameCol}`);
  const families = await pool.request().query(`
    SELECT TOP 30 ${idCol} AS id, ${nameCol} AS name${statusCol ? ', ' + statusCol + ' AS status' : ''}
    FROM T_POS_FAMILY
    ORDER BY ${nameCol};
  `);
  console.table(families.recordset);

  console.log('\n==================================================');
  console.log('A.3) Todas las familias con conteo de productos asignados');
  console.log('==================================================');
  const famCounts = await pool.request().query(`
    SELECT
      f.${idCol} AS family_id,
      f.${nameCol} AS family_name,
      COUNT(p.product_id) AS product_count
    FROM T_POS_FAMILY f
    LEFT JOIN T_POS_PRODUCT p ON p.family_id = f.${idCol}
    GROUP BY f.${idCol}, f.${nameCol}
    HAVING COUNT(p.product_id) > 0
    ORDER BY COUNT(p.product_id) DESC;
  `);
  console.table(famCounts.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('B) family_id / family_name de los 21 items actuales del menú');
  console.log('==================================================');
  const itemsWithFam = await pool.request().query(`
    SELECT
      i.item_id,
      i.item_name,
      p.family_id,
      f.${nameCol} AS family_name,
      p.sale_price_1,
      p.applyDigitalMenu,
      p.applyEcommerce,
      i.visible_for_web
    FROM T_POS_ITEM i
    LEFT JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    LEFT JOIN T_POS_FAMILY f ON f.${idCol} = p.family_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY p.family_id, i.item_id;
  `);
  console.table(itemsWithFam.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('C) SCHEMA de T_POS_ITEM_CATEGORY');
  console.log('==================================================');
  const catSchema = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_ITEM_CATEGORY'
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(catSchema.recordset);

  console.log('\n==================================================');
  console.log('C.2) Todas las T_POS_ITEM_CATEGORY');
  console.log('==================================================');
  try {
    const allCats = await pool.request().query(`SELECT TOP 50 * FROM T_POS_ITEM_CATEGORY ORDER BY 1;`);
    console.table(allCats.recordset);
  } catch (e) {
    console.log('  Error:', e.message);
  }

  // ============================================================
  console.log('\n==================================================');
  console.log('D) MODIFIERS: schemas y conteos');
  console.log('==================================================');
  for (const t of ['T_POS_ADDITIONALS_CATEGORY', 'T_POS_ADDITIONAL_CATEGORY_PRODUCT', 'T_POS_ADDITIONAL_ITEM']) {
    console.log(`\n-- Schema ${t}:`);
    const s = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${t}'
      ORDER BY ORDINAL_POSITION;
    `);
    console.table(s.recordset);
  }

  console.log('\n==================================================');
  console.log('D.2) Sample T_POS_ADDITIONALS_CATEGORY (top 15)');
  console.log('==================================================');
  const adcats = await pool.request().query(`SELECT TOP 15 * FROM T_POS_ADDITIONALS_CATEGORY ORDER BY 1;`);
  console.table(adcats.recordset);

  console.log('\n==================================================');
  console.log('D.3) Sample T_POS_ADDITIONAL_ITEM (top 20)');
  console.log('==================================================');
  const aditems = await pool.request().query(`SELECT TOP 20 * FROM T_POS_ADDITIONAL_ITEM ORDER BY 1;`);
  console.table(aditems.recordset);

  console.log('\n==================================================');
  console.log('D.4) Sample T_POS_ADDITIONAL_CATEGORY_PRODUCT (top 20)');
  console.log('==================================================');
  const adprod = await pool.request().query(`SELECT TOP 20 * FROM T_POS_ADDITIONAL_CATEGORY_PRODUCT ORDER BY 1;`);
  console.table(adprod.recordset);

  // ============================================================
  // E) ¿Alguno de nuestros 21 items tiene modifiers asociados?
  // ============================================================
  console.log('\n==================================================');
  console.log('E) Modifiers asociados a los 21 items actuales');
  console.log('==================================================');
  try {
    const itemMods = await pool.request().query(`
      SELECT DISTINCT
        i.item_id,
        i.item_name,
        p.product_id
      FROM T_POS_ITEM i
      JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
      JOIN T_POS_ADDITIONAL_CATEGORY_PRODUCT acp ON acp.product_id = p.product_id
      WHERE i.item_id IN (${BUNKER_IDS.join(',')})
      ORDER BY i.item_id;
    `);
    console.table(itemMods.recordset);
  } catch (e) {
    console.log('  Note (quiz schema diferente):', e.message);
  }

  // ============================================================
  // F) DIGITAL_MENU tables — ¿hay algo ya configurado?
  // ============================================================
  console.log('\n==================================================');
  console.log('F) T_POS_DIGITAL_MENU_CONFIG (schema + sample)');
  console.log('==================================================');
  const dmSchema = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_DIGITAL_MENU_CONFIG' ORDER BY ORDINAL_POSITION;
  `);
  console.table(dmSchema.recordset);
  const dmSample = await pool.request().query(`SELECT TOP 5 * FROM T_POS_DIGITAL_MENU_CONFIG;`);
  console.log('Sample rows:');
  console.log(JSON.stringify(dmSample.recordset, null, 2));

  await pool.close();
  console.log('\n✅ Exploración fase 2 completada.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.originalError) console.error('  original:', err.originalError.message);
  process.exit(1);
});
