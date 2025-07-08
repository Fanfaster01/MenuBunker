import DepartmentSection from '@/components/victoriana/DepartmentSection';

export default async function DynamicDepartment({ params }) {
  const { codigo } = await params;
  
  return (
    <DepartmentSection 
      departmentCode={codigo}
      departmentPath={`departamento/${codigo}`}
    />
  );
}