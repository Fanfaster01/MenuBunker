const sql = require('mssql');

const config = {
    user: process.env.VICTORIANA_DB_USER,
    password: process.env.VICTORIANA_DB_PASSWORD,
    server: process.env.VICTORIANA_DB_HOST,
    database: process.env.VICTORIANA_DB_NAME,
    port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
    options: {
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      encrypt: process.env.DB_ENCRYPT !== 'false',
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };

export async function getVictorianaProductPrice(itemId) {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('itemId', sql.Int, itemId)
      .query(`
        SELECT 
          p.sale_price_1,
          i.tax_id
        FROM T_POS_PRODUCT p
        JOIN T_POS_ITEM i ON p.item_id = i.item_id
        WHERE i.item_id = @itemId
      `);
    
    if (result.recordset.length > 0) {
      const { sale_price_1, tax_id } = result.recordset[0];
      const finalPrice = tax_id === 2 ? sale_price_1 * 1.16 : sale_price_1;
      return finalPrice;
    }
    
    return null;
  } catch (err) {
    console.error('Error al obtener el precio de La Victoriana:', err);
    throw err;
  }
}

// Funciones de exploración de base de datos
export async function getVictorianaTables() {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .query(`
        SELECT 
          TABLE_NAME,
          TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
    
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener tablas:', err);
    throw err;
  }
}

export async function getVictorianaTableStructure(tableName) {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('tableName', sql.NVarChar, tableName)
      .query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `);
    
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener estructura de tabla:', err);
    throw err;
  }
}

export async function getVictorianaSampleData(tableName, limit = 10) {
  try {
    const pool = await sql.connect(config);
    
    // Sanitizar el nombre de la tabla para evitar inyección SQL
    const safeTableName = tableName.replace(/[^\w]/g, '');
    
    const result = await pool.request()
      .query(`
        SELECT TOP ${parseInt(limit)} *
        FROM ${safeTableName}
      `);
    
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener datos de ejemplo:', err);
    throw err;
  }
}