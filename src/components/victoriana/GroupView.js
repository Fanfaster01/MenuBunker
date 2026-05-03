"use client";

import { useCallback, useEffect, useState } from 'react';
import VictorianaHeader from './VictorianaHeader';
import VictorianaFooter from '@/components/common/VictorianaFooter';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import DepartmentSearch from './DepartmentSearch';
import ProductRow from './ProductRow';
import { ProductListSkeleton } from './skeletons';

const PAGE = 50;

/**
 * Productos de un grupo con paginación + búsqueda global del departamento.
 */
export default function GroupView({ deptSlug, groupSlug }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (nextOffset) => {
    const url = `/api/victoriana-menu/department/${encodeURIComponent(deptSlug)}/${encodeURIComponent(groupSlug)}?limit=${PAGE}&offset=${nextOffset}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, [deptSlug, groupSlug]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPage(0);
        if (cancelled) return;
        setItems(data.items || []);
        setOffset((data.items || []).length);
        setHasMore(!!data.pagination?.has_more);
        setState({ status: 'ok', data, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', data: null, error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchPage]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(offset);
      setItems((prev) => [...prev, ...(data.items || [])]);
      setOffset((o) => o + (data.items || []).length);
      setHasMore(!!data.pagination?.has_more);
    } catch (err) {
      console.error('loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  const title = state.data?.group?.name?.toUpperCase() || groupSlug.replace(/-/g, ' ').toUpperCase();
  const backHref = `/la-victoriana/${deptSlug}`;

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-black to-[#0c0c0c] text-white p-4">
        <VictorianaHeader title={title} backHref={backHref} />
        <ProductListSkeleton count={8} />
        <VictorianaFooter />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <VictorianaHeader title={title} backHref={backHref} />
        <ErrorDisplay error={state.error} />
        <VictorianaFooter />
      </div>
    );
  }

  const { department, group, pagination } = state.data;

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-black to-[#0c0c0c] text-white p-4">
      <VictorianaHeader title={group.name.toUpperCase()} backHref={backHref} />

      {department?.notice && (
        <div className="max-w-3xl mx-auto mb-6 flex gap-3 p-4 bg-linear-to-r from-[#1a1a1a] to-[#0c0c0c] border-l-4 border-[#C8302E] rounded-r-lg shadow-md">
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold text-[#C8A882]">Importante:</span> {department.notice}
          </p>
        </div>
      )}

      <DepartmentSearch deptSlug={deptSlug} deptName={department?.name || deptSlug.toUpperCase()}>
        <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {department?.name} <span className="text-[#C8A882]">/</span> {group.name}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8302E]/15 text-[#C8A882] rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8302E]" />
            {pagination.total ?? items.length} productos
          </span>
        </div>

        {items.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-12 text-gray-400">
            No hay productos disponibles en este grupo.
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {items.map((item, idx) => (
              <ProductRow key={item.codigo} item={item} index={idx} />
            ))}

            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-linear-to-r from-[#C8302E] to-[#A02624] hover:from-[#A02624] hover:to-[#8B1F1D] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-semibold shadow-md transition-all"
                >
                  {loadingMore ? 'Cargando...' : `Cargar más (${(pagination.total ?? 0) - items.length} restantes)`}
                </button>
              </div>
            )}
          </div>
        )}
      </DepartmentSearch>

      <VictorianaFooter />
    </div>
  );
}
