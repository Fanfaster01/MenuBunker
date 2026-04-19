// Script de exploración de la DB de Xetux
// Uso: node scripts/explore-xetux.js
// Objetivo: entender qué tablas existen, schemas, y mapeo de items del menú

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

// Cargar .env manualmente (sin dep externa)
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  // Strip surrounding quotes if present
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
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

async function main() {
  console.log('Connecting to Xetux DB...');
  console.log(`  server=${config.server}  db=${config.database}  user=${config.user}\n`);

  const pool = await sql.connect(config);

  // ============================================================
  // 1) Listar todas las tablas (T_POS_*, T_MENU_*, etc.)
  // ============================================================
  console.log('==================================================');
  console.log('1) TABLAS en la DB (filtradas por patrones relevantes)');
  console.log('==================================================');
  const tables = await pool.request().query(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name,
      p.rows AS row_count
    FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
    WHERE
      t.name LIKE 'T_POS%'
      OR t.name LIKE 'T_MENU%'
      OR t.name LIKE '%CATEGORY%'
      OR t.name LIKE '%GROUP%'
      OR t.name LIKE '%ITEM%'
      OR t.name LIKE '%PRODUCT%'
      OR t.name LIKE '%DEPARTMENT%'
      OR t.name LIKE '%TAX%'
    ORDER BY t.name;
  `);
  console.table(tables.recordset);

  // ============================================================
  // 2) Schema de T_POS_ITEM
  // ============================================================
  console.log('\n==================================================');
  console.log('2) SCHEMA de T_POS_ITEM');
  console.log('==================================================');
  const itemSchema = await pool.request().query(`
    SELECT
      COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_ITEM'
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(itemSchema.recordset);

  // ============================================================
  // 3) Schema de T_POS_PRODUCT
  // ============================================================
  console.log('\n==================================================');
  console.log('3) SCHEMA de T_POS_PRODUCT');
  console.log('==================================================');
  const prodSchema = await pool.request().query(`
    SELECT
      COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_PRODUCT'
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(prodSchema.recordset);

  // ============================================================
  // 4) Sample: item_id 7217 (TABLA DE EMBUTIDOS)
  // ============================================================
  console.log('\n==================================================');
  console.log('4) MUESTRA item_id=7217 (TABLA DE EMBUTIDOS según EntradaSection.js)');
  console.log('==================================================');
  const sampleItem = await pool.request()
    .input('id', sql.Int, 7217)
    .query(`
      SELECT TOP 1 *
      FROM T_POS_ITEM
      WHERE item_id = @id;
    `);
  console.log('T_POS_ITEM row:');
  console.log(JSON.stringify(sampleItem.recordset[0], null, 2));

  const sampleProd = await pool.request()
    .input('id', sql.Int, 7217)
    .query(`
      SELECT TOP 1 *
      FROM T_POS_PRODUCT
      WHERE item_id = @id;
    `);
  console.log('\nT_POS_PRODUCT row:');
  console.log(JSON.stringify(sampleProd.recordset[0], null, 2));

  // ============================================================
  // 5) Todos los items usados por Bunker (todos los IDs hardcoded)
  // ============================================================
  console.log('\n==================================================');
  console.log('5) ITEMS usados actualmente por Bunker (para validar existencia)');
  console.log('==================================================');
  const bunkerIds = [
    // entradas
    7217, 7216, 2456, 3624, 4115, 7061, 2346, 6441, 7115, 6415,
    // placeholders que vimos en logs
    6729, 6731, 6734, 6737, 6741, 6728, 6743, 6747, 6744, 6745, 6791, 8112,
  ];
  const checks = await pool.request().query(`
    SELECT
      i.item_id,
      i.item_name,
      i.tax_id,
      p.sale_price_1
    FROM T_POS_ITEM i
    LEFT JOIN T_POS_PRODUCT p ON i.item_id = p.item_id
    WHERE i.item_id IN (${bunkerIds.join(',')})
    ORDER BY i.item_id;
  `);
  console.table(checks.recordset);

  // ============================================================
  // 6) ¿Existe alguna tabla de categorías/grupos/departamentos?
  // ============================================================
  console.log('\n==================================================');
  console.log('6) Columnas de T_POS_ITEM que podrían servir de categoría');
  console.log('==================================================');
  const possibleCats = await pool.request().query(`
    SELECT DISTINCT
      COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'T_POS_ITEM'
      AND (
        COLUMN_NAME LIKE '%category%'
        OR COLUMN_NAME LIKE '%group%'
        OR COLUMN_NAME LIKE '%dept%'
        OR COLUMN_NAME LIKE '%class%'
        OR COLUMN_NAME LIKE '%type%'
        OR COLUMN_NAME LIKE '%section%'
      );
  `);
  console.table(possibleCats.recordset);

  // ============================================================
  // 7) Buscar posibles tablas relacionadas (FKs de T_POS_ITEM)
  // ============================================================
  console.log('\n==================================================');
  console.log('7) FOREIGN KEYS que salen de T_POS_ITEM');
  console.log('==================================================');
  const fks = await pool.request().query(`
    SELECT
      fk.name AS fk_name,
      tp.name AS parent_table,
      cp.name AS parent_column,
      tr.name AS ref_table,
      cr.name AS ref_column
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tp.name = 'T_POS_ITEM';
  `);
  console.table(fks.recordset);

  await pool.close();
  console.log('\n✅ Exploración completada.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.originalError) console.error('  original:', err.originalError.message);
  process.exit(1);
});
