/**
 * Skeletons contextuales del menú Bunker.
 * Cada uno imita la estructura final para que la transición sea invisible.
 */

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-[#C8A882]/40 flex flex-col items-center justify-center min-h-32 gap-3">
      <div className="skeleton-shimmer h-5 w-2/3 rounded-md" />
      <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductRowSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#C8A882]/40 flex justify-between items-center gap-3">
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-4 w-3/5 rounded-md" />
        <div className="skeleton-shimmer h-3 w-4/5 rounded-md" />
      </div>
      <div className="skeleton-shimmer h-5 w-16 rounded-md shrink-0" />
    </div>
  );
}

export function ProductListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <ProductRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between w-full mb-6">
      <div className="skeleton-shimmer w-10 h-10 rounded-full" />
      <div className="skeleton-shimmer h-7 w-40 rounded-md" />
      <div className="w-10" />
    </div>
  );
}
