import { requireAdmin } from '@/lib/adminAuth';
import ItemList from './_components/ItemList';

export const dynamic = 'force-dynamic';

export default async function AdminBunkerItemsPage() {
  const { supabase } = await requireAdmin();

  // Items (306) + familias para el filtro (32)
  const [itemsResult, familiesResult] = await Promise.all([
    supabase.from('admin_bunker_items').select('*').order('effective_name', { ascending: true }),
    supabase
      .from('admin_bunker_families')
      .select('family_id, effective_name')
      .order('effective_name', { ascending: true }),
  ]);

  if (itemsResult.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error al cargar items: {itemsResult.error.message}
      </div>
    );
  }

  const items = itemsResult.data ?? [];
  const families = familiesResult.data ?? [];

  const withImage = items.filter((i) => i.image_url).length;
  const withDesc = items.filter((i) => i.custom_description).length;
  const featured = items.filter((i) => i.is_featured).length;
  const hiddenByMe = items.filter((i) => i.is_hidden && i.is_active !== false).length;
  const deletedFromErp = items.filter((i) => i.is_active === false).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Bunker · Items</h1>
        <p className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{items.length} items</span>
          <span>·</span>
          <span>
            <strong>{withImage}</strong> con imagen
          </span>
          <span>
            <strong>{withDesc}</strong> con descripción gourmet
          </span>
          <span>
            <strong>{featured}</strong> destacados
          </span>
          {hiddenByMe > 0 && (
            <span className="text-amber-700">
              <strong>{hiddenByMe}</strong> ocultos por ti
            </span>
          )}
        </p>
        {deletedFromErp > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800 flex items-center gap-2">
            <span className="text-base">🗑️</span>
            <span>
              <strong>{deletedFromErp}</strong> item{deletedFromErp === 1 ? '' : 's'} eliminado{deletedFromErp === 1 ? '' : 's'}{' '}
              de Xetux. Filtra «Eliminados del ERP» para revisarlos y borrarlos definitivamente.
            </span>
          </div>
        )}
      </header>

      <ItemList items={items} families={families} />
    </div>
  );
}
