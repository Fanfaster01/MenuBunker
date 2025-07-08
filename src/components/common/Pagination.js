export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems = 0,
  itemsPerPage = 20,
  className = "" 
}) {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Si hay muchas páginas, mostrar con elipsis
      if (currentPage <= 4) {
        // Inicio: 1,2,3,4,5...totalPages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Final: 1...totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Medio: 1...currentPage-1,currentPage,currentPage+1...totalPages
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Información de elementos */}
      <div className="text-sm text-gray-400">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{totalItems}</span> productos
      </div>

      {/* Navegación de páginas */}
      <nav className="flex items-center space-x-1">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'text-gray-500 cursor-not-allowed bg-gray-800'
              : 'text-white hover:text-[#C8A882] hover:bg-gray-800 bg-gray-900 border border-gray-700'
          }`}
        >
          ← Anterior
        </button>

        {/* Números de página */}
        {pageNumbers.map((page, index) => (
          <span key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#C8A882] text-black'
                    : 'text-white hover:text-[#C8A882] hover:bg-gray-800 bg-gray-900 border border-gray-700'
                }`}
              >
                {page}
              </button>
            )}
          </span>
        ))}

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'text-gray-500 cursor-not-allowed bg-gray-800'
              : 'text-white hover:text-[#C8A882] hover:bg-gray-800 bg-gray-900 border border-gray-700'
          }`}
        >
          Siguiente →
        </button>
      </nav>
    </div>
  );
}