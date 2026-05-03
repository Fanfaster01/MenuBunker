'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

/**
 * Modal fullscreen-ish para ver la imagen de un producto.
 *
 * Props:
 *   item: { name, imageUrl, description } — no renderiza si falta
 *   onClose: handler para cerrar
 */
export default function ImageModal({ item, onClose }) {
  // Cerrar con ESC
  useEffect(() => {
    if (!item) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    // Bloquear scroll del body mientras el modal está abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item || !item.imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Close button floating over image */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative w-full bg-gray-100" style={{ aspectRatio: '4 / 3' }}>
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        {/* Caption */}
        <div className="p-4 sm:p-5 border-t border-gray-100">
          <h3 className="font-bold text-lg text-[#6B5A45] leading-tight">{item.name}</h3>
          {item.description && item.description !== item.name && (
            <p className="text-sm text-gray-600 mt-1 leading-snug">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
