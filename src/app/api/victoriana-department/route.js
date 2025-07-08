import sql from 'mssql';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');
  const group = searchParams.get('group');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

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

  if (!department) {
    return new Response(JSON.stringify({ error: 'Department parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const pool = await sql.connect(config);
    
    // Consulta simple sin JOINs - solo productos por código y estado
    let baseQuery = `
      SELECT 
        p.c_Codigo as codigo,
        p.c_Descri as descripcion,
        p.cu_Descripcion_Corta as descripcion_corta,
        p.n_Precio1 as precio,
        p.c_Marca as marca,
        p.c_Presenta as presentacion,
        p.n_Activo as activo,
        p.c_Departamento as departamento,
        p.c_Grupo as grupo
      FROM MA_PRODUCTOS p
      WHERE p.c_Departamento = @department 
        AND p.n_Activo = 1 
        AND p.n_Precio1 > 0`;

    // Agregar filtros
    if (group && group.trim()) {
      baseQuery += ` AND p.c_Grupo = @group`;
    }

    if (search && search.trim()) {
      baseQuery += ` AND p.c_Descri LIKE @search`;
    }

    // Construir consulta con paginación
    let query = `
      WITH ProductsCTE AS (
        ${baseQuery}
      ),
      RankedProducts AS (
        SELECT *, 
          ROW_NUMBER() OVER (ORDER BY codigo, descripcion) AS RowNum
        FROM ProductsCTE
      )`;

    const request = pool.request().input('department', sql.NVarChar, department);

    // Agregar parámetros de filtros
    if (group && group.trim()) {
      request.input('group', sql.NVarChar, group);
    }

    if (search && search.trim()) {
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
    }

    // Cerrar CTE y aplicar paginación
    query += `
      SELECT * FROM RankedProducts
      WHERE RowNum > @offset AND RowNum <= @endOffset
      ORDER BY RowNum`;
    
    request.input('offset', sql.Int, offset);
    request.input('endOffset', sql.Int, offset + limit);

    const result = await request.query(query);
    
    // Obtener el total de productos para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM MA_PRODUCTOS p
      WHERE p.c_Departamento = @department 
        AND p.n_Activo = 1 
        AND p.n_Precio1 > 0`;
    
    if (group && group.trim()) {
      countQuery += ` AND p.c_Grupo = @group`;
    }
    
    if (search && search.trim()) {
      countQuery += ` AND p.c_Descri LIKE @search`;
    }
    
    // Crear una nueva request para el conteo para evitar problemas de conexión
    const countRequest = pool.request()
      .input('department', sql.NVarChar, department);
      
    if (group && group.trim()) {
      countRequest.input('group', sql.NVarChar, group);
    }
    
    if (search && search.trim()) {
      countRequest.input('search', sql.NVarChar, `%${search.trim()}%`);
    }
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    const hasMore = offset + limit < total;
    
    await pool.close();

    return new Response(JSON.stringify({
      products: result.recordset,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: hasMore
      },
      department: department,
      group: group || null,
      search: search || null
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Department products error:', error);
    
    // Determinar el tipo de error y mensaje apropiado
    let status = 503;
    let message = 'Error interno del servidor';
    
    if (error.code === 'ETIMEOUT' || error.code === 'ETIMEDOUT') {
      status = 408;
      message = 'Tiempo de espera agotado - Verifica la conexión a la base de datos';
    } else if (error.code === 'ECONNREFUSED') {
      status = 503;
      message = 'No se puede conectar al servidor de base de datos';
    } else if (error.code === 'ELOGIN') {
      status = 401;
      message = 'Error de autenticación en la base de datos';
    } else if (error.code === 'EREQUEST') {
      status = 400;
      message = 'Error en la consulta SQL';
    } else if (error.message) {
      message = error.message;
    }
    
    return new Response(JSON.stringify({
      error: message,
      details: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}