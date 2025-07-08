import sql from 'mssql';

export async function GET() {
  const config = {
    user: process.env.VICTORIANA_DB_USER,
    password: process.env.VICTORIANA_DB_PASSWORD,
    server: process.env.VICTORIANA_DB_HOST,
    database: process.env.VICTORIANA_DB_NAME,
    port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
    options: {
      trustServerCertificate: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE !== 'false',
      encrypt: process.env.VICTORIANA_DB_ENCRYPT === 'true',
      enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };

  try {
    const pool = await sql.connect(config);
    
    // Obtener estructura de la tabla
    const structureResult = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'MA_PRODUCTOS'
      ORDER BY ORDINAL_POSITION
    `);
    
    // Obtener algunos datos de ejemplo
    const sampleResult = await pool.request().query(`
      SELECT TOP 10 *
      FROM MA_PRODUCTOS
      ORDER BY CODIGO
    `);
    
    // Contar total de productos
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total_productos
      FROM MA_PRODUCTOS
    `);
    
    await pool.close();

    return new Response(JSON.stringify({ 
      table_structure: structureResult.recordset,
      sample_data: sampleResult.recordset,
      total_products: countResult.recordset[0].total_productos,
      table_info: {
        table_name: "MA_PRODUCTOS",
        database: process.env.VICTORIANA_DB_NAME,
        sample_size: sampleResult.recordset.length
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Product query error:', error);
    
    return new Response(JSON.stringify({
      error: 'Database error',
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}