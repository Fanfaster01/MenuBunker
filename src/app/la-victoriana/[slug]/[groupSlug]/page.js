import GroupView from '@/components/victoriana/GroupView';

export default async function Page({ params }) {
  const { slug, groupSlug } = await params;
  return <GroupView deptSlug={slug} groupSlug={groupSlug} />;
}
