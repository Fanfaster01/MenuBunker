import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET() {
  const config = getVictorianaDBConfig();

  try {
    const pool = await sql.connect(config);
    
    // Obtener departamentos con nombres correctos y conteo de productos activos
    // Excluir departamento 08 (insumos - uso interno)
    const result = await pool.request().query(`
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
    
    await pool.close();

    return new Response(JSON.stringify({
      departments: result.recordset,
      total_departments: result.recordset.length
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Departments query error:', error);
    
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
      message = 'Error en la consulta SQL para departamentos';
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