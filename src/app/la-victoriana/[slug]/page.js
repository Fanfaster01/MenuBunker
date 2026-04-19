import DepartmentView from '@/components/victoriana/DepartmentView';

export default async function Page({ params }) {
  const { slug } = await params;
  return <DepartmentView slug={slug} />;
}
