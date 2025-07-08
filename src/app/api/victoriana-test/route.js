import sql from 'mssql';

export async function GET() {
  // Configuración manual para pruebas
  const configs = [
    {
      name: "Config 1: Puerto 14333 con TIENDA",
      user: "sa",
      password: "k1i2r3a4",
      server: "192.168.88.26",
      database: "TIENDA",
      port: 14333,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    },
    {
      name: "Config 2: Puerto 14333 con encriptación",
      user: "sa",
      password: "k1i2r3a4",
      server: "192.168.88.26",
      database: "TIENDA",
      port: 14333,
      options: {
        trustServerCertificate: true,
        encrypt: true,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    },
    {
      name: "Config 3: Usando variables de entorno",
      user: process.env.VICTORIANA_DB_USER,
      password: process.env.VICTORIANA_DB_PASSWORD,
      server: process.env.VICTORIANA_DB_HOST,
      database: process.env.VICTORIANA_DB_NAME,
      port: parseInt(process.env.VICTORIANA_DB_PORT),
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    },
    {
      name: "Config 4: Con base de datos VAD10",
      user: "sa",
      password: "k1i2r3a4",
      server: "192.168.88.26",
      database: "VAD10",
      port: 14333,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    },
    {
      name: "Config 5: Con base de datos VAD10P",
      user: "sa",
      password: "k1i2r3a4",
      server: "192.168.88.26",
      database: "VAD10P",
      port: 14333,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    },
    {
      name: "Config 6: Puerto 14333 sin base de datos",
      user: "sa",
      password: "k1i2r3a4",
      server: "192.168.88.26",
      port: 14333,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      },
      connectionTimeout: 30000,
      requestTimeout: 30000
    }
  ];

  const results = [];

  for (const config of configs) {
    const testResult = {
      configName: config.name,
      success: false,
      error: null,
      details: {}
    };

    try {
      console.log(`Probando: ${config.name}`);
      const pool = await sql.connect(config);
      
      // Intentar una consulta simple
      const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database_name');
      
      testResult.success = true;
      testResult.details = {
        connected: true,
        database: result.recordset[0].database_name,
        sqlVersion: result.recordset[0].version.substring(0, 100) + "..."
      };
      
      await pool.close();
    } catch (error) {
      testResult.error = {
        message: error.message,
        code: error.code,
        state: error.state
      };
      console.error(`Error en ${config.name}:`, error.message);
    }

    results.push(testResult);
  }

  return new Response(JSON.stringify({ 
    testResults: results,
    environmentVars: {
      VICTORIANA_DB_HOST: process.env.VICTORIANA_DB_HOST,
      VICTORIANA_DB_NAME: process.env.VICTORIANA_DB_NAME,
      VICTORIANA_DB_USER: process.env.VICTORIANA_DB_USER,
      VICTORIANA_DB_PORT: process.env.VICTORIANA_DB_PORT
    }
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}