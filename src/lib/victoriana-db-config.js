// Configuración centralizada para la base de datos de La Victoriana
export function getVictorianaDBConfig() {
  // Para SQL Server con certificados auto-firmados, necesitamos trustServerCertificate=true
  // y encrypt=false para evitar problemas de conexión
  const config = {
    user: process.env.VICTORIANA_DB_USER,
    password: process.env.VICTORIANA_DB_PASSWORD,
    server: process.env.VICTORIANA_DB_HOST,
    database: process.env.VICTORIANA_DB_NAME,
    port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
    options: {
      // Por defecto, confiar en certificados auto-firmados
      trustServerCertificate: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE !== 'false',
      // Por defecto, no encriptar (común en servidores locales/desarrollo)
      encrypt: process.env.VICTORIANA_DB_ENCRYPT === 'true',
      enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };

  // Si no están configuradas las variables de certificado, usar valores seguros por defecto
  if (!process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE && !process.env.VICTORIANA_DB_ENCRYPT) {
    config.options.trustServerCertificate = true;
    config.options.encrypt = false;
  }

  return config;
}