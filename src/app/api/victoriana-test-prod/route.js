import sql from 'mssql';
import { getVictorianaDBConfig } from '@/lib/victoriana-db-config';

export async function GET() {
  const config = getVictorianaDBConfig();

  const debugInfo = {
    config_used: {
      server: config.server,
      port: config.port,
      database: config.database,
      encrypt: config.options.encrypt,
      trustServerCertificate: config.options.trustServerCertificate
    },
    env_vars: {
      host: process.env.VICTORIANA_DB_HOST,
      port: process.env.VICTORIANA_DB_PORT,
      raw_trust_cert: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE,
      raw_encrypt: process.env.VICTORIANA_DB_ENCRYPT
    },
    tests: []
  };

  try {
    // Test 1: Intentar conectar
    debugInfo.tests.push({ test: 'Connection attempt', status: 'starting' });
    
    const pool = await sql.connect(config);
    
    debugInfo.tests.push({ test: 'Connection', status: 'SUCCESS' });
    
    // Test 2: Query simple
    try {
      const result = await pool.request().query('SELECT 1 as test');
      debugInfo.tests.push({ 
        test: 'Simple query', 
        status: 'SUCCESS',
        result: result.recordset
      });
    } catch (e) {
      debugInfo.tests.push({ 
        test: 'Simple query', 
        status: 'FAILED',
        error: e.message,
        code: e.code
      });
    }
    
    // Test 3: Query tabla departamentos
    try {
      const result = await pool.request().query('SELECT TOP 1 * FROM MA_DEPARTAMENTOS');
      debugInfo.tests.push({ 
        test: 'Department table', 
        status: 'SUCCESS',
        columns: Object.keys(result.recordset[0] || {})
      });
    } catch (e) {
      debugInfo.tests.push({ 
        test: 'Department table', 
        status: 'FAILED',
        error: e.message,
        code: e.code
      });
    }
    
    await pool.close();
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    debugInfo.connection_error = {
      message: error.message,
      code: error.code,
      originalError: error.originalError ? {
        message: error.originalError.message,
        code: error.originalError.code
      } : null
    };
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}