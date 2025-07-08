'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function ProductSearch({ 
  department, 
  onResults, 
  placeholder = "Buscar productos..." 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        // No cargar productos cuando no hay término de búsqueda
        if (searchTerm.length === 0 && onResults) {
          onResults([]);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, department]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/victoriana-department?department=${department}&search=${encodeURIComponent(searchTerm)}&limit=10`
      );
      const data = await response.json();
      
      if (response.ok) {
        // Sin JOINs, no hay duplicados
        setSuggestions(data.products);
        setShowSuggestions(true);
      } else {
        console.error('Error fetching suggestions:', data.error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/victoriana-department?department=${department}`);
      const data = await response.json();
      
      if (response.ok && onResults) {
        // Sin JOINs, no hay duplicados
        onResults(data.products);
      } else if (!response.ok && onResults) {
        onResults([], data.error || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (onResults) {
        onResults([], error.message || 'Error de conexión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term = searchTerm) => {
    setShowSuggestions(false);
    setIsLoading(true);
    
    try {
      const url = term.trim() 
        ? `/api/victoriana-department?department=${department}&search=${encodeURIComponent(term)}`
        : `/api/victoriana-department?department=${department}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && onResults) {
        // Sin JOINs, no hay duplicados
        onResults(data.products);
      } else if (!response.ok && onResults) {
        onResults([], data.error || 'Error en la búsqueda');
      }
    } catch (error) {
      console.error('Error searching products:', error);
      if (onResults) {
        onResults([], error.message || 'Error de conexión en la búsqueda');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (product) => {
    setSearchTerm(product.descripcion);
    setShowSuggestions(false);
    handleSearch(product.descripcion);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    // Limpiar resultados y notificar al componente padre
    if (onResults) {
      onResults([]);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // No cargar productos automáticamente al inicio
  // Solo cargar cuando haya una búsqueda activa

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative mb-6">
      <div className="relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((product) => (
            <button
              key={product.codigo}
              onClick={() => handleSuggestionClick(product)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.descripcion}
                  </p>
                  {product.marca && (
                    <p className="text-xs text-gray-500 mt-1">{product.marca}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-blue-600 ml-2">
                  {formatPrice(product.precio)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}