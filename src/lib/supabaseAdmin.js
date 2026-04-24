import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con SERVICE ROLE — bypasea RLS completamente.
 *
 * USAR SOLO DESDE EL SERVIDOR (Server Actions, API routes) y SOLO después
 * de haber verificado que el usuario tiene permisos (ej. requireAdmin()).
 *
 * NUNCA importar desde client components. El import 'server-only' protege
 * contra eso (build falla si algún client component lo importa).
 *
 * Caso de uso principal: subir archivos al Storage, donde el JWT del
 * usuario no siempre se propaga correctamente desde @supabase/ssr al
 * sub-cliente de Storage.
 */

let _admin = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[supabaseAdmin] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
        'Verifica las env vars del servidor.'
    );
  }

  _admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
