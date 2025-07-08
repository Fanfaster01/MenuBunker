import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testCount = parseInt(searchParams.get('count') || '10');
  const delayMs = parseInt(searchParams.get('delay') || '1000');
  
  const config = getVictorianaDBConfig();
  const results = [];
  
  console.log(`Starting stress test with ${testCount} requests, ${delayMs}ms delay`);
  
  for (let i = 1; i <= testCount; i++) {
    const testStart = Date.now();
    const testResult = {
      test_number: i,
      timestamp: new Date().toISOString(),
      status: 'pending',
      duration_ms: 0,
      error: null,
      query_result: null
    };
    
    try {
      // Intentar conectar y hacer query
      const pool = await sql.connect(config);
      
      // Query simple para probar conexión
      const result = await pool.request().query('SELECT 1 as test_value, GETDATE() as server_time');
      
      testResult.status = 'success';
      testResult.query_result = result.recordset[0];
      testResult.duration_ms = Date.now() - testStart;
      
      // Cerrar conexión explícitamente
      await pool.close();
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = {
        message: error.message,
        code: error.code,
        number: error.number,
        state: error.state,
        class: error.class,
        server: error.server,
        proc_name: error.procName,
        line_number: error.lineNumber,
        original_error: error.originalError ? {
          message: error.originalError.message,
          code: error.originalError.code
        } : null
      };
      testResult.duration_ms = Date.now() - testStart;
      
      console.log(`Test ${i} failed:`, error.message);
    }
    
    results.push(testResult);
    
    // Esperar antes del siguiente test (excepto en el último)
    if (i < testCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Análisis de resultados
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;
  
  const errorTypes = {};
  results.filter(r => r.status === 'failed').forEach(r => {
    const errorKey = r.error?.code || r.error?.message || 'unknown';
    errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
  });
  
  // Detectar patrones de fallo
  const failurePattern = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'failed') {
      // Buscar contexto (2 antes, 2 después)
      const contextStart = Math.max(0, i - 2);
      const contextEnd = Math.min(results.length - 1, i + 2);
      const context = results.slice(contextStart, contextEnd + 1).map(r => r.status);
      
      failurePattern.push({
        failure_at: i + 1,
        context: context,
        error_type: results[i].error?.code || results[i].error?.message
      });
    }
  }
  
  const summary = {
    test_config: {
      total_tests: testCount,
      delay_between_tests_ms: delayMs,
      test_duration_total_ms: results[results.length - 1]?.timestamp ? 
        (new Date(results[results.length - 1].timestamp) - new Date(results[0].timestamp)) : 0
    },
    results_summary: {
      success_count: successCount,
      failed_count: failedCount,
      success_rate: ((successCount / testCount) * 100).toFixed(1) + '%',
      avg_duration_ms: Math.round(avgDuration),
      error_types: errorTypes,
      failure_patterns: failurePattern
    },
    database_config: {
      host: config.server,
      port: config.port,
      database: config.database,
      pool_config: config.pool,
      connection_timeout: config.connectionTimeout,
      request_timeout: config.requestTimeout
    },
    detailed_results: results
  };
  
  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}