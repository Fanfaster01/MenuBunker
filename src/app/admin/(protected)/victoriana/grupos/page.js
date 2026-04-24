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
  const visibleCount = groups.filter((g) => g.is_visible_on_menu).length;
  const hiddenCount = groups.length - visibleCount;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Victoriana · Grupos</h1>
        <p className="text-sm text-gray-600 mt-1">
          {groups.length} grupos · {visibleCount} visibles · {hiddenCount} ocultos
        </p>
      </header>

      <GroupList groups={groups} departments={departments} />
    </div>
  );
}
