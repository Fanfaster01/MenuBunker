'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronRight } from 'lucide-react';
import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * Búsqueda global del menú Bunker (todas las categorías). Patrón análogo
 * al DepartmentSearch de Victoriana: input con debounce 300ms, ≥2 chars,
 * resultados con badge de categoría y link directo a la página de la
 * categoría del item.
 *
 * Renderiza siempre el input. Si la query tiene ≥ 2 chars, muestra
 * resultados y oculta `children`. Si no, muestra `children` (la grid
 * normal de categorías).
 */
export default function BunkerGlobalSearch({ children }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle', items: [], total: 0, error: null });
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const url = `/api/menu/search?q=${encodeURIComponent(q)}&limit=40`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setState({
          status: 'ok',
          items: data.items || [],
          total: data.pagination?.total ?? 0,
          error: null,
        });
      } catch (err) {
        setState({ status: 'error', items: [], total: 0, error: err.message });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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
            placeholder="Buscar en todo el menú..."
            className="w-full bg-white border border-[#C8A882]/40 text-gray-900 placeholder:text-gray-400 rounded-full pl-12 pr-12 py-3 shadow-sm focus:outline-hidden focus:border-[#8B7355] focus:ring-2 focus:ring-[#C8A882]/30 transition-all [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#8B7355] rounded-full hover:bg-[#C8A882]/15 transition-all"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div className="max-w-3xl mx-auto">
          {state.status === 'loading' && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer h-16 rounded-xl border border-[#C8A882]/20"
                />
              ))}
            </div>
          )}

          {state.status === 'error' && <ErrorDisplay error={state.error} showRetry={false} />}

          {state.status === 'ok' && (
            <>
              <div className="mb-4 flex justify-end items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8A882]/15 text-[#8B7355] rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A882]" />
                  {state.total === 0
                    ? 'Sin resultados'
                    : `${state.total} ${state.total === 1 ? 'producto' : 'productos'}`}
                </span>
              </div>

              {state.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No encontramos productos que coincidan con{' '}
                  <strong className="text-[#6B5A45]">{query}</strong>.
                </div>
              ) : (
                <ul className="space-y-2">
                  {state.items.map((item) => (
                    <li key={item.xetux_item_id}>
                      <Link
                        href={`/bunker-restaurant/${item.category.slug}`}
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#C8A882]/30 hover:border-[#8B7355]/50 hover:shadow-md transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#6B5A45] truncate">
                              {item.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C8A882]/15 text-[#8B7355] font-medium uppercase tracking-wide">
                              {item.category.name}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.final_price != null && (
                          <span className="text-sm font-bold text-[#8B7355] shrink-0">
                            ${item.final_price.toFixed(2)}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#C8A882] group-hover:text-[#8B7355] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
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
