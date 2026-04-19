// Fase 4 — SOLO LECTURA
// Investigación: encontrar la relación real item/product → familia
// Hipótesis: debe existir una tabla join o campo extra que conecte nuestros 21 items a alguna familia.

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
  console.log('A) Todas las tablas que contienen columna family_id');
  console.log('==================================================');
  const tablesWithFamily = await pool.request().query(`
    SELECT
      TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE COLUMN_NAME = 'family_id'
    ORDER BY TABLE_NAME;
  `);
  console.table(tablesWithFamily.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('B) Todas las tablas que contienen columna product_id');
  console.log('==================================================');
  const tablesWithProduct = await pool.request().query(`
    SELECT
      TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE COLUMN_NAME = 'product_id'
    ORDER BY TABLE_NAME;
  `);
  console.table(tablesWithProduct.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('C) Todas las tablas con AMBOS: product_id Y family_id');
  console.log('==================================================');
  const joinTables = await pool.request().query(`
    SELECT
      t1.TABLE_NAME
    FROM INFORMATION_SCHEMA.COLUMNS t1
    JOIN INFORMATION_SCHEMA.COLUMNS t2
      ON t1.TABLE_NAME = t2.TABLE_NAME
    WHERE t1.COLUMN_NAME = 'product_id'
      AND t2.COLUMN_NAME = 'family_id'
    ORDER BY t1.TABLE_NAME;
  `);
  console.table(joinTables.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('D) Foreign keys que apuntan a T_POS_FAMILY');
  console.log('==================================================');
  const fksToFamily = await pool.request().query(`
    SELECT
      fk.name AS fk_name,
      tp.name AS child_table,
      cp.name AS child_column,
      tr.name AS parent_table,
      cr.name AS parent_column
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'T_POS_FAMILY'
    ORDER BY tp.name;
  `);
  console.table(fksToFamily.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('E) Foreign keys que apuntan a T_POS_PRODUCT');
  console.log('==================================================');
  const fksToProduct = await pool.request().query(`
    SELECT
      fk.name AS fk_name,
      tp.name AS child_table,
      cp.name AS child_column,
      tr.name AS parent_table,
      cr.name AS parent_column
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'T_POS_PRODUCT'
    ORDER BY tp.name;
  `);
  console.table(fksToProduct.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('F) Foreign keys que apuntan a T_POS_ITEM');
  console.log('==================================================');
  const fksToItem = await pool.request().query(`
    SELECT
      fk.name AS fk_name,
      tp.name AS child_table,
      cp.name AS child_column,
      tr.name AS parent_table,
      cr.name AS parent_column
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'T_POS_ITEM'
    ORDER BY tp.name;
  `);
  console.table(fksToItem.recordset);

  // ============================================================
  console.log('\n==================================================');
  console.log('G) Buscar en CUALQUIER tabla donde product_ids de nuestros items aparezcan junto a un family_id');
  console.log('==================================================');
  // Obtener los product_ids de nuestros items
  const prodIds = await pool.request().query(`
    SELECT product_id FROM T_POS_PRODUCT WHERE item_id IN (${BUNKER_IDS.join(',')});
  `);
  const productIds = prodIds.recordset.map(r => r.product_id);
  console.log('Our product_ids:', productIds);

  // Para cada tabla que tenga AMBAS columnas, hacer SELECT
  const bothCols = joinTables.recordset.map(r => r.TABLE_NAME);
  for (const tbl of bothCols) {
    if (tbl === 'T_POS_PRODUCT') continue; // ya sabemos que family_id es null ahí
    try {
      const q = await pool.request().query(`
        SELECT TOP 30 * FROM ${tbl}
        WHERE product_id IN (${productIds.join(',')})
           OR item_id IN (${BUNKER_IDS.join(',')})
      `).catch(() => null);
      if (q && q.recordset.length > 0) {
        console.log(`\n  >> ${tbl}: ${q.recordset.length} rows found for our items`);
        console.log(JSON.stringify(q.recordset.slice(0, 5), null, 2));
      } else {
        console.log(`  -- ${tbl}: 0 rows`);
      }
    } catch (e) {
      // Algunas tablas pueden no tener item_id; probar solo con product_id
      try {
        const q2 = await pool.request().query(`
          SELECT TOP 30 * FROM ${tbl} WHERE product_id IN (${productIds.join(',')})
        `);
        if (q2.recordset.length > 0) {
          console.log(`\n  >> ${tbl}: ${q2.recordset.length} rows (only product_id filter)`);
          console.log(JSON.stringify(q2.recordset.slice(0, 5), null, 2));
        } else {
          console.log(`  -- ${tbl}: 0 rows`);
        }
      } catch (e2) {
        console.log(`  -- ${tbl}: error ${e2.message}`);
      }
    }
  }

  // ============================================================
  console.log('\n==================================================');
  console.log('H) Sample de T_POS_BUTTON y T_POS_CONFIG_BUTTON (posible UI de menu)');
  console.log('==================================================');
  try {
    const btnSchema = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'T_POS_BUTTON' ORDER BY ORDINAL_POSITION;
    `);
    console.log('T_POS_BUTTON schema:');
    console.table(btnSchema.recordset);
  } catch (e) { console.log('  T_POS_BUTTON error:', e.message); }

  try {
    const cbtnSchema = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'T_POS_CONFIG_BUTTON' ORDER BY ORDINAL_POSITION;
    `);
    console.log('\nT_POS_CONFIG_BUTTON schema:');
    console.table(cbtnSchema.recordset);
    const cbtnSample = await pool.request().query(`SELECT TOP 10 * FROM T_POS_CONFIG_BUTTON;`);
    console.log('Sample:');
    console.log(JSON.stringify(cbtnSample.recordset.slice(0, 5), null, 2));
  } catch (e) { console.log('  T_POS_CONFIG_BUTTON error:', e.message); }

  // ============================================================
  console.log('\n==================================================');
  console.log('I) ¿Hay product rows donde NUESTROS items aparezcan con family_id no-null? (estricto)');
  console.log('==================================================');
  const strictFam = await pool.request().query(`
    SELECT p.*
    FROM T_POS_PRODUCT p
    WHERE p.item_id IN (${BUNKER_IDS.join(',')})
      AND p.family_id IS NOT NULL;
  `);
  console.log(`Rows con family_id no-null: ${strictFam.recordset.length}`);
  if (strictFam.recordset.length > 0) {
    console.log(JSON.stringify(strictFam.recordset.slice(0, 5), null, 2));
  }

  // ============================================================
  console.log('\n==================================================');
  console.log('J) family_id distribution across ALL T_POS_PRODUCT rows (no solo nuestros items)');
  console.log('==================================================');
  const overallFam = await pool.request().query(`
    SELECT
      SUM(CASE WHEN family_id IS NULL THEN 1 ELSE 0 END) AS total_null,
      SUM(CASE WHEN family_id = 0 THEN 1 ELSE 0 END) AS total_zero,
      SUM(CASE WHEN family_id > 0 THEN 1 ELSE 0 END) AS total_with_family,
      COUNT(*) AS total_products
    FROM T_POS_PRODUCT;
  `);
  console.table(overallFam.recordset);

  // Para entender: ¿family_id=0 significa "sin familia" en Xetux?
  console.log('\n==================================================');
  console.log('J.2) Top 10 family_ids más usados en T_POS_PRODUCT');
  console.log('==================================================');
  const topFam = await pool.request().query(`
    SELECT TOP 15
      p.family_id,
      f.family_name,
      f.family_status_id,
      COUNT(*) AS product_count
    FROM T_POS_PRODUCT p
    LEFT JOIN T_POS_FAMILY f ON f.family_id = p.family_id
    GROUP BY p.family_id, f.family_name, f.family_status_id
    ORDER BY COUNT(*) DESC;
  `);
  console.table(topFam.recordset);

  await pool.close();
  console.log('\n✅ Exploración fase 4 completada.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.originalError) console.error('  original:', err.originalError.message);
  process.exit(1);
});
