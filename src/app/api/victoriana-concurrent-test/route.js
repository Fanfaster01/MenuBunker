import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const concurrentRequests = parseInt(searchParams.get('concurrent') || '5');
  const totalBatches = parseInt(searchParams.get('batches') || '3');
  const batchDelay = parseInt(searchParams.get('batchDelay') || '2000');
  
  const config = getVictorianaDBConfig();
  const allResults = [];
  
  console.log(`Starting concurrent test: ${concurrentRequests} concurrent requests, ${totalBatches} batches`);
  
  for (let batch = 1; batch <= totalBatches; batch++) {
    console.log(`Starting batch ${batch}/${totalBatches}`);
    
    const batchStart = Date.now();
    const promises = [];
    
    // Crear requests concurrentes
    for (let i = 1; i <= concurrentRequests; i++) {
      const promise = testSingleRequest(config, batch, i);
      promises.push(promise);
    }
    
    // Esperar a que todas las requests del batch terminen
    const batchResults = await Promise.allSettled(promises);
    
    const batchDuration = Date.now() - batchStart;
    
    // Procesar resultados del batch
    const batchData = {
      batch_number: batch,
      batch_start: new Date(batchStart).toISOString(),
      batch_duration_ms: batchDuration,
      concurrent_requests: concurrentRequests,
      results: batchResults.map((result, index) => ({
        request_id: `${batch}-${index + 1}`,
        status: result.status,
        ...(result.status === 'fulfilled' ? result.value : { error: result.reason })
      }))
    };
    
    allResults.push(batchData);
    
    // Esperar antes del siguiente batch
    if (batch < totalBatches) {
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  // Análisis global
  const totalRequests = allResults.reduce((sum, batch) => sum + batch.results.length, 0);
  const successfulRequests = allResults.reduce((sum, batch) => 
    sum + batch.results.filter(r => r.status === 'fulfilled' && r.db_status === 'success').length, 0
  );
  const failedRequests = totalRequests - successfulRequests;
  
  // Análisis de errores por batch
  const errorsByBatch = allResults.map(batch => ({
    batch: batch.batch_number,
    success_count: batch.results.filter(r => r.status === 'fulfilled' && r.db_status === 'success').length,
    failed_count: batch.results.filter(r => r.status === 'rejected' || r.db_status === 'failed').length,
    error_types: batch.results
      .filter(r => r.status === 'rejected' || r.db_status === 'failed')
      .reduce((acc, r) => {
        const errorKey = r.error?.code || r.db_error?.code || 'unknown';
        acc[errorKey] = (acc[errorKey] || 0) + 1;
        return acc;
      }, {})
  }));
  
  // Detectar patrones de degradación
  const degradationPattern = allResults.map(batch => ({
    batch: batch.batch_number,
    avg_duration: batch.results.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / batch.results.length,
    success_rate: (batch.results.filter(r => r.status === 'fulfilled' && r.db_status === 'success').length / batch.results.length * 100).toFixed(1) + '%'
  }));
  
  const summary = {
    test_config: {
      concurrent_requests_per_batch: concurrentRequests,
      total_batches: totalBatches,
      batch_delay_ms: batchDelay,
      total_requests: totalRequests
    },
    overall_results: {
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      overall_success_rate: ((successfulRequests / totalRequests) * 100).toFixed(1) + '%',
      errors_by_batch: errorsByBatch,
      performance_degradation: degradationPattern
    },
    database_config: {
      host: config.server,
      port: config.port,
      database: config.database,
      pool_config: config.pool
    },
    detailed_batches: allResults
  };
  
  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function testSingleRequest(config, batchNumber, requestNumber) {
  const requestStart = Date.now();
  
  try {
    const pool = await sql.connect(config);
    
    // Query que simula carga real
    const result = await pool.request().query(`
      SELECT 
        1 as test_value, 
        GETDATE() as server_time,
        @@SPID as session_id,
        DB_NAME() as database_name
    `);
    
    const duration = Date.now() - requestStart;
    
    await pool.close();
    
    return {
      batch: batchNumber,
      request: requestNumber,
      db_status: 'success',
      duration_ms: duration,
      query_result: result.recordset[0],
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const duration = Date.now() - requestStart;
    
    return {
      batch: batchNumber,
      request: requestNumber,
      db_status: 'failed',
      duration_ms: duration,
      db_error: {
        message: error.message,
        code: error.code,
        number: error.number,
        state: error.state,
        original_error: error.originalError ? {
          message: error.originalError.message,
          code: error.originalError.code
        } : null
      },
      timestamp: new Date().toISOString()
    };
  }
}