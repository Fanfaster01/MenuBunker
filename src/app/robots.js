/**
 * robots.txt — generado dinámicamente. Permite indexar todo el menú público,
 * bloquea explícitamente /admin (que igual está protegido por auth + middleware,
 * pero esto evita que aparezca en SERPs si algún bot persistente lo intenta).
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://menu-bunker.vercel.app/sitemap.xml',
  };
}
