import { requireAdmin } from '@/lib/adminAuth';
import SyncDashboard from './_components/SyncDashboard';
import TaskSchedulerGuide from './_components/TaskSchedulerGuide';

export const dynamic = 'force-dynamic';

/**
 * Pantalla de sincronización: muestra el estado actual de cada cache,
 * permite ejecutar sync manual, y muestra la guía de setup automático.
 */
export default async function AdminSyncPage() {
  const { supabase } = await requireAdmin();

  // Obtener el synced_at más reciente + conteos de cada cache
  const [bunkerFam, bunkerItem, victDept, victGroup, victProd] = await Promise.all([
    supabase.from('bunker_family_cache').select('synced_at').order('synced_at', { ascending: false }).limit(1),
    supabase.from('bunker_item_cache').select('synced_at').order('synced_at', { ascending: false }).limit(1),
    supabase.from('victoriana_department_cache').select('synced_at').order('synced_at', { ascending: false }).limit(1),
    supabase.from('victoriana_group_cache').select('synced_at').order('synced_at', { ascending: false }).limit(1),
    supabase.from('victoriana_product_cache').select('synced_at').order('synced_at', { ascending: false }).limit(1),
  ]);

  const [bunkerFamCount, bunkerItemCount, victDeptCount, victGroupCount, victProdCount] = await Promise.all([
    supabase.from('bunker_family_cache').select('family_id', { count: 'exact', head: true }),
    supabase.from('bunker_item_cache').select('xetux_item_id', { count: 'exact', head: true }),
    supabase.from('victoriana_department_cache').select('codigo', { count: 'exact', head: true }),
    supabase.from('victoriana_group_cache').select('codigo', { count: 'exact', head: true }),
    supabase.from('victoriana_product_cache').select('codigo', { count: 'exact', head: true }),
  ]);

  const bunkerStatus = {
    label: 'Bunker (Xetux)',
    color: 'from-[#C8A882] to-[#8B7355]',
    lastSyncedAt: latestSyncedAt([bunkerFam.data?.[0], bunkerItem.data?.[0]]),
    counts: [
      { label: 'familias', value: bunkerFamCount.count ?? 0 },
      { label: 'items', value: bunkerItemCount.count ?? 0 },
    ],
  };

  const victorianaStatus = {
    label: 'La Victoriana',
    color: 'from-[#C8302E] to-red-700',
    lastSyncedAt: latestSyncedAt([victDept.data?.[0], victGroup.data?.[0], victProd.data?.[0]]),
    counts: [
      { label: 'departamentos', value: victDeptCount.count ?? 0 },
      { label: 'grupos', value: victGroupCount.count ?? 0 },
      { label: 'productos', value: victProdCount.count ?? 0 },
    ],
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Sincronización</h1>
        <p className="text-sm text-gray-600 mt-1">
          Estado del caché Supabase y ejecución manual del sync desde los ERPs.
        </p>
      </header>

      <SyncDashboard bunker={bunkerStatus} victoriana={victorianaStatus} />

      <TaskSchedulerGuide />
    </div>
  );
}

function latestSyncedAt(rows) {
  const stamps = rows.filter(Boolean).map((r) => r.synced_at).filter(Boolean);
  if (stamps.length === 0) return null;
  return stamps.sort().reverse()[0];
}
