import { requireAdmin } from '@/lib/adminAuth';
import ItemList from './_components/ItemList';

export const dynamic = 'force-dynamic';

/**
 * Supabase cloud tiene PostgREST max-rows=1000 por default, y el .range()
 * del client no lo sobrepasa. Para traer los ~2900 productos, paginamos
 * manualmente en chunks de 1000.
 */
async function fetchAllItems(supabase) {
  const CHUNK = 1000;
  const all = [];
  let from = 0;
  // Safety cap (10K) para no hacer loops infinitos por error.
  while (from < 10000) {
    const { data, error } = await supabase
      .from('admin_victoriana_items')
      .select('*')
      .order('effective_name', { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < CHUNK) break;
    from += CHUNK;
  }
  return all;
}

export default async function AdminVictorianaItemsPage() {
  const { supabase } = await requireAdmin();

  let items = [];
  let departments = [];
  let groups = [];
  try {
    const [fetchedItems, departmentsResult, groupsResult] = await Promise.all([
      fetchAllItems(supabase),
      supabase
        .from('admin_victoriana_departments')
        .select('codigo, effective_name')
        .order('effective_name', { ascending: true }),
      supabase
        .from('admin_victoriana_groups')
        .select('codigo, departamento_codigo, effective_name, department_name')
        .order('department_name', { ascending: true })
        .order('effective_name', { ascending: true }),
    ]);
    items = fetchedItems;
    departments = departmentsResult.data ?? [];
    groups = groupsResult.data ?? [];
  } catch (err) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error al cargar items: {err.message}
      </div>
    );
  }

  const withImage = items.filter((i) => i.image_url).length;
  const withDesc = items.filter((i) => i.custom_description).length;
  const featured = items.filter((i) => i.is_featured).length;
  const hiddenByMe = items.filter((i) => i.is_hidden && i.is_active !== false).length;
  const deletedFromErp = items.filter((i) => i.is_active === false).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Victoriana · Items</h1>
        <p className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{items.length.toLocaleString('es')} productos</span>
          <span>·</span>
          <span>
            <strong>{withImage}</strong> con imagen
          </span>
          <span>
            <strong>{withDesc}</strong> con descripción
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
              <strong>{deletedFromErp}</strong> producto{deletedFromErp === 1 ? '' : 's'} eliminado{deletedFromErp === 1 ? '' : 's'}{' '}
              de Victoriana. Filtra "Eliminados del ERP" para revisar y borrar definitivamente.
            </span>
          </div>
        )}
      </header>

      <ItemList items={items} departments={departments} groups={groups} />
    </div>
  );
}
