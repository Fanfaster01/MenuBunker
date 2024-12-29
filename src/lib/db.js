const sql = require('mssql');

const config = {
  user: 'poweruser',
  password: 'k8a3z7up',
  server: '192.168.65.250',
  database: 'XETUXPOS',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

// Crear un pool global
let pool = null;

async function getPool() {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
}

async function getProductPrice(itemId) {
  try {
    const pool = await getPool();
    
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
    return null;
  }
}

module.exports = {
  getProductPrice
};