/**
 * Card de un producto de La Victoriana.
 * Reusable entre vistas de búsqueda, grupo y departamento.
 */
export default function ProductRow({ item, index = 0 }) {
  const formatPrice = (p) => (p != null ? `$${p.toFixed(2)}` : '—');
  const details = [item.marca, item.presentacion, `Cód. ${item.codigo}`].filter(Boolean).join(' · ');

  return (
    <article
      style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
      className="fade-in-up group bg-gray-900 rounded-xl p-4 border border-[#C8A882]/40 shadow-sm hover:shadow-md hover:border-[#C8302E]/60 transition-all"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-white leading-tight mb-1">{item.name}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{details}</p>
          {item.description && item.description !== item.name && (
            <p className="text-sm text-gray-400 leading-snug line-clamp-2">{item.description}</p>
          )}
        </div>
        <span className="font-extrabold text-lg md:text-xl text-[#C8A882] whitespace-nowrap">
          {formatPrice(item.final_price)}
        </span>
      </div>
    </article>
  );
}
