export async function GET() {
  // Solo mostrar información no sensible para debug
  const config = {
    host: process.env.VICTORIANA_DB_HOST || 'NOT_SET',
    port: process.env.VICTORIANA_DB_PORT || 'NOT_SET',
    database: process.env.VICTORIANA_DB_NAME || 'NOT_SET',
    user_set: !!process.env.VICTORIANA_DB_USER,
    password_set: !!process.env.VICTORIANA_DB_PASSWORD,
    trust_cert: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE || 'NOT_SET',
    encrypt: process.env.VICTORIANA_DB_ENCRYPT || 'NOT_SET',
    node_env: process.env.NODE_ENV || 'NOT_SET',
    vercel_env: process.env.VERCEL_ENV || 'NOT_SET'
  };

  return new Response(JSON.stringify({
    environment: config,
    parsed_port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
    trust_cert_boolean: process.env.VICTORIANA_DB_TRUST_SERVER_CERTIFICATE !== 'false',
    encrypt_boolean: process.env.VICTORIANA_DB_ENCRYPT === 'true'
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}