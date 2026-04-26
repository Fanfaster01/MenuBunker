'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Pencil, MessageSquareWarning, Package, AlertTriangle, Trash2, Search, X } from 'lucide-react';
import { updateFamilyMeta, deleteFamilyPermanently } from '../actions';
import FamilyEditModal from './FamilyEditModal';

/**
 * Lista de familias con quick-toggle de visibilidad, edición y borrado
 * permanente para familias eliminadas del ERP.
 */
export default function FamilyList({ families }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(new Set());
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredFamilies = useMemo(() => {
    let list = families;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.effective_name?.toLowerCase().includes(q) ||
          f.raw_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'visible') list = list.filter((f) => f.is_visible_on_menu && f.is_active !== false);
    else if (statusFilter === 'hidden-by-me') list = list.filter((f) => !f.is_visible_on_menu && f.is_active !== false);
    else if (statusFilter === 'deleted-from-erp') list = list.filter((f) => f.is_active === false);

    return list;
  }, [families, query, statusFilter]);

  function showFlash(type, message) {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 2500);
  }

  async function toggleVisibility(family) {
    setToggling((prev) => new Set(prev).add(family.family_id));
    const newValue = !family.is_visible_on_menu;

    const result = await updateFamilyMeta(family.family_id, { is_visible_on_menu: newValue });

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(family.family_id);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo actualizar');
    } else {
      showFlash('success', `«${family.effective_name}» ${newValue ? 'visible' : 'oculta'} en el menú`);
    }
  }

  async function handleSave(familyId, patch) {
    const result = await updateFamilyMeta(familyId, patch);
    if (result.ok) {
      showFlash('success', 'Cambios guardados ✓');
      setEditing(null);
    }
    return result;
  }

  async function deletePermanently(family) {
    const itemNote = family.item_count > 0
      ? `\n\nEsta familia tenía ${family.item_count} ${family.item_count === 1 ? 'item' : 'items'}. Esos items quedarán sin familia (default_family_id = NULL); puedes borrarlos aparte si tampoco están en el ERP.`
      : '';
    const confirmed = window.confirm(
      `¿Borrar definitivamente «${family.effective_name}»?\n\n` +
        `Esta familia ya no está en Xetux. Al borrarla se elimina del caché Y de su metadata ` +
        `(slug, descripción, notice, etc.).${itemNote}\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setToggling((prev) => new Set(prev).add(family.family_id));
    const result = await deleteFamilyPermanently(family.family_id);
    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(family.family_id);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo borrar');
    } else {
      showFlash('success', `«${result.deletedName}» eliminada definitivamente`);
      router.refresh();
    }
  }

  function resetFilters() {
    setQuery('');
    setStatusFilter('all');
  }

  const hasActiveFilters = query || statusFilter !== 'all';

  return (
    <>
      {flash && (
        <div
          className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${
            flash.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {flash.message}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#C8A882] focus:ring-2 focus:ring-[#C8A882]/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8A882]"
          >
            <option value="all">Todos los estados</option>
            <option value="visible">Visibles en el menú</option>
            <option value="hidden-by-me">Ocultas por mí</option>
            <option value="deleted-from-erp">🗑️ Eliminadas del ERP</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}

          <span className="text-xs text-gray-500 ml-auto">
            {filteredFamilies.length} / {families.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 overflow-hidden">
        {filteredFamilies.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {hasActiveFilters ? 'Ninguna familia coincide con los filtros.' : 'No hay familias habilitadas en Xetux.'}
          </div>
        ) : (
          <ul className="divide-y divide-[#C8A882]/15">
            {filteredFamilies.map((f) => {
              const isToggling = toggling.has(f.family_id);
              const isVisible = !!f.is_visible_on_menu;
              const isDeletedFromErp = f.is_active === false;

              let rowBg = 'bg-white hover:bg-amber-50/50';
              if (isDeletedFromErp) {
                rowBg = 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-l-red-300';
              } else if (!isVisible) {
                rowBg = 'bg-gray-50/70 hover:bg-amber-50/50';
              }

              return (
                <li key={f.family_id} className={`p-4 transition-colors ${rowBg}`}>
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-semibold truncate ${
                            isDeletedFromErp ? 'text-red-700 line-through' : isVisible ? 'text-[#6B5A45]' : 'text-gray-500'
                          }`}
                        >
                          {f.effective_name}
                        </h3>
                        {!isDeletedFromErp && f.display_name && f.display_name !== f.raw_name && (
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                            (Xetux: {f.raw_name})
                          </span>
                        )}
                        {isDeletedFromErp && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold uppercase tracking-wide">
                            <AlertTriangle className="w-3 h-3" />
                            Eliminada del ERP
                          </span>
                        )}
                        {!isDeletedFromErp && f.parent_name && f.parent_name !== 'RAIZ' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C8A882]/15 text-[#8B7355] font-medium">
                            {f.parent_name}
                          </span>
                        )}
                        {!isDeletedFromErp && f.notice && (
                          <span title="Tiene disclaimer configurado">
                            <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-gray-400">/{f.slug || '—'}</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {f.item_count} {f.item_count === 1 ? 'item' : 'items'}
                        </span>
                        <span className="text-gray-400">#{f.family_id}</span>
                      </div>
                    </div>

                    {isDeletedFromErp ? (
                      <button
                        onClick={() => deletePermanently(f)}
                        disabled={isToggling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Borrar definitivamente"
                        title="Borrar esta familia del caché y su metadata"
                      >
                        {isToggling ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Borrar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleVisibility(f)}
                          disabled={isToggling}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isVisible
                              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } disabled:opacity-50`}
                          aria-label={isVisible ? 'Ocultar del menú' : 'Mostrar en el menú'}
                        >
                          {isToggling ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isVisible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          {isVisible ? 'Visible' : 'Oculta'}
                        </button>

                        <button
                          onClick={() => setEditing(f)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C8A882]/50 bg-white text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <FamilyEditModal
          key={editing.family_id}
          family={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
