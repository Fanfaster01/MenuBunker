'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Pencil, Image as ImageIcon, FileText, Star, EyeOff, Search, X, Package } from 'lucide-react';
import { updateProductMeta, removeProductImage } from '../actions';
import { extractStoragePath } from '@/lib/imageUpload';
import ItemEditModal from './ItemEditModal';

const PAGE_SIZE = 100;

export default function ItemList({ items, departments, groups }) {
  const [editing, setEditing] = useState(null);
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Grupos que pertenecen al departamento seleccionado (si hay)
  const availableGroups = useMemo(() => {
    if (deptFilter === 'all') return groups;
    return groups.filter((g) => g.departamento_codigo === deptFilter);
  }, [groups, deptFilter]);

  // Si cambia el departamento y el grupo actual ya no aplica → resetear
  function handleDeptChange(newDept) {
    setDeptFilter(newDept);
    if (newDept !== 'all' && groupFilter !== 'all') {
      const stillValid = groups.some((g) => g.departamento_codigo === newDept && g.codigo === groupFilter);
      if (!stillValid) setGroupFilter('all');
    }
    setVisibleCount(PAGE_SIZE);
  }

  const filteredItems = useMemo(() => {
    let list = items;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.effective_name?.toLowerCase().includes(q) ||
          i.raw_name?.toLowerCase().includes(q) ||
          i.marca?.toLowerCase().includes(q) ||
          i.codigo?.toLowerCase().includes(q)
      );
    }

    if (deptFilter !== 'all') {
      list = list.filter((i) => i.departamento_codigo === deptFilter);
    }
    if (groupFilter !== 'all') {
      list = list.filter((i) => i.grupo_codigo === groupFilter);
    }

    if (statusFilter === 'no-image') list = list.filter((i) => !i.image_url);
    else if (statusFilter === 'no-desc') list = list.filter((i) => !i.custom_description);
    else if (statusFilter === 'featured') list = list.filter((i) => i.is_featured);
    else if (statusFilter === 'hidden') list = list.filter((i) => i.is_hidden);

    return list;
  }, [items, query, deptFilter, groupFilter, statusFilter]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  async function handleSave(codigo, patch) {
    const result = await updateProductMeta(codigo, patch);
    if (result.ok) {
      showFlash('success', 'Cambios guardados ✓');
      setEditing(null);
    }
    return result;
  }

  async function handleRemoveImage(item) {
    if (!item.image_url) return { ok: true };
    const path = extractStoragePath(item.image_url, 'victoriana-items');
    const result = await removeProductImage(item.codigo, path);
    if (!result.ok) showFlash('error', result.error || 'No se pudo eliminar la imagen');
    else showFlash('success', 'Imagen eliminada');
    return result;
  }

  function showFlash(type, message) {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 2500);
  }

  function resetFilters() {
    setQuery('');
    setDeptFilter('all');
    setGroupFilter('all');
    setStatusFilter('all');
    setVisibleCount(PAGE_SIZE);
  }

  const hasActiveFilters = query || deptFilter !== 'all' || groupFilter !== 'all' || statusFilter !== 'all';

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
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Buscar por nombre, marca o código…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#C8302E] focus:ring-2 focus:ring-[#C8302E]/15"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => handleDeptChange(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8302E]"
          >
            <option value="all">Todos los depts.</option>
            {departments.map((d) => (
              <option key={d.codigo} value={d.codigo}>
                {d.effective_name}
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            disabled={deptFilter === 'all'}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8302E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">Todos los grupos</option>
            {/* Key compuesta: los codigos de grupo se repiten entre depts
                (ej. "01" existe en 6 depts), así que necesitamos depto+codigo
                para que React asigne keys únicas. */}
            {availableGroups.map((g) => (
              <option key={`${g.departamento_codigo}-${g.codigo}`} value={g.codigo}>
                {g.effective_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8302E]"
          >
            <option value="all">Todos los estados</option>
            <option value="no-image">Sin imagen</option>
            <option value="no-desc">Sin descripción</option>
            <option value="featured">Destacados</option>
            <option value="hidden">Ocultos</option>
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

          <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
            {filteredItems.length.toLocaleString('es')} / {items.length.toLocaleString('es')}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {hasActiveFilters ? 'Ningún producto coincide con los filtros.' : 'No hay productos.'}
          </div>
        ) : (
          <ul className="divide-y divide-[#C8A882]/15">
            {visibleItems.map((item) => (
              <ItemRow key={item.codigo} item={item} onEdit={() => setEditing(item)} />
            ))}
          </ul>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-white border border-[#C8A882]/50 text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors"
          >
            Mostrar {Math.min(PAGE_SIZE, filteredItems.length - visibleCount)} más
          </button>
        </div>
      )}

      <ItemEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onRemoveImage={handleRemoveImage}
      />
    </>
  );
}

function ItemRow({ item, onEdit }) {
  const price = item.final_price != null ? `$${Number(item.final_price).toFixed(2)}` : '—';
  const hasImage = !!item.image_url;
  const hasDesc = !!item.custom_description;
  const details = [item.marca, item.presentacion].filter(Boolean).join(' · ');

  return (
    <li className={`p-3 sm:p-4 flex items-center gap-3 hover:bg-red-50/30 transition-colors ${item.is_hidden ? 'opacity-60' : ''}`}>
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
        {hasImage ? (
          <Image
            src={item.image_url}
            alt={item.effective_name}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="font-semibold text-[#6B5A45] truncate">{item.effective_name}</h3>
          {item.is_featured && (
            <span title="Destacado" className="inline-flex">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
          )}
          {item.is_hidden && (
            <span title="Oculto del menú" className="inline-flex">
              <EyeOff className="w-3.5 h-3.5 text-red-500" />
            </span>
          )}
          {item.group_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C8A882]/15 text-[#8B7355] font-medium">
              {item.group_name}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-gray-400">#{item.codigo}</span>
          {details && <span className="text-gray-500">{details}</span>}
          <span className="font-mono font-semibold text-[#C8A882]">{price}</span>
          <span className={`flex items-center gap-1 text-[10px] ${hasImage ? 'text-green-600' : 'text-gray-400'}`}>
            <ImageIcon className="w-3 h-3" />
            {hasImage ? 'Imagen' : 'Sin imagen'}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${hasDesc ? 'text-green-600' : 'text-gray-400'}`}>
            <FileText className="w-3 h-3" />
            {hasDesc ? 'Descripción' : 'Sin desc.'}
          </span>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C8A882]/50 bg-white text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors flex-shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </button>
    </li>
  );
}
