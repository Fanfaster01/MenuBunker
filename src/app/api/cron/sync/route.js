export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — Vercel Pro permite hasta 300s

import { NextResponse } from 'next/server';
import { runXetuxSync } from '@/lib/sync/xetux';
import { runVictorianaSync } from '@/lib/sync/victoriana';

/**
 * GET /api/cron/sync
 *
 * Endpoint ejecutado por Vercel Cron cada 10 min (ver vercel.json).
 * Vercel envía el header `Authorization: Bearer <CRON_SECRET>` para autenticar
 * las llamadas automáticas. En producción, solo se permite con ese header.
 *
 * En dev, se puede llamar manualmente (sin header) para probar.
 *
 * Ejecuta ambos syncs en secuencia. Si uno falla, continúa con el otro y
 * reporta ambos resultados en el JSON.
 */
export async function GET(request) {
  // Verificación de autenticación en producción
  if (process.env.VERCEL === '1') {
    const authHeader = request.headers.get('authorization');
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const results = {};

  // Xetux primero (más rápido, menos items)
  try {
    results.xetux = await runXetuxSync();
  } catch (err) {
    results.xetux = { ok: false, error: err?.message || String(err) };
  }

  // Victoriana después
  try {
    results.victoriana = await runVictorianaSync();
  } catch (err) {
    results.victoriana = { ok: false, error: err?.message || String(err) };
  }

  const durationMs = Date.now() - startedAt;
  const allOk = results.xetux.ok && results.victoriana.ok;

  return NextResponse.json(
    {
      ok: allOk,
      durationMs,
      results,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 500 }
  );
}
