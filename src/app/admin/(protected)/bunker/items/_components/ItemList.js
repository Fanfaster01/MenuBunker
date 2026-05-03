'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil, Image as ImageIcon, FileText, Star, Eye, EyeOff, Search, X, Package, AlertTriangle, Trash2, CheckSquare, Square } from 'lucide-react';
import { updateItemMeta, removeItemImage, deleteItemPermanently, bulkUpdateItemMeta, bulkDeleteItemsPermanently } from '../actions';
import { extractStoragePath } from '@/lib/imageUpload';
import ItemEditModal from './ItemEditModal';

/**
 * Lista densa de items con búsqueda + filtro por familia + filtro de estado.
 */
export default function ItemList({ items, families }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(new Set()); // xetux_item_ids in-flight
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | no-image | no-desc | featured | hidden
  const [selected, setSelected] = useState(() => new Set()); // xetux_item_ids seleccionados (bulk)
  const [bulkRunning, setBulkRunning] = useState(false);

  // Apply filters
  const filteredItems = useMemo(() => {
    let list = items;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.effective_name?.toLowerCase().includes(q) ||
          i.raw_name?.toLowerCase().includes(q) ||
          String(i.xetux_item_id).includes(q)
      );
    }

    if (familyFilter !== 'all') {
      const fid = familyFilter === 'none' ? null : Number(familyFilter);
      list = list.filter((i) => i.default_family_id === fid);
    }

    if (statusFilter === 'no-image') list = list.filter((i) => !i.image_url);
    else if (statusFilter === 'no-desc') list = list.filter((i) => !i.custom_description);
    else if (statusFilter === 'featured') list = list.filter((i) => i.is_featured);
    else if (statusFilter === 'hidden-by-me') list = list.filter((i) => i.is_hidden && i.is_active !== false);
    else if (statusFilter === 'deleted-from-erp') list = list.filter((i) => i.is_active === false);

    return list;
  }, [items, query, familyFilter, statusFilter]);

  async function handleSave(itemId, patch) {
    const result = await updateItemMeta(itemId, patch);
    if (result.ok) {
      showFlash('success', 'Cambios guardados ✓');
      setEditing(null);
    }
    return result;
  }

  /**
   * Borra DEFINITIVAMENTE un item del cache (sólo permitido si is_active=false).
   * El CASCADE FK también borra su metadata.
   */
  async function deletePermanently(item) {
    const confirmed = window.confirm(
      `¿Borrar definitivamente "${item.effective_name}"?\n\n` +
        `Este item ya no está en Xetux. Al borrarlo se elimina del caché Y de su metadata ` +
        `(descripción gourmet, imagen, etc.).\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setToggling((prev) => new Set(prev).add(item.xetux_item_id));
    const result = await deleteItemPermanently(item.xetux_item_id);
    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(item.xetux_item_id);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo borrar');
    } else {
      showFlash('success', `"${result.deletedName}" eliminado definitivamente`);
      router.refresh(); // fuerza re-render del Server Component → item desaparece de la lista
    }
  }

  /**
   * Toggle rápido de visibilidad: invierte is_hidden.
   * Replica el UX de la lista de familias.
   */
  async function toggleVisibility(item) {
    setToggling((prev) => new Set(prev).add(item.xetux_item_id));
    const newHidden = !item.is_hidden;

    const result = await updateItemMeta(item.xetux_item_id, { is_hidden: newHidden });

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(item.xetux_item_id);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo actualizar');
    } else {
      showFlash(
        'success',
        `"${item.effective_name}" ${newHidden ? 'oculto del menú' : 'visible en el menú'}`
      );
    }
  }

  async function handleRemoveImage(item) {
    if (!item.image_url) return { ok: true };
    const path = extractStoragePath(item.image_url, 'bunker-items');
    const result = await removeItemImage(item.xetux_item_id, path);
    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo eliminar la imagen');
    } else {
      showFlash('success', 'Imagen eliminada');
    }
    return result;
  }

  function showFlash(type, message) {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 2500);
  }

  function resetFilters() {
    setQuery('');
    setFamilyFilter('all');
    setStatusFilter('all');
  }

  const hasActiveFilters = query || familyFilter !== 'all' || statusFilter !== 'all';

  // ---------- Bulk selection ----------
  const visibleIds = useMemo(() => filteredItems.map((i) => i.xetux_item_id), [filteredItems]);
  const selectedCount = selected.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        // Deselecciona solo los visibles (mantiene seleccionados de otros filtros)
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function runBulk(label, action) {
    if (selectedCount === 0) return;
    setBulkRunning(true);
    const ids = Array.from(selected);
    const result = await action(ids);
    setBulkRunning(false);
    if (!result.ok) {
      showFlash('error', result.error || `No se pudo ${label}`);
      return;
    }
    showFlash('success', `${result.count ?? ids.length} ítem(s) ${label}`);
    clearSelection();
    router.refresh();
  }

  async function bulkHide() {
    return runBulk('ocultados', (ids) => bulkUpdateItemMeta(ids, { is_hidden: true }));
  }
  async function bulkShow() {
    return runBulk('visibles', (ids) => bulkUpdateItemMeta(ids, { is_hidden: false }));
  }
  async function bulkFeature() {
    return runBulk('destacados', (ids) => bulkUpdateItemMeta(ids, { is_featured: true }));
  }
  async function bulkUnfeature() {
    return runBulk('sin destacar', (ids) => bulkUpdateItemMeta(ids, { is_featured: false }));
  }
  async function bulkDelete() {
    const confirmed = window.confirm(
      `¿Borrar definitivamente ${selectedCount} ítem(s)?\n\n` +
        `Solo los marcados como «Eliminados del ERP» pueden borrarse. Si alguno no cumple, ` +
        `la operación entera se cancela (todo o nada).\n\nNo se puede deshacer.`
    );
    if (!confirmed) return;
    return runBulk('eliminados definitivamente', (ids) => bulkDeleteItemsPermanently(ids));
  }

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
      <div className="bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o ID…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-hidden focus:border-[#C8A882] focus:ring-2 focus:ring-[#C8A882]/20"
            />
          </div>

          {/* Family filter */}
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-hidden focus:border-[#C8A882]"
          >
            <option value="all">Todas las familias</option>
            <option value="none">— Sin familia</option>
            {families.map((f) => (
              <option key={f.family_id} value={f.family_id}>
                {f.effective_name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-hidden focus:border-[#C8A882]"
          >
            <option value="all">Todos los estados</option>
            <option value="no-image">Sin imagen</option>
            <option value="no-desc">Sin descripción gourmet</option>
            <option value="featured">Destacados</option>
            <option value="hidden-by-me">Ocultos por mí</option>
            <option value="deleted-from-erp">🗑️ Eliminados del ERP</option>
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
            {filteredItems.length} / {items.length}
          </span>
        </div>
      </div>

      {/* Bulk action bar (sticky cuando hay selección) */}
      {selectedCount > 0 && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#C8A882]/40 bg-white shadow-md px-4 py-2.5">
          <span className="text-sm font-semibold text-[#6B5A45]">
            {selectedCount} ítem(s) seleccionado(s)
          </span>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            <button
              onClick={bulkShow}
              disabled={bulkRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" /> Mostrar
            </button>
            <button
              onClick={bulkHide}
              disabled={bulkRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <EyeOff className="w-3.5 h-3.5" /> Ocultar
            </button>
            <button
              onClick={bulkFeature}
              disabled={bulkRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              <Star className="w-3.5 h-3.5" /> Destacar
            </button>
            <button
              onClick={bulkUnfeature}
              disabled={bulkRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Quitar destaque
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar
            </button>
            <button
              onClick={clearSelection}
              disabled={bulkRunning}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {hasActiveFilters ? 'Ningún item coincide con los filtros.' : 'No hay items.'}
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-[#C8A882]/20 bg-gray-50/50 flex items-center gap-2">
              <button
                onClick={toggleSelectAllVisible}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#6B5A45] transition-colors"
                aria-label={allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar todos los visibles'}
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#8B7355]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar todos los visibles'}
              </button>
            </div>
            <ul className="divide-y divide-[#C8A882]/15">
              {filteredItems.map((item) => (
                <ItemRow
                  key={item.xetux_item_id}
                  item={item}
                  isSelected={selected.has(item.xetux_item_id)}
                  onToggleSelect={() => toggleSelect(item.xetux_item_id)}
                  isToggling={toggling.has(item.xetux_item_id)}
                  onEdit={() => setEditing(item)}
                  onToggleVisibility={() => toggleVisibility(item)}
                  onDeletePermanently={() => deletePermanently(item)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {editing && (
        <ItemEditModal
          key={editing.item_id}
          item={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onRemoveImage={handleRemoveImage}
        />
      )}
    </>
  );
}

function ItemRow({ item, isSelected, onToggleSelect, isToggling, onEdit, onToggleVisibility, onDeletePermanently }) {
  const price = item.final_price != null ? `$${Number(item.final_price).toFixed(2)}` : '—';
  const hasImage = !!item.image_url;
  const hasDesc = !!item.custom_description;
  const isVisible = !item.is_hidden;
  const isDeletedFromErp = item.is_active === false;

  // Estilos del row según estado
  let rowBg = 'bg-white hover:bg-amber-50/50';
  if (isDeletedFromErp) {
    rowBg = 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-l-red-300';
  } else if (!isVisible) {
    rowBg = 'bg-gray-50/70 opacity-70 hover:bg-amber-50/30';
  }

  return (
    <li className={`p-3 sm:p-4 flex items-center gap-3 transition-colors ${rowBg} ${isSelected ? 'ring-2 ring-inset ring-[#C8A882]/60' : ''}`}>
      {/* Checkbox de selección */}
      <input
        type="checkbox"
        checked={!!isSelected}
        onChange={onToggleSelect}
        className="w-4 h-4 rounded-sm border-gray-300 text-[#C8A882] focus:ring-[#C8A882] shrink-0 cursor-pointer"
        aria-label={isSelected ? 'Deseleccionar item' : 'Seleccionar item'}
      />

      {/* Thumbnail */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
        {hasImage ? (
          <Image src={item.image_url} alt={item.effective_name} fill sizes="56px" className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3
            className={`font-semibold truncate ${
              isDeletedFromErp ? 'text-red-700 line-through' : isVisible ? 'text-[#6B5A45]' : 'text-gray-500'
            }`}
          >
            {item.effective_name}
          </h3>
          {item.is_featured && !isDeletedFromErp && (
            <span title="Destacado" className="inline-flex">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
          )}
          {isDeletedFromErp && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 font-bold uppercase tracking-wide">
              <AlertTriangle className="w-3 h-3" />
              Eliminado del ERP
            </span>
          )}
          {item.family_effective_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#C8A882]/15 text-[#8B7355] font-medium">
              {item.family_effective_name}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="text-gray-400">#{item.xetux_item_id}</span>
          <span className="font-mono font-semibold text-[#8B7355]">{price}</span>
          <span className={`flex items-center gap-1 text-[10px] ${hasImage ? 'text-green-600' : 'text-gray-400'}`}>
            <ImageIcon className="w-3 h-3" />
            {hasImage ? 'Imagen' : 'Sin imagen'}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${hasDesc ? 'text-green-600' : 'text-gray-400'}`}>
            <FileText className="w-3 h-3" />
            {hasDesc ? 'Descripción' : 'Sin desc. gourmet'}
          </span>
        </div>
      </div>

      {isDeletedFromErp ? (
        // Estado "Eliminado del ERP": solo ofrecer borrado definitivo
        <button
          onClick={onDeletePermanently}
          disabled={isToggling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Borrar definitivamente"
          title="Borrar este item del caché y su metadata"
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
          {/* Quick visibility toggle */}
          <button
            onClick={onToggleVisibility}
            disabled={isToggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
              isVisible
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isVisible ? 'Ocultar del menú' : 'Mostrar en el menú'}
          >
            {isToggling ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {isVisible ? 'Visible' : 'Oculto'}
          </button>

          {/* Edit button */}
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C8A882]/50 bg-white text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        </>
      )}
    </li>
  );
}
