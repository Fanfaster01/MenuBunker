import { requireAdmin } from '@/lib/adminAuth';
import DepartmentList from './_components/DepartmentList';

export const dynamic = 'force-dynamic';

export default async function AdminVictorianaDepartmentsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('admin_victoriana_departments')
    .select('*')
    .order('effective_name', { ascending: true });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error al cargar departamentos: {error.message}
      </div>
    );
  }

  const departments = data ?? [];
  const visibleCount = departments.filter((d) => d.is_visible_on_menu).length;
  const hiddenCount = departments.length - visibleCount;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Victoriana · Departamentos</h1>
        <p className="text-sm text-gray-600 mt-1">
          {departments.length} departamentos · {visibleCount} visibles · {hiddenCount} ocultos
        </p>
      </header>

      <DepartmentList departments={departments} />
    </div>
  );
}
