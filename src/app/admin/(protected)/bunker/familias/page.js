import { requireAdmin } from '@/lib/adminAuth';
import FamilyList from './_components/FamilyList';

export const dynamic = 'force-dynamic';

/**
 * Página de admin: listar + editar familias de Bunker.
 *
 * Muestra las 32 familias habilitadas en Xetux con su metadata del menú digital,
 * y permite editar display_name, description, notice, slug, visibilidad y orden.
 */
export default async function AdminBunkerFamiliasPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('admin_bunker_families')
    .select('*')
    .order('effective_name', { ascending: true });

  if (error) {
    console.error('[AdminBunkerFamilias] fetch error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error al cargar las familias: {error.message}
      </div>
    );
  }

  const families = data ?? [];
  const visibleCount = families.filter((f) => f.is_visible_on_menu).length;
  const hiddenCount = families.length - visibleCount;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Bunker · Familias</h1>
          <p className="text-sm text-gray-600 mt-1">
            {families.length} familias habilitadas en Xetux · {visibleCount} visibles en el menú · {hiddenCount} ocultas
          </p>
        </div>
      </header>

      <FamilyList families={families} />
    </div>
  );
}
