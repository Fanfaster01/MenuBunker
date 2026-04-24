'use client';

/**
 * Cliente Supabase BROWSER-SIDE con sesión persistente (cookies).
 *
 * Se usa SOLO en client components que necesitan auth (login form, etc.).
 * El cliente público sin sesión (para lecturas) está en supabaseClient.js.
 */

import { createBrowserClient } from '@supabase/ssr';

let _client = null;

export function getSupabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  return _client;
}
