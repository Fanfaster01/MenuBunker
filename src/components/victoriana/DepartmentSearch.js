"use client";

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import ProductRow from './ProductRow';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { ProductListSkeleton } from './skeletons';

/**
 * Barra de búsqueda con debounce + resultados, para cualquier vista dentro de un departamento.
 *
 * Renderiza siempre el input. Si la query tiene ≥ 2 chars, muestra los resultados
 * y oculta el contenido `children`. Si no, muestra children.
 *
 * Props:
 *   - deptSlug, deptName
 *   - children: contenido default (se oculta durante búsqueda)
 */
export default function DepartmentSearch({ deptSlug, deptName, children }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle', items: [], total: 0, error: null });
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setState({ status: 'idle', items: [], total: 0, error: null });
      return;
    }
    setState((s) => ({ ...s, status: 'loading' }));
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `/api/victoriana-menu/department/${encodeURIComponent(deptSlug)}/search?q=${encodeURIComponent(q)}&limit=40`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setState({ status: 'ok', items: data.items || [], total: data.pagination?.total ?? 0, error: null });
      } catch (err) {
        setState({ status: 'error', items: [], total: 0, error: err.message });
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, deptSlug]);

  const isSearching = query.trim().length >= 2;

  return (
    <>
      <div className="max-w-3xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A882] pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar en ${deptName}...`}
            className="w-full bg-gray-900 border border-[#C8A882]/40 text-white placeholder:text-gray-500 rounded-full pl-12 pr-12 py-3 focus:outline-none focus:border-[#C8302E] focus:ring-2 focus:ring-[#C8302E]/30 transition-all [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-all"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div className="max-w-3xl mx-auto">
          {state.status === 'loading' && <ProductListSkeleton count={5} />}
          {state.status === 'error' && <ErrorDisplay error={state.error} showRetry={false} />}
          {state.status === 'ok' && (
            <>
              <div className="mb-4 flex justify-end items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8302E]/15 text-[#C8A882] rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8302E]" />
                  {state.total === 0 ? 'Sin resultados' : `${state.total} ${state.total === 1 ? 'producto' : 'productos'}`}
                </span>
              </div>
              {state.items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No encontramos productos que coincidan con <strong className="text-white">{query}</strong> en este departamento.
                </div>
              ) : (
                <div className="space-y-3">
                  {state.items.map((item, idx) => (
                    <ProductRow key={item.codigo} item={item} index={idx} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
