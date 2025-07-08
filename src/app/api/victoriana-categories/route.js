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
    
    // Obtener departamentos con sus productos activos
    const departmentsResult = await pool.request().query(`
      SELECT 
        d.C_CODIGO as codigo_departamento,
        d.C_DESCRIPCIO as nombre_departamento,
        d.C_GRUPO as grupo_departamento,
        COUNT(p.c_Codigo) as total_productos_activos
      FROM MA_DEPARTAMENTOS d
      LEFT JOIN MA_PRODUCTOS p ON d.C_CODIGO = p.c_Departamento AND p.n_Activo = 1
      GROUP BY d.C_CODIGO, d.C_DESCRIPCIO, d.C_GRUPO
      HAVING COUNT(p.c_Codigo) > 0
      ORDER BY d.C_DESCRIPCIO
    `);
    
    // Obtener grupos con productos activos por departamento
    const groupsResult = await pool.request().query(`
      SELECT 
        d.C_CODIGO as codigo_departamento,
        d.C_DESCRIPCIO as nombre_departamento,
        g.c_CODIGO as codigo_grupo,
        g.C_DESCRIPCIO as nombre_grupo,
        COUNT(p.c_Codigo) as productos_activos
      FROM MA_DEPARTAMENTOS d
      INNER JOIN MA_GRUPOS g ON d.C_CODIGO = g.c_departamento
      LEFT JOIN MA_PRODUCTOS p ON g.c_CODIGO = p.c_Grupo AND p.n_Activo = 1
      GROUP BY d.C_CODIGO, d.C_DESCRIPCIO, g.c_CODIGO, g.C_DESCRIPCIO
      HAVING COUNT(p.c_Codigo) > 0
      ORDER BY d.C_DESCRIPCIO, g.C_DESCRIPCIO
    `);
    
    // Obtener algunos productos de ejemplo por departamento
    const sampleProductsResult = await pool.request().query(`
      SELECT 
        d.C_CODIGO as codigo_departamento,
        d.C_DESCRIPCIO as nombre_departamento,
        p.c_Codigo,
        p.c_Descri,
        p.n_Precio1,
        p.c_Marca
      FROM MA_DEPARTAMENTOS d
      INNER JOIN MA_PRODUCTOS p ON d.C_CODIGO = p.c_Departamento
      WHERE p.n_Activo = 1 AND p.n_Precio1 > 0
      AND p.c_Codigo IN (
        SELECT TOP 3 c_Codigo 
        FROM MA_PRODUCTOS p2 
        WHERE p2.c_Departamento = d.C_CODIGO AND p2.n_Activo = 1
        ORDER BY p2.c_Codigo
      )
      ORDER BY d.C_DESCRIPCIO, p.c_Codigo
    `);
    
    await pool.close();

    return new Response(JSON.stringify({ 
      departments: departmentsResult.recordset,
      groups: groupsResult.recordset,
      sample_products: sampleProductsResult.recordset,
      summary: {
        total_departments: departmentsResult.recordset.length,
        total_groups: groupsResult.recordset.length
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Categories query error:', error);
    
    return new Response(JSON.stringify({
      error: 'Database error',
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}