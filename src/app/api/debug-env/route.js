export async function GET() {
  return Response.json({
    // Verificar presencia de variables sin exponer valores
    hasUser: !!process.env.DB_USER,
    hasPassword: !!process.env.DB_PASSWORD,
    hasHost: !!process.env.DB_HOST,
    hasName: !!process.env.DB_NAME,
    hasPort: !!process.env.DB_PORT,
    hasTrustCert: !!process.env.DB_TRUST_SERVER_CERTIFICATE,
    hasEncrypt: !!process.env.DB_ENCRYPT,
    
    // Valores seguros de mostrar
    port: process.env.DB_PORT || 'not_set',
    trustCert: process.env.DB_TRUST_SERVER_CERTIFICATE || 'not_set',
    encrypt: process.env.DB_ENCRYPT || 'not_set',
    
    // Info del entorno
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}