import Link from 'next/link';

export default function GroupCard({ group, department, departmentCode }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <Link 
      href={`/la-victoriana/${department}/${group.codigo}`}
      className="block"
    >
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 h-full group">
        <div className="flex flex-col h-full">
          {/* Nombre del grupo */}
          <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600">
            {group.nombre}
          </h3>
          
          {/* Información del grupo */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">{group.total_productos}</span> productos
            </p>
            
            {/* Rango de precios */}
            {group.precio_minimo && group.precio_maximo && (
              <p className="text-sm text-gray-500">
                Desde {formatPrice(group.precio_minimo)} hasta {formatPrice(group.precio_maximo)}
              </p>
            )}
          </div>

          {/* Indicador visual */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-blue-600 text-sm font-medium group-hover:underline">
                Ver productos
              </span>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}