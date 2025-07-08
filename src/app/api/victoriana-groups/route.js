import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');

  const config = getVictorianaDBConfig();

  if (!department) {
    return new Response(JSON.stringify({ error: 'Department parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const pool = await sql.connect(config);
    
    // Obtener grupos del departamento con conteo de productos activos
    const groupsResult = await pool.request()
      .input('department', sql.NVarChar, department)
      .query(`
        SELECT 
          g.c_CODIGO as codigo,
          g.C_DESCRIPCIO as nombre,
          COUNT(p.c_Codigo) as total_productos,
          MIN(p.n_Precio1) as precio_minimo,
          MAX(p.n_Precio1) as precio_maximo
        FROM MA_GRUPOS g
        LEFT JOIN MA_PRODUCTOS p ON g.c_CODIGO = p.c_Grupo 
          AND p.c_Departamento = @department
          AND p.n_Activo = 1 
          AND p.n_Precio1 > 0
        WHERE g.c_departamento = @department
        GROUP BY g.c_CODIGO, g.C_DESCRIPCIO
        HAVING COUNT(p.c_Codigo) > 0
        ORDER BY g.C_DESCRIPCIO
      `);

    // Obtener información del departamento
    const deptResult = await pool.request()
      .input('department', sql.NVarChar, department)
      .query(`
        SELECT 
          C_CODIGO as codigo,
          C_DESCRIPCIO as nombre
        FROM MA_DEPARTAMENTOS
        WHERE C_CODIGO = @department
      `);
    
    await pool.close();

    return new Response(JSON.stringify({
      department: deptResult.recordset[0] || null,
      groups: groupsResult.recordset,
      total_groups: groupsResult.recordset.length,
      has_groups: groupsResult.recordset.length > 0
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Groups query error:', error);
    
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
      message = 'Error en la consulta SQL para grupos';
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