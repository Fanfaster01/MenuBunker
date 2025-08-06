import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testCount = Math.min(parseInt(searchParams.get('count') || '5'), 8); // Máximo 8 para evitar timeout
  const delayMs = Math.max(parseInt(searchParams.get('delay') || '500'), 200); // Mínimo 200ms
  
  const config = getVictorianaDBConfig();
  const results = [];
  const startTime = Date.now();
  
  // Timeout de seguridad para evitar que Vercel mate la función
  const SAFETY_TIMEOUT = 8000; // 8 segundos
  
  for (let i = 1; i <= testCount; i++) {
    // Verificar si nos estamos acercando al timeout
    if (Date.now() - startTime > SAFETY_TIMEOUT) {
      results.push({
        test_number: i,
        status: 'skipped',
        reason: 'Approaching Vercel timeout limit',
        timestamp: new Date().toISOString()
      });
      break;
    }
    
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
      // Timeout por request individual
      const requestPromise = testSingleConnection(config);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );
      
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      testResult.status = 'success';
      testResult.query_result = result;
      testResult.duration_ms = Date.now() - testStart;
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      };
      testResult.duration_ms = Date.now() - testStart;
    }
    
    results.push(testResult);
    
    // Esperar antes del siguiente test (excepto en el último)
    if (i < testCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Análisis rápido
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  const summary = {
    test_info: {
      total_tests_planned: testCount,
      tests_executed: results.length,
      delay_between_tests_ms: delayMs,
      total_execution_time_ms: Date.now() - startTime,
      vercel_timeout_limit: '10 seconds'
    },
    results_summary: {
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      success_rate: results.length > 0 ? ((successCount / results.length) * 100).toFixed(1) + '%' : '0%'
    },
    detailed_results: results
  };
  
  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function testSingleConnection(config) {
  const pool = await sql.connect(config);
  
  const result = await pool.request().query('SELECT 1 as test_value, GETDATE() as server_time');
  
  await pool.close();
  
  return result.recordset[0];
}