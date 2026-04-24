'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { runXetuxSync } from '@/lib/sync/xetux';
import { runVictorianaSync } from '@/lib/sync/victoriana';

/**
 * Server Action disparada por el botón "Sincronizar ahora" del admin.
 *
 * Ejecuta los módulos de sync in-process (sin spawn de child process).
 * Mucho más rápido y clean que la versión anterior.
 *
 * @param {'xetux'|'victoriana'|'all'} which
 */
export async function runSync(which) {
  await requireAdmin();

  const runs = [];

  if (which === 'xetux' || which === 'all') {
    const startedAt = Date.now();
    const result = await runXetuxSync();
    runs.push({
      script: 'xetux',
      label: 'Xetux (Bunker)',
      ok: result.ok,
      code: result.ok ? 0 : 1,
      durationMs: result.durationMs ?? Date.now() - startedAt,
      stdout: result.log || '',
      stderr: result.ok ? '' : result.error || '',
      timedOut: false,
      familyCount: result.familyCount,
      itemCount: result.itemCount,
    });
  }

  if (which === 'victoriana' || which === 'all') {
    const startedAt = Date.now();
    const result = await runVictorianaSync();
    runs.push({
      script: 'victoriana',
      label: 'La Victoriana',
      ok: result.ok,
      code: result.ok ? 0 : 1,
      durationMs: result.durationMs ?? Date.now() - startedAt,
      stdout: result.log || '',
      stderr: result.ok ? '' : result.error || '',
      timedOut: false,
      departmentCount: result.departmentCount,
      groupCount: result.groupCount,
      productCount: result.productCount,
    });
  }

  const allOk = runs.every((r) => r.ok);

  // Refresh caches y contadores
  revalidatePath('/admin/sync');
  revalidatePath('/admin');
  revalidatePath('/bunker-restaurant');
  revalidatePath('/la-victoriana');

  return {
    ok: allOk,
    error: allOk ? null : 'Al menos un sync falló. Revisa los logs abajo.',
    runs,
  };
}
