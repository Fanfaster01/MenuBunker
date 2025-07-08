import sql from 'mssql';

export async function GET() {
  const config = {
    user: "sa",
    password: "k1i2r3a4",
    server: "192.168.88.26",
    port: 14333,
    options: {
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };

  try {
    const pool = await sql.connect(config);
    
    // Listar todas las bases de datos
    const result = await pool.request().query(`
      SELECT 
        name as database_name,
        database_id,
        create_date,
        collation_name,
        state_desc
      FROM sys.databases 
      WHERE state = 0  -- Solo bases de datos online
      ORDER BY name
    `);
    
    await pool.close();

    return new Response(JSON.stringify({ 
      databases: result.recordset,
      server_info: {
        server: "192.168.88.26",
        port: 14333,
        connected_to: "master"
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database list error:', error);
    
    return new Response(JSON.stringify({
      error: 'Database error',
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}