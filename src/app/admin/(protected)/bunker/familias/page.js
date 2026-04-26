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
  const activeFamilies = families.filter((f) => f.is_active !== false);
  const visibleCount = activeFamilies.filter((f) => f.is_visible_on_menu).length;
  const hiddenByMe = activeFamilies.filter((f) => !f.is_visible_on_menu).length;
  const deletedFromErp = families.filter((f) => f.is_active === false).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Bunker · Familias</h1>
        <p className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{activeFamilies.length} familias activas</span>
          <span>·</span>
          <span><strong>{visibleCount}</strong> visibles</span>
          {hiddenByMe > 0 && (
            <span className="text-amber-700">
              <strong>{hiddenByMe}</strong> ocultas por ti
            </span>
          )}
        </p>
        {deletedFromErp > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800 flex items-center gap-2">
            <span className="text-base">🗑️</span>
            <span>
              <strong>{deletedFromErp}</strong> familia{deletedFromErp === 1 ? '' : 's'} eliminada{deletedFromErp === 1 ? '' : 's'} de
              Xetux. Filtra «Eliminadas del ERP» para revisar y borrar definitivamente.
            </span>
          </div>
        )}
      </header>

      <FamilyList families={families} />
    </div>
  );
}
