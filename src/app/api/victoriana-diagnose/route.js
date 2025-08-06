import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

// Variable global para rastrear el estado del pool
let poolStats = {
  created: 0,
  connected: 0,
  failed: 0,
  lastError: null,
  lastSuccess: null
};

export async function GET() {
  const startTime = Date.now();
  const config = getVictorianaDBConfig();
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown',
    poolStats: { ...poolStats },
    currentTest: {
      status: 'starting',
      duration: 0,
      error: null,
      poolInfo: null,
      connectionInfo: null
    }
  };
  
  let pool = null;
  
  try {
    // Intentar crear nueva conexión
    poolStats.created++;
    pool = new sql.ConnectionPool(config);
    
    // Evento de conexión exitosa
    pool.on('connect', () => {
      poolStats.connected++;
      poolStats.lastSuccess = new Date().toISOString();
    });
    
    // Evento de error
    pool.on('error', err => {
      poolStats.failed++;
      poolStats.lastError = {
        message: err.message,
        code: err.code,
        timestamp: new Date().toISOString()
      };
    });
    
    // Conectar con timeout personalizado
    await Promise.race([
      pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000)
      )
    ]);
    
    // Obtener información del pool
    diagnostics.currentTest.poolInfo = {
      connected: pool.connected,
      connecting: pool.connecting,
      healthy: pool.healthy
    };
    
    // Ejecutar query de prueba
    const result = await pool.request().query(`
      SELECT 
        @@SERVERNAME as server_name,
        @@VERSION as server_version,
        DB_NAME() as database_name,
        SUSER_NAME() as login_name,
        COUNT(*) as active_connections
      FROM sys.dm_exec_connections
      WHERE session_id = @@SPID
    `);
    
    diagnostics.currentTest.connectionInfo = result.recordset[0];
    
    // Verificar conexiones activas en el servidor
    const connectionsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(CASE WHEN host_name LIKE '%vercel%' THEN 1 END) as vercel_connections,
        COUNT(CASE WHEN program_name LIKE '%node%' THEN 1 END) as node_connections
      FROM sys.dm_exec_sessions
      WHERE is_user_process = 1
    `);
    
    diagnostics.currentTest.serverConnections = connectionsResult.recordset[0];
    
    // Cerrar apropiadamente
    await pool.close();
    
    diagnostics.currentTest.status = 'success';
    diagnostics.currentTest.duration = Date.now() - startTime;
    
  } catch (error) {
    diagnostics.currentTest.status = 'failed';
    diagnostics.currentTest.error = {
      message: error.message,
      code: error.code,
      stack: error.stack.split('\n').slice(0, 3).join('\n')
    };
    diagnostics.currentTest.duration = Date.now() - startTime;
    
    poolStats.failed++;
    poolStats.lastError = {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    // Intentar cerrar el pool si existe
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
  }
  
  // Análisis de patrón
  const successRate = poolStats.connected > 0 
    ? ((poolStats.connected / poolStats.created) * 100).toFixed(1) 
    : 0;
    
  diagnostics.analysis = {
    success_rate: `${successRate}%`,
    total_attempts: poolStats.created,
    pattern: determinePattern(poolStats),
    recommendations: getRecommendations(diagnostics)
  };
  
  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: diagnostics.currentTest.status === 'success' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

function determinePattern(stats) {
  if (stats.failed === 0) return 'Stable';
  if (stats.failed > stats.connected) return 'Mostly failing';
  if (stats.lastError && stats.lastSuccess) {
    const errorTime = new Date(stats.lastError.timestamp);
    const successTime = new Date(stats.lastSuccess);
    if (errorTime > successTime) return 'Degrading';
    return 'Recovering';
  }
  return 'Intermittent';
}

function getRecommendations(diagnostics) {
  const recommendations = [];
  
  if (diagnostics.currentTest.status === 'failed') {
    if (diagnostics.currentTest.error?.message?.includes('timeout')) {
      recommendations.push('Increase connection timeout or check network latency');
    }
    if (diagnostics.currentTest.error?.code === 'ELOGIN') {
      recommendations.push('Verify database credentials');
    }
    if (diagnostics.currentTest.error?.code === 'ETIMEOUT') {
      recommendations.push('Check firewall rules and SQL Server availability');
    }
  }
  
  if (diagnostics.currentTest.serverConnections?.total_connections > 100) {
    recommendations.push('High number of connections on server - consider connection limits');
  }
  
  if (poolStats.failed > 5) {
    recommendations.push('Multiple failures detected - check SQL Server logs');
  }
  
  return recommendations;
}