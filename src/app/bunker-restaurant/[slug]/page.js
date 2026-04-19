import CategoryOrSubcategoriesView from '@/components/bunker/CategoryOrSubcategoriesView';

export default async function BunkerSlugPage({ params }) {
  const { slug } = await params;
  return <CategoryOrSubcategoriesView slug={slug} />;
}
