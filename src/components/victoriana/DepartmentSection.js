'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VictorianaFooter from '@/components/common/VictorianaFooter';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
import ProductSearch from '@/components/victoriana/ProductSearch';
import ProductCard from '@/components/victoriana/ProductCard';

export default function DepartmentSection({ 
  departmentCode, 
  departmentPath
}) {
  const [products, setProducts] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cargar información del departamento
  useEffect(() => {
    fetchDepartmentInfo();
  }, [departmentCode]);

  const fetchDepartmentInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/victoriana-departments');
      const data = await response.json();
      
      if (response.ok) {
        const department = data.departments.find(d => d.codigo === departmentCode);
        if (department) {
          setDepartmentInfo(department);
        } else {
          setError(`Departamento con código ${departmentCode} no encontrado`);
        }
      } else {
        setError(data.error || 'Error al cargar información del departamento');
      }
    } catch (error) {
      console.error('Error fetching department info:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSearchResults = (results, searchError = null) => {
    setHasSearched(true);
    
    if (searchError) {
      setError(searchError);
      setProducts([]);
      setSearchActive(false);
    } else {
      // Si results está vacío, desactivar búsqueda
      if (results.length === 0) {
        setProducts([]);
        setSearchActive(false);
      } else {
        // Sin JOINs, no hay duplicados
        setProducts(results);
        setSearchActive(true); // Solo activar si hay resultados reales
      }
      setError(null);
    }
    setIsLoading(false);
  };

  const handleClearSearch = () => {
    setSearchActive(false);
    setProducts([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-sm mx-auto mb-8">
        <Image 
          src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
          alt="La Victoriana Logo"
          width={300}
          height={300}
          className="mx-auto"
          priority
        />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#C8A882] mb-2">
          {departmentInfo ? departmentInfo.nombre : 'Cargando...'}
        </h1>
        <p className="text-gray-400">Explora nuestros productos</p>
      </div>

      <div className="flex justify-center mb-6">
        <Link 
          href="/la-victoriana"
          className="group relative bg-gradient-to-r from-[#C8302E] to-[#A02624] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Regresar a Departamentos
          </span>
          <div className="absolute inset-0 rounded-full bg-[#C8A882] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Mostrar error de carga del departamento */}
        {error && !departmentInfo ? (
          <ErrorDisplay 
            error={error}
            onRetry={fetchDepartmentInfo}
            title="Error al cargar departamento"
          />
        ) : departmentInfo ? (
          <>
            {/* Componente de búsqueda - visible cuando se carga el departamento */}
            <ProductSearch 
              department={departmentCode}
              onResults={handleSearchResults}
              placeholder={`Buscar en ${departmentInfo.nombre}...`}
            />

            {/* Botón para limpiar búsqueda cuando hay búsqueda activa */}
            {searchActive && (
              <div className="mb-4 text-center">
                <button
                  onClick={handleClearSearch}
                  className="text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  ← Limpiar búsqueda
                </button>
              </div>
            )}

            {/* Contenido principal */}
            {searchActive && hasSearched ? (
              // Mostrar resultados de búsqueda
              <>
                {products.length > 0 ? (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-gray-600">
                        Se encontraron <span className="font-semibold">{products.length}</span> productos
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.map((product, index) => (
                        <ProductCard key={`${product.codigo}-${index}`} product={product} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-[#C8A882] mb-2">
                      No se encontraron productos
                    </h3>
                    <p className="text-gray-400">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Mostrar todos los productos del departamento con paginación
              <ProductListWithPagination 
                departmentCode={departmentCode}
              />
            )}
          </>
        ) : (
          // Loading state mientras se carga la información del departamento
          <LoadingSpinner 
            message="Cargando información del departamento..."
            size="large"
          />
        )}
      </div>

      <VictorianaFooter />
    </main>
  );
}

// Componente auxiliar para productos con paginación
function ProductListWithPagination({ departmentCode, groupCode = null }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadProducts(1);
  }, [departmentCode]);

  const loadProducts = async (page) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * itemsPerPage;
      let url = `/api/victoriana-department?department=${departmentCode}&limit=${itemsPerPage}&offset=${offset}`;
      if (groupCode) {
        url += `&group=${groupCode}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Sin JOINs, no hay duplicados
        setProducts(data.products);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        setError(data.error || `Error ${response.status}: No se pudieron cargar los productos`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.message || 'Error de conexión al cargar los productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    loadProducts(page);
    // Scroll al inicio de los productos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error && products.length === 0) {
    return (
      <ErrorDisplay 
        error={error}
        onRetry={() => loadProducts(1)}
        title="Error al cargar productos"
      />
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <>
      {isLoading && products.length === 0 ? (
        <LoadingSpinner 
          message="Cargando productos..."
          size="large"
        />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {products.map((product, index) => (
              <ProductCard key={`${product.codigo}-${index}`} product={product} />
            ))}
          </div>

          {/* Indicador de carga durante cambio de página */}
          {isLoading && (
            <div className="text-center mb-4">
              <LoadingSpinner 
                message="Cargando página..."
                size="medium"
              />
            </div>
          )}

          {/* Paginación */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            className="py-8"
          />
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-[#C8A882] mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-gray-400">
            Esta sección está vacía en este momento
          </p>
        </div>
      )}
    </>
  );
}