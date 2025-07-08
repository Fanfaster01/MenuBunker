export default function ProductCard({ product }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg hover:border-[#C8A882] transition-all duration-200">
      <div className="flex flex-col h-full">
        {/* Información del producto */}
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm mb-2 line-clamp-3">
            {product.descripcion}
          </h3>
          
          {product.marca && (
            <p className="text-xs text-gray-400 mb-2">
              <span className="font-medium">Marca:</span> {product.marca}
            </p>
          )}

          {product.presentacion && product.presentacion !== '1' && (
            <p className="text-xs text-gray-400 mb-2">
              <span className="font-medium">Presentación:</span> {product.presentacion}
            </p>
          )}

        </div>

        {/* Precio y código */}
        <div className="border-t border-gray-700 pt-3 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-[#C8A882]">
              {formatPrice(product.precio)}
            </span>
            <span className="text-xs text-gray-500">
              Cód: {product.codigo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}