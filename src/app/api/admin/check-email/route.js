export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { isEmailWhitelisted } from '@/lib/adminAuth';

/**
 * POST /api/admin/check-email
 * Body: { email: string }
 *
 * Pre-check antes de solicitar el magic link: verifica si el email está en
 * admin_whitelist. Evita enviar magic links a emails no autorizados.
 *
 * Response: { allowed: boolean }
 *
 * NOTA: no filtra rate — los intentos masivos no son realistas en este contexto,
 * pero si cambiamos el enfoque podríamos agregar rate limiting (ej. Upstash).
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const allowed = await isEmailWhitelisted(email);
    return NextResponse.json({ allowed });
  } catch (err) {
    console.error('[POST /api/admin/check-email]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
