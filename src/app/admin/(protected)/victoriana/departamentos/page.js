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
  const activeDepts = departments.filter((d) => d.is_active !== false);
  const visibleCount = activeDepts.filter((d) => d.is_visible_on_menu).length;
  const hiddenByMe = activeDepts.filter((d) => !d.is_visible_on_menu).length;
  const deletedFromErp = departments.filter((d) => d.is_active === false).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#6B5A45]">Victoriana · Departamentos</h1>
        <p className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{activeDepts.length} departamentos activos</span>
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
              <strong>{deletedFromErp}</strong> departamento{deletedFromErp === 1 ? '' : 's'} eliminado
              {deletedFromErp === 1 ? '' : 's'} de La Victoriana. Aparecen al final con badge rojo y botón «Borrar».
            </span>
          </div>
        )}
      </header>

      <DepartmentList departments={departments} />
    </div>
  );
}
