import { requireAdmin } from '@/lib/adminAuth';
import GroupList from './_components/GroupList';

export const dynamic = 'force-dynamic';

export default async function AdminVictorianaGruposPage() {
  const { supabase } = await requireAdmin();

  const [groupsResult, departmentsResult] = await Promise.all([
    supabase
      .from('admin_victoriana_groups')
      .select('*')
      .order('department_name', { ascending: true })
      .order('effective_name', { ascending: true }),
    supabase
      .from('admin_victoriana_departments')
      .select('codigo, effective_name')
      .order('effective_name', { ascending: true }),
  ]);

  if (groupsResult.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error al cargar grupos: {groupsResult.error.message}
      </div>
    );
  }

  const groups = groupsResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const activeGroups = groups.filter((g) => g.is_active !== false);
  const visibleCount = activeGroups.filter((g) => g.is_visible_on_menu).length;
  const hiddenByMe = activeGroups.filter((g) => !g.is_visible_on_menu).length;
  const deletedFromErp = groups.filter((g) => g.is_active === false).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Victoriana · Grupos</h1>
        <p className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{activeGroups.length} grupos activos</span>
          <span>·</span>
          <span><strong>{visibleCount}</strong> visibles</span>
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
              <strong>{deletedFromErp}</strong> grupo{deletedFromErp === 1 ? '' : 's'} eliminado
              {deletedFromErp === 1 ? '' : 's'} de La Victoriana. Filtra «Eliminados del ERP» para revisar.
            </span>
          </div>
        )}
      </header>

      <GroupList groups={groups} departments={departments} />
    </div>
  );
}
