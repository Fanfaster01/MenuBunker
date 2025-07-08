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
    
    // Probar consultas paso a paso
    const tests = [];
    
    // Test 1: Verificar tabla departamentos
    try {
      const test1 = await pool.request().query(`
        SELECT TOP 1 * FROM MA_DEPARTAMENTOS
      `);
      tests.push({
        test: 'Tabla MA_DEPARTAMENTOS',
        status: 'OK',
        columns: Object.keys(test1.recordset[0] || {})
      });
    } catch (e) {
      tests.push({
        test: 'Tabla MA_DEPARTAMENTOS',
        status: 'ERROR',
        error: e.message
      });
    }
    
    // Test 2: Verificar columnas de departamentos
    try {
      const test2 = await pool.request().query(`
        SELECT TOP 1 C_CODIGO, C_DESCRIPCIO FROM MA_DEPARTAMENTOS
      `);
      tests.push({
        test: 'Columnas departamentos',
        status: 'OK',
        sample: test2.recordset[0]
      });
    } catch (e) {
      tests.push({
        test: 'Columnas departamentos',
        status: 'ERROR',
        error: e.message
      });
    }
    
    // Test 3: Verificar tabla productos
    try {
      const test3 = await pool.request().query(`
        SELECT TOP 1 * FROM MA_PRODUCTOS
      `);
      tests.push({
        test: 'Tabla MA_PRODUCTOS',
        status: 'OK',
        columns: Object.keys(test3.recordset[0] || {})
      });
    } catch (e) {
      tests.push({
        test: 'Tabla MA_PRODUCTOS',
        status: 'ERROR',
        error: e.message
      });
    }
    
    // Test 4: Verificar columnas de productos
    try {
      const test4 = await pool.request().query(`
        SELECT TOP 1 c_Codigo, c_Departamento, n_Activo, n_Precio1 FROM MA_PRODUCTOS
      `);
      tests.push({
        test: 'Columnas productos',
        status: 'OK',
        sample: test4.recordset[0]
      });
    } catch (e) {
      tests.push({
        test: 'Columnas productos',
        status: 'ERROR',
        error: e.message
      });
    }
    
    // Test 5: Probar query completa
    try {
      const test5 = await pool.request().query(`
        SELECT 
          d.C_CODIGO as codigo,
          d.C_DESCRIPCIO as nombre,
          COUNT(p.c_Codigo) as total_productos
        FROM MA_DEPARTAMENTOS d
        LEFT JOIN MA_PRODUCTOS p ON d.C_CODIGO = p.c_Departamento 
          AND p.n_Activo = 1 
          AND p.n_Precio1 > 0
        WHERE d.C_CODIGO != '08'
        GROUP BY d.C_CODIGO, d.C_DESCRIPCIO
        HAVING COUNT(p.c_Codigo) > 0
        ORDER BY d.C_DESCRIPCIO
      `);
      tests.push({
        test: 'Query completa',
        status: 'OK',
        rowCount: test5.recordset.length
      });
    } catch (e) {
      tests.push({
        test: 'Query completa',
        status: 'ERROR',
        error: e.message
      });
    }
    
    await pool.close();

    return new Response(JSON.stringify({
      config: {
        server: config.server,
        database: config.database,
        port: config.port
      },
      tests: tests
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Connection test error:', error);
    
    return new Response(JSON.stringify({
      error: 'Error de conexión',
      details: error.message,
      code: error.code
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}