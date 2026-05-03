import Link from 'next/link';
import { ChefHat, ShoppingBag, RefreshCw, LayoutGrid, Package } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Dashboard del admin. Muestra contadores y accesos rápidos a cada sección.
 */
export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Contadores de items por cada lado — reads son públicos, no pasa nada si fallan.
  const [bunkerFamilies, bunkerItems, victorianaDepts, victorianaProducts] = await Promise.all([
    supabase.from('bunker_family_cache').select('family_id', { count: 'exact', head: true }),
    supabase.from('bunker_item_cache').select('xetux_item_id', { count: 'exact', head: true }),
    supabase.from('victoriana_department_cache').select('id', { count: 'exact', head: true }),
    supabase.from('victoriana_product_cache').select('codigo', { count: 'exact', head: true }),
  ]);

  const sections = [
    {
      href: '/admin/bunker/familias',
      title: 'Bunker — Familias',
      desc: 'Visibilidad, nombres, orden',
      icon: LayoutGrid,
      count: bunkerFamilies.count,
      countLabel: 'familias',
      color: 'from-[#C8A882] to-[#8B7355]',
    },
    {
      href: '/admin/bunker/items',
      title: 'Bunker — Items',
      desc: 'Descripciones, imágenes, destacados',
      icon: ChefHat,
      count: bunkerItems.count,
      countLabel: 'items',
      color: 'from-[#8B7355] to-[#6B5A45]',
    },
    {
      href: '/admin/victoriana/departamentos',
      title: 'Victoriana — Departamentos',
      desc: 'Visibilidad, nombres, orden',
      icon: ShoppingBag,
      count: victorianaDepts.count,
      countLabel: 'departamentos',
      color: 'from-red-500 to-red-700',
    },
    {
      href: '/admin/victoriana/items',
      title: 'Victoriana — Items',
      desc: 'Descripciones, imágenes, destacados',
      icon: Package,
      count: victorianaProducts.count,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 p-6 hover:shadow-lg hover:border-[#C8A882]/60 hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            {/* Gradient accent */}
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
