const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 1433,
  options: {
    trustServerCertificate: true,
    encrypt: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 5000
  },
  connectionTimeout: 5000,
  requestTimeout: 5000
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