// Fase 3 — SOLO LECTURA
// Verificaciones:
//  (a) Status de las 148 familias (cuántas habilitadas vs deshabilitadas)
//  (b) TODOS los product rows de los 21 items (no solo el primero)
//  (c) Mapear familias por nombre (DESAYUNOS, ENTRADAS, etc.)

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

// Nombres de familias que nos interesan (tomados de la imagen)
const TARGET_FAMILY_NAMES = [
  'DESAYUNOS', 'ENTRADAS', 'PRINCIPALES', 'CORTES AL CARBON',
  'HAMBURGUESAS', 'ENSALADAS', 'BEBIDAS', 'MENU INFANTIL',
  'CAFE / TODDY', 'CONTORNOS', 'EXTRAS',
  'POSTRES', 'CHORIPANES', 'GRILL MASTER 2026',
  'MERENGADAS', 'JUGOS NATURALES', 'JUGOS VERDES',
  'FRAPPUCCINOS', 'INFUSIONES FRIAS / CALIENTES',
  'CERVEZAS', 'COCTELES', 'TRAGOS', 'VINOS POR BOTELLA',
  'BEBIDAS VARIAS', 'BEBIDAS ALCOHOLICAS', 'CAFETIN',
  'MENU', 'DESCORCHES', 'DELIVERY', 'SERVICIOS POR BOTELLA',
];

async function main() {
  console.log('Connecting to Xetux DB...\n');
  const pool = await sql.connect(config);

  // ============================================================
  console.log('==================================================');
  console.log('A) Distribución de family_status_id (148 familias)');
  console.log('==================================================');
  const statusDist = await pool.request().query(`
    SELECT
      f.family_status_id,
      COUNT(*) AS count
    FROM T_POS_FAMILY f
    GROUP BY f.family_status_id
    ORDER BY count DESC;
  `);
  console.table(statusDist.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('A.2) Tabla T_POS_FAMILY_STATUS (significados)');
  console.log('==================================================');
  try {
    const fstatus = await pool.request().query(`SELECT * FROM T_POS_FAMILY_STATUS ORDER BY 1;`);
    console.table(fstatus.recordset);
  } catch (e) {
    console.log('  no existe o error:', e.message);
  }

  // ============================================================
  console.log('\n==================================================');
  console.log('B) Familias con status_id = 0 (probablemente Habilitadas) — por nombre');
  console.log('==================================================');
  const enabledFamilies = await pool.request().query(`
    SELECT
      family_id,
      family_name,
      family_description,
      family_parent_id,
      family_status_id,
      family_position,
      family_type_id,
      updated_at
    FROM T_POS_FAMILY
    WHERE family_status_id = 0
    ORDER BY family_name;
  `);
  console.table(enabledFamilies.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('C) Familias específicas del menú digital (match por nombre exacto)');
  console.log('==================================================');
  const targetList = TARGET_FAMILY_NAMES.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
  const matched = await pool.request().query(`
    SELECT
      family_id,
      family_name,
      family_status_id,
      family_parent_id,
      family_position,
      family_type_id
    FROM T_POS_FAMILY
    WHERE family_name IN (${targetList})
    ORDER BY family_name;
  `);
  console.table(matched.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('D) TODOS los product rows de los 21 items (no solo el primero)');
  console.log('==================================================');
  const allProducts = await pool.request().query(`
    SELECT
      i.item_id,
      i.item_name,
      p.product_id,
      p.family_id,
      f.family_name,
      p.sale_price_1,
      p.is_enabled,
      p.is_visible_for_touch,
      p.product_position,
      p.applyDigitalMenu
    FROM T_POS_ITEM i
    LEFT JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    LEFT JOIN T_POS_FAMILY f ON f.family_id = p.family_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    ORDER BY i.item_id, p.product_id;
  `);
  console.table(allProducts.recordset);

  console.log('\n==================================================');
  console.log('D.2) Resumen: cuántos product rows por item_id');
  console.log('==================================================');
  const productCount = await pool.request().query(`
    SELECT
      i.item_id,
      i.item_name,
      COUNT(p.product_id) AS product_count,
      COUNT(p.family_id) AS with_family,
      COUNT(*) - COUNT(p.family_id) AS without_family
    FROM T_POS_ITEM i
    LEFT JOIN T_POS_PRODUCT p ON p.item_id = i.item_id
    WHERE i.item_id IN (${BUNKER_IDS.join(',')})
    GROUP BY i.item_id, i.item_name
    ORDER BY i.item_id;
  `);
  console.table(productCount.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('E) Para las familias habilitadas del menú, conteo de items visibles');
  console.log('==================================================');
  const familyItemCount = await pool.request().query(`
    SELECT
      f.family_id,
      f.family_name,
      COUNT(DISTINCT i.item_id) AS items_visible_web
    FROM T_POS_FAMILY f
    LEFT JOIN T_POS_PRODUCT p ON p.family_id = f.family_id
    LEFT JOIN T_POS_ITEM i ON i.item_id = p.item_id AND i.visible_for_web = 1
    WHERE f.family_status_id = 0
      AND f.family_name IN (${targetList})
    GROUP BY f.family_id, f.family_name
    ORDER BY f.family_name;
  `);
  console.table(familyItemCount.recordset);

  await pool.close();
  console.log('\n✅ Exploración fase 3 completada.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.originalError) console.error('  original:', err.originalError.message);
  process.exit(1);
});
