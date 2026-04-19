/**
 * Skeletons contextuales del menú Victoriana.
 * Colores adaptados al brand (fondo negro, dorado sobre oscuro).
 */

export function DepartmentCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-[#C8A882]/30 flex flex-col items-center justify-center min-h-32 gap-3">
      <div className="skeleton-shimmer-dark h-5 w-2/3 rounded-md" />
      <div className="skeleton-shimmer-dark h-3 w-1/3 rounded-md" />
    </div>
  );
}

export function DepartmentGridSkeleton({ count = 9 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <DepartmentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductRowSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-[#C8A882]/30 flex justify-between items-center gap-3">
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer-dark h-4 w-3/5 rounded-md" />
        <div className="skeleton-shimmer-dark h-3 w-4/5 rounded-md" />
      </div>
      <div className="skeleton-shimmer-dark h-5 w-16 rounded-md shrink-0" />
    </div>
  );
}

export function ProductListSkeleton({ count = 8 }) {
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <ProductRowSkeleton key={i} />
      ))}
    </div>
  );
}
