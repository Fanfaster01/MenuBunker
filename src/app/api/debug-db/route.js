import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = require('mssql');
    
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_CERT === 'true',
        encrypt: process.env.DB_ENCRYPT === 'true' || (process.env.DB_ENCRYPT !== 'false' && process.env.DB_ENCRYPT !== 'not_set'),
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    };

    console.log('Configuración de base de datos:', {
      server: config.server,
      database: config.database,
      port: config.port,
      trustServerCertificate: config.options.trustServerCertificate,
      encrypt: config.options.encrypt,
      hasUser: !!config.user,
      hasPassword: !!config.password
    });

    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT 1 as test');
    
    await pool.close();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Conexión exitosa',
      config: {
        server: config.server,
        database: config.database,
        port: config.port,
        trustServerCertificate: config.options.trustServerCertificate,
        encrypt: config.options.encrypt
      },
      testResult: result.recordset[0]
    });
  } catch (error) {
    console.error('Error de conexión:', error);
    
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      config: {
        server: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_CERT === 'true',
        encrypt: process.env.DB_ENCRYPT === 'true' || (process.env.DB_ENCRYPT !== 'false' && process.env.DB_ENCRYPT !== 'not_set'),
        hasUser: !!process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD
      }
    }, { status: 500 });
  }
}