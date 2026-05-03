"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import MenuCategoryView from './MenuCategoryView';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { CategoryGridSkeleton } from './skeletons';

/**
 * Smart view for /bunker-restaurant/[slug]:
 *   - If slug matches a parent (has children) → show children grid
 *   - If slug matches a direct category → render <MenuCategoryView> (products list)
 *   - Else 404
 */
export default function CategoryOrSubcategoriesView({ slug }) {
  const [state, setState] = useState({ status: 'loading', mode: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/menu/tree');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();

        const topMatch = (data.top_level || []).find((t) => t.slug === slug);
        if (topMatch) {
          if (topMatch.is_direct) {
            if (!cancelled) setState({ status: 'ok', mode: 'products', data: { backHref: '/bunker-restaurant' }, error: null });
          } else {
            if (!cancelled) setState({ status: 'ok', mode: 'children', data: { parent: topMatch, backHref: '/bunker-restaurant' }, error: null });
          }
          return;
        }

        for (const parent of data.top_level || []) {
          const childMatch = (parent.children || []).find((c) => c.slug === slug);
          if (childMatch) {
            if (!cancelled) setState({ status: 'ok', mode: 'products', data: { backHref: `/bunker-restaurant/${parent.slug}` }, error: null });
            return;
          }
        }

        if (!cancelled) setState({ status: 'not_found', mode: null, data: null, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', mode: null, data: null, error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (state.status === 'loading') {
    const prettyTitle = slug.replace(/-/g, ' ').toUpperCase();
    return (
      <div className="min-h-screen bg-linear-to-b from-white via-white to-[#FAF5EA] text-gray-900 p-4">
        <Header title={prettyTitle} />
        <CategoryGridSkeleton count={6} />
        <Footer />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title={slug.replace(/-/g, ' ').toUpperCase()} />
        <ErrorDisplay error={state.error} />
        <Footer />
      </div>
    );
  }

  if (state.status === 'not_found') {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="NO ENCONTRADO" />
        <div className="text-center py-12 max-w-2xl mx-auto">
          <p className="text-gray-600 mb-4">
            No encontramos la categoría <strong>{slug}</strong>.
          </p>
          <Link href="/bunker-restaurant" className="text-[#8B7355] hover:text-[#C8A882] font-medium">
            ← Volver al menú
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Modo productos → delegar al componente existente
  if (state.mode === 'products') {
    return <MenuCategoryView slug={slug} backHref={state.data?.backHref || '/bunker-restaurant'} />;
  }

  // Modo sub-categorías → grid de hijos
  const parent = state.data.parent;
  const backHref = state.data.backHref || '/bunker-restaurant';
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-white to-[#FAF5EA] text-gray-900 p-4">
      <Header title={parent.name.toUpperCase()} backHref={backHref} />

      <div className="max-w-4xl mx-auto mb-5 flex justify-end items-center">
        <span className="text-xs text-gray-500 font-medium">
          {parent.children.length} sub-categorías · {parent.item_count} productos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {parent.children.map((child, idx) => (
          <Link
            href={`/bunker-restaurant/${child.slug}`}
            key={child.slug}
            style={{ animationDelay: `${idx * 30}ms` }}
            className="fade-in-up group relative overflow-hidden bg-white rounded-2xl p-5 border border-[#C8A882]/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-3 min-h-24"
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#C8A882]/0 via-[#C8A882]/0 to-[#C8A882]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex-1 text-left">
              <h3 className="font-bold text-base md:text-lg text-[#8B7355] group-hover:text-[#6B5A45] transition-colors uppercase tracking-wide">
                {child.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {child.item_count} {child.item_count === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            <ChevronRight className="relative w-5 h-5 text-[#C8A882] group-hover:text-[#8B7355] group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      <Footer />
    </div>
  );
}
