import Link from 'next/link';
import {
  ChefHat,
  ShoppingBag,
  RefreshCw,
  LayoutGrid,
  Package,
  Image as ImageIcon,
  FileText,
  Star,
  EyeOff,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Devuelve el conteo (count: 'exact', head: true) de una query — sin traer rows.
 * Si la query falla retorna null para no romper el render del dashboard.
 */
async function safeCount(query) {
  const { count, error } = await query;
  return error ? null : count ?? 0;
}

/**
 * Trae la fecha más reciente de una columna timestamp. Devuelve `null` si la
 * tabla está vacía o si hay error.
 */
async function safeMaxTimestamp(supabase, table, column) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .order(column, { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data[column] ?? null;
}

/**
 * Format relative time desde un ISO string. "hace 8 min", "hace 2 h", etc.
 * Devuelve null si timestamp es null/inválido.
 */
function relativeTime(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return 'hace unos segundos';
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 86400 * 30) return `hace ${Math.floor(diffSec / 86400)} días`;
  return new Date(iso).toLocaleDateString('es-VE');
}

/**
 * Color del badge de "última sincronización" según freshness.
 * Verde < 15 min, ámbar < 1 h, rojo > 1 h.
 */
function syncFreshnessClass(iso) {
  if (!iso) return 'bg-gray-100 text-gray-500 border-gray-200';
  const diffMin = (Date.now() - new Date(iso).getTime()) / 1000 / 60;
  if (diffMin < 15) return 'bg-green-50 text-green-700 border-green-200';
  if (diffMin < 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

/**
 * Dashboard del admin. Muestra:
 *   1. Health stats por lado (Bunker + Victoriana): items totales, % con imagen,
 *      % con descripción gourmet, destacados, ocultos por admin, eliminados del ERP
 *   2. Estado del sync (último timestamp con badge de freshness)
 *   3. Cards de navegación a cada sección del admin
 *
 * Todas las queries van en paralelo, fallan silenciosamente (counters muestran "—").
 */
export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const [
    bunkerItemsTotal,
    bunkerItemsActive,
    bunkerItemsDeletedErp,
    bunkerWithImage,
    bunkerWithDesc,
    bunkerFeatured,
    bunkerHiddenByAdmin,
    bunkerLastSync,
    victorianaProductsTotal,
    victorianaProductsActive,
    victorianaProductsDeletedErp,
    victorianaWithImage,
    victorianaFeatured,
    victorianaHiddenByAdmin,
    victorianaLastSync,
    bunkerFamilies,
    victorianaDepts,
  ] = await Promise.all([
    safeCount(supabase.from('bunker_item_cache').select('xetux_item_id', { count: 'exact', head: true })),
    safeCount(
      supabase
        .from('bunker_item_cache')
        .select('xetux_item_id', { count: 'exact', head: true })
        .eq('is_active', true)
    ),
    safeCount(
      supabase
        .from('bunker_item_cache')
        .select('xetux_item_id', { count: 'exact', head: true })
        .eq('is_active', false)
    ),
    safeCount(
      supabase
        .from('bunker_item_meta')
        .select('xetux_item_id', { count: 'exact', head: true })
        .not('image_url', 'is', null)
    ),
    safeCount(
      supabase
        .from('bunker_item_meta')
        .select('xetux_item_id', { count: 'exact', head: true })
        .not('description', 'is', null)
    ),
    safeCount(
      supabase
        .from('bunker_item_meta')
        .select('xetux_item_id', { count: 'exact', head: true })
        .eq('is_featured', true)
    ),
    safeCount(
      supabase
        .from('bunker_item_meta')
        .select('xetux_item_id', { count: 'exact', head: true })
        .eq('is_hidden', true)
    ),
    safeMaxTimestamp(supabase, 'bunker_item_cache', 'synced_at'),
    safeCount(supabase.from('victoriana_product_cache').select('codigo', { count: 'exact', head: true })),
    safeCount(
      supabase
        .from('victoriana_product_cache')
        .select('codigo', { count: 'exact', head: true })
        .eq('is_active', true)
    ),
    safeCount(
      supabase
        .from('victoriana_product_cache')
        .select('codigo', { count: 'exact', head: true })
        .eq('is_active', false)
    ),
    safeCount(
      supabase
        .from('victoriana_product_meta')
        .select('codigo', { count: 'exact', head: true })
        .not('image_url', 'is', null)
    ),
    safeCount(
      supabase
        .from('victoriana_product_meta')
        .select('codigo', { count: 'exact', head: true })
        .eq('is_featured', true)
    ),
    safeCount(
      supabase
        .from('victoriana_product_meta')
        .select('codigo', { count: 'exact', head: true })
        .eq('is_hidden', true)
    ),
    safeMaxTimestamp(supabase, 'victoriana_product_cache', 'synced_at'),
    safeCount(supabase.from('bunker_family_cache').select('family_id', { count: 'exact', head: true })),
    safeCount(supabase.from('victoriana_department_cache').select('id', { count: 'exact', head: true })),
  ]);

  function pct(part, total) {
    if (total == null || total === 0 || part == null) return null;
    return Math.round((part / total) * 100);
  }

  const bunkerWithImagePct = pct(bunkerWithImage, bunkerItemsActive);
  const bunkerWithDescPct = pct(bunkerWithDesc, bunkerItemsActive);
  const victorianaWithImagePct = pct(victorianaWithImage, victorianaProductsActive);

  const bunkerStats = {
    title: 'Búnker Restaurant',
    total: bunkerItemsActive,
    deletedFromErp: bunkerItemsDeletedErp,
    accent: 'from-[#C8A882] to-[#8B7355]',
    accentText: 'text-[#8B7355]',
    metrics: [
      {
        icon: ImageIcon,
        label: 'Con imagen',
        value: bunkerWithImage,
        pct: bunkerWithImagePct,
        good: true,
      },
      {
        icon: FileText,
        label: 'Con descripción gourmet',
        value: bunkerWithDesc,
        pct: bunkerWithDescPct,
        good: true,
      },
      { icon: Star, label: 'Destacados', value: bunkerFeatured },
      { icon: EyeOff, label: 'Ocultos por mí', value: bunkerHiddenByAdmin },
    ],
    lastSync: bunkerLastSync,
    href: '/admin/bunker/items',
  };

  const victorianaStats = {
    title: 'La Victoriana',
    total: victorianaProductsActive,
    deletedFromErp: victorianaProductsDeletedErp,
    accent: 'from-red-500 to-red-700',
    accentText: 'text-red-700',
    metrics: [
      {
        icon: ImageIcon,
        label: 'Con imagen',
        value: victorianaWithImage,
        pct: victorianaWithImagePct,
        good: true,
      },
      { icon: Star, label: 'Destacados', value: victorianaFeatured },
      { icon: EyeOff, label: 'Ocultos por mí', value: victorianaHiddenByAdmin },
    ],
    lastSync: victorianaLastSync,
    href: '/admin/victoriana/items',
  };

  const sections = [
    {
      href: '/admin/bunker/familias',
      title: 'Búnker — Familias',
      desc: 'Visibilidad, nombres, orden',
      icon: LayoutGrid,
      count: bunkerFamilies,
      countLabel: 'familias',
      color: 'from-[#C8A882] to-[#8B7355]',
    },
    {
      href: '/admin/bunker/items',
      title: 'Búnker — Items',
      desc: 'Descripciones, imágenes, destacados',
      icon: ChefHat,
      count: bunkerItemsTotal,
      countLabel: 'items',
      color: 'from-[#8B7355] to-[#6B5A45]',
    },
    {
      href: '/admin/victoriana/departamentos',
      title: 'Victoriana — Departamentos',
      desc: 'Visibilidad, nombres, orden',
      icon: ShoppingBag,
      count: victorianaDepts,
      countLabel: 'departamentos',
      color: 'from-red-500 to-red-700',
    },
    {
      href: '/admin/victoriana/items',
      title: 'Victoriana — Items',
      desc: 'Descripciones, imágenes, destacados',
      icon: Package,
      count: victorianaProductsTotal,
      countLabel: 'productos',
      color: 'from-red-600 to-red-800',
    },
    {
      href: '/admin/sync',
      title: 'Sincronización',
      desc: 'Correr sync manual + ver estado',
      icon: RefreshCw,
      count: null,
      countLabel: null,
      color: 'from-emerald-500 to-emerald-700',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#6B5A45] mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Control del menú digital de Bunker y La Victoriana.</p>
      </div>

      {/* Health Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {[bunkerStats, victorianaStats].map((s) => (
          <StatsCard key={s.title} stats={s} />
        ))}
      </div>

      {/* Navegación */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Secciones
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 p-6 hover:shadow-lg hover:border-[#C8A882]/60 hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            <div
              className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-linear-to-br ${s.color} opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <div className="relative">
              <div
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-linear-to-br ${s.color} text-white mb-4 shadow-md`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-[#6B5A45] mb-1">{s.title}</h2>
              <p className="text-sm text-gray-600 mb-4">{s.desc}</p>
              {s.count != null && (
                <div className="text-xs text-gray-500">
                  <span className="font-bold text-[#8B7355]">{s.count}</span> {s.countLabel}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatsCard({ stats }) {
  const lastSyncRel = relativeTime(stats.lastSync);
  const syncClass = syncFreshnessClass(stats.lastSync);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 overflow-hidden">
      {/* Header con total + sync badge */}
      <div className={`p-5 bg-linear-to-br ${stats.accent} text-white`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-medium opacity-90">{stats.title}</h3>
            <div className="text-3xl font-bold mt-1">
              {stats.total != null ? stats.total.toLocaleString('es-VE') : '—'}
            </div>
            <div className="text-xs opacity-80">items activos</div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${syncClass}`}
            title={stats.lastSync ? new Date(stats.lastSync).toLocaleString('es-VE') : 'Sin datos de sync'}
          >
            <Clock className="w-3 h-3" />
            {lastSyncRel ?? '—'}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="p-5 grid grid-cols-2 gap-3">
        {stats.metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-gray-50/50"
          >
            <m.icon className={`w-4 h-4 mt-0.5 shrink-0 ${stats.accentText}`} />
            <div className="min-w-0">
              <div className="text-xs text-gray-500 truncate">{m.label}</div>
              <div className="font-bold text-[#6B5A45]">
                {m.value != null ? m.value.toLocaleString('es-VE') : '—'}
                {m.pct != null && (
                  <span className="ml-1.5 text-xs font-normal text-gray-500">({m.pct}%)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner si hay deletedFromErp */}
      {stats.deletedFromErp != null && stats.deletedFromErp > 0 && (
        <Link
          href={stats.href + '?status=deleted-from-erp'}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-t border-red-100 text-sm text-red-800 hover:bg-red-100 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{stats.deletedFromErp}</strong> ítem(s) eliminado(s) del ERP. Revisa para
            limpiar.
          </span>
        </Link>
      )}
    </div>
  );
}
