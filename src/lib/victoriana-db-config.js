// Configuración centralizada para la base de datos de La Victoriana
export function getVictorianaDBConfig() {
  const config = {
    user: process.env.VICTORIANA_DB_USER,
    password: process.env.VICTORIANA_DB_PASSWORD,
    server: process.env.VICTORIANA_DB_HOST,
    database: process.env.VICTORIANA_DB_NAME,
    port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
    options: {
      trustServerCertificate: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE !== 'false' && process.env.VICTORIANA_DB_TRUST_CERT !== 'false',
      encrypt: process.env.VICTORIANA_DB_ENCRYPT === 'true' || (process.env.VICTORIANA_DB_ENCRYPT !== 'false' && process.env.VICTORIANA_DB_ENCRYPT !== 'not_set'),
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

  return config;
}