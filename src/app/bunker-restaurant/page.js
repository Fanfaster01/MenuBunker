"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import BunkerLogo from '@/components/common/BunkerLogo';
import Footer from '@/components/common/Footer';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { CategoryGridSkeleton } from '@/components/bunker/skeletons';

export default function BunkerRestaurantHome() {
  const [state, setState] = useState({ status: 'loading', topLevel: [], error: null });

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
        if (!cancelled) setState({ status: 'ok', topLevel: data.top_level || [], error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', topLevel: [], error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-[#FAF5EA] text-black p-4">
      <div className="max-w-sm mx-auto mb-8 pt-4">
        <BunkerLogo className="w-full h-auto text-[#C8A882]" width="300" height="120" />
      </div>

      <div className="flex justify-center mb-10">
        <Link
          href="/"
          className="group relative bg-gradient-to-r from-[#8B7355] to-[#6B5A45] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Volver al Inicio
          </span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#8B7355] mb-2">Nuestro Menú</h2>
        <p className="text-sm text-gray-500">Elige una categoría para empezar</p>
      </div>

      {state.status === 'loading' && <CategoryGridSkeleton count={4} />}

      {state.status === 'error' && (
        <div className="max-w-2xl mx-auto">
          <ErrorDisplay error={state.error} />
        </div>
      )}

      {state.status === 'ok' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {state.topLevel.map((item, idx) => (
            <Link
              href={`/bunker-restaurant/${item.slug}`}
              key={item.slug}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="fade-in-up group relative overflow-hidden bg-white rounded-2xl p-6 border border-[#C8A882]/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center text-center min-h-32"
            >
              {/* Decorative gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C8A882]/0 via-[#C8A882]/0 to-[#C8A882]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg md:text-xl text-[#8B7355] group-hover:text-[#6B5A45] transition-colors uppercase tracking-wide">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.is_direct
                      ? `${item.item_count} ${item.item_count === 1 ? 'producto' : 'productos'}`
                      : `${item.children.length} sub-categorías · ${item.item_count} productos`}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-[#C8A882] group-hover:text-[#8B7355] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Footer />
    </main>
  );
}
