"use client";

import { useEffect, useState } from 'react';
import { Image as ImageIcon, Info } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ImageModal from '@/components/common/ImageModal';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { ProductListSkeleton } from './skeletons';

/**
 * Vista data-driven para una categoría del menú Bunker.
 * Mobile-first: lista vertical de cards con nombre + descripción + precio destacado.
 */
export default function MenuCategoryView({ slug, backHref = '/bunker-restaurant' }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/menu/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setState({ status: 'ok', data, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', data: null, error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const formatPrice = (price) => (price != null ? `$${price.toFixed(2)}` : '—');
  const title = state.data?.category?.name?.toUpperCase() || slug.replace(/-/g, ' ').toUpperCase();

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#FAF5EA] text-gray-900 p-4">
        <Header title={title} backHref={backHref} />
        <ProductListSkeleton count={6} />
        <Footer />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title={title} backHref={backHref} />
        <ErrorDisplay error={state.error} />
        <Footer />
      </div>
    );
  }

  const { category, items } = state.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#FAF5EA] text-gray-900 p-4">
      <Header title={category.name.toUpperCase()} backHref={backHref} />

      {category.description && (
        <p className="text-center text-gray-600 mb-4 max-w-2xl mx-auto text-sm">
          {category.description}
        </p>
      )}

      {category.notice && (
        <div className="max-w-3xl mx-auto mb-6 flex gap-3 p-4 bg-gradient-to-r from-[#FAF5EA] to-[#F3ECDB] border-l-4 border-[#C8A882] rounded-r-lg shadow-sm">
          <Info className="w-5 h-5 text-[#8B7355] shrink-0 mt-0.5" />
          <p className="text-sm text-[#6B5A45] leading-relaxed">
            <span className="font-semibold">Importante:</span> {category.notice}
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto mb-4 flex justify-end items-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8A882]/15 text-[#8B7355] rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355]" />
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">
          No hay productos disponibles en esta categoría por el momento.
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          {items.map((item, idx) => (
            <article
              key={item.xetux_item_id}
              style={{ animationDelay: `${Math.min(idx * 25, 400)}ms` }}
              className="fade-in-up group bg-white rounded-xl p-4 border border-[#C8A882]/50 shadow-sm hover:shadow-md hover:border-[#8B7355]/70 transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-[#8B7355] leading-tight mb-1">
                    {item.name}
                  </h3>
                  {item.description && item.description !== item.name && (
                    <p className="text-sm text-gray-600 leading-snug line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="font-extrabold text-lg md:text-xl text-[#C8A882] whitespace-nowrap">
                    {formatPrice(item.final_price)}
                  </span>
                  {item.image_url && (
                    <button
                      onClick={() => setSelectedImage({
                        name: item.name,
                        imageUrl: item.image_url,
                        description: item.description,
                      })}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-[#C8A882]/10 text-[#8B7355] hover:bg-[#C8A882]/25 active:scale-95 transition-all"
                      aria-label={`Ver imagen de ${item.name}`}
                    >
                      <ImageIcon size={16} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageModal
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <Footer />
    </div>
  );
}
