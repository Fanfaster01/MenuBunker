const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_CERT === 'true',
      encrypt: process.env.DB_ENCRYPT === 'true' || (process.env.DB_ENCRYPT !== 'false' && process.env.DB_ENCRYPT !== 'not_set'),
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

export async function getProductPrice(itemId) {
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
    console.error('Error al obtener el precio:', err);
    throw err;
  }
}