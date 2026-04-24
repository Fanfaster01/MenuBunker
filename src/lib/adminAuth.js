import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabaseServer';

/**
 * Verifica que el usuario esté autenticado Y esté en admin_whitelist.
 *
 * Uso en Server Components / Server Actions / API routes:
 *   const { supabase, user } = await requireAdmin();
 *
 * Si NO hay sesión → redirect a /admin/login
 * Si hay sesión pero no está whitelisted → signOut + redirect con error
 *
 * El chequeo usa la función RPC `is_email_whitelisted` que corre con
 * SECURITY DEFINER y bypasea RLS sin exponer la tabla.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/admin/login');
  }

  const { data: allowed, error: rpcError } = await supabase.rpc('is_email_whitelisted', {
    check_email: user.email,
  });

  if (rpcError || !allowed) {
    // Autenticado pero no autorizado → logout + error
    await supabase.auth.signOut();
    redirect('/admin/login?error=unauthorized');
  }

  return { supabase, user };
}

/**
 * Pre-check (anónimo) antes de pedir magic link.
 * Retorna true/false sin exponer la whitelist.
 */
export async function isEmailWhitelisted(email) {
  if (!email || typeof email !== 'string') return false;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('is_email_whitelisted', {
    check_email: email,
  });
  if (error) {
    console.error('[isEmailWhitelisted] RPC error:', error.message);
    return false;
  }
  return !!data;
}
