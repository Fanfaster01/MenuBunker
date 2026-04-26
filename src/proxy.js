import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Proxy (antes "middleware") que refresca la sesión de Supabase en cada request
 * a /admin/*. En Next 16+ el archivo se llama proxy.js y exporta `proxy`.
 *
 * Esto es necesario porque los Server Components no pueden escribir cookies,
 * así que el proxy es el encargado de mantener el JWT vigente.
 *
 * Para rutas NO admin, el proxy sale temprano sin tocar nada.
 */
export async function proxy(request) {
  // Solo refrescar sesión en /admin/*. Si agregamos más rutas auth, expandir acá.
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch al usuario refresca cookies si es necesario.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match /admin/* excepto archivos estáticos.
     */
    '/admin/:path*',
  ],
};
