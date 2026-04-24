export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /admin/auth/callback?code=...
 *
 * Landing del magic link de Supabase. Intercambia el `code` por una sesión,
 * la persiste en cookies, y redirige al dashboard.
 *
 * Si el intercambio falla, redirige al login con ?error=invalid.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/admin';

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[admin/auth/callback] exchange error:', error.message);
    return NextResponse.redirect(`${origin}/admin/login?error=expired`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
