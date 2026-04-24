'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Package, Search, X } from 'lucide-react';
import { updateGroupMeta } from '../actions';
import GroupEditModal from './GroupEditModal';

/**
 * Clave única compuesta para un grupo. Necesario porque los `codigo` se
 * repiten entre departamentos (ej. "01" existe en 6 depts distintos).
 */
function groupKey(g) {
  return `${g.departamento_codigo}:${g.codigo}`;
}

export default function GroupList({ groups, departments }) {
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(new Set());
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredGroups = useMemo(() => {
    let list = groups;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (g) => g.effective_name?.toLowerCase().includes(q) || g.raw_name?.toLowerCase().includes(q)
      );
    }

    if (deptFilter !== 'all') {
      list = list.filter((g) => g.departamento_codigo === deptFilter);
    }

    if (statusFilter === 'visible') list = list.filter((g) => g.is_visible_on_menu);
    else if (statusFilter === 'hidden') list = list.filter((g) => !g.is_visible_on_menu);
    else if (statusFilter === 'empty') list = list.filter((g) => g.product_count === 0);

    return list;
  }, [groups, query, deptFilter, statusFilter]);

  async function toggleVisibility(group) {
    const key = groupKey(group);
    setToggling((prev) => new Set(prev).add(key));
    const newValue = !group.is_visible_on_menu;

    const result = await updateGroupMeta(group.codigo, group.departamento_codigo, {
      is_visible_on_menu: newValue,
    });

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo actualizar');
    } else {
      showFlash('success', `"${group.effective_name}" ${newValue ? 'visible' : 'oculto'}`);
    }
  }

  async function handleSave(codigo, departamento_codigo, patch) {
    const result = await updateGroupMeta(codigo, departamento_codigo, patch);
    if (result.ok) {
      showFlash('success', 'Cambios guardados ✓');
      setEditing(null);
    }
    return result;
  }

  function showFlash(type, message) {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 2500);
  }

  function resetFilters() {
    setQuery('');
    setDeptFilter('all');
    setStatusFilter('all');
  }

  const hasActiveFilters = query || deptFilter !== 'all' || statusFilter !== 'all';

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
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#C8302E] focus:ring-2 focus:ring-[#C8302E]/15"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8302E]"
          >
            <option value="all">Todos los departamentos</option>
            {departments.map((d) => (
              <option key={d.codigo} value={d.codigo}>
                {d.effective_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#C8302E]"
          >
            <option value="all">Todos los estados</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultos</option>
            <option value="empty">Sin productos</option>
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
            {filteredGroups.length} / {groups.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 overflow-hidden">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {hasActiveFilters ? 'Ningún grupo coincide con los filtros.' : 'No hay grupos.'}
          </div>
        ) : (
          <ul className="divide-y divide-[#C8A882]/15">
            {filteredGroups.map((g) => {
              const key = groupKey(g);
              const isToggling = toggling.has(key);
              const isVisible = !!g.is_visible_on_menu;

              return (
                <li
                  key={key}
                  className={`p-4 transition-colors ${isVisible ? 'bg-white' : 'bg-gray-50/70'} hover:bg-red-50/30`}
                >
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${isVisible ? 'text-[#6B5A45]' : 'text-gray-500'} truncate`}>
                          {g.effective_name}
                        </h3>
                        {g.display_name && g.display_name !== g.raw_name && (
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                            (ERP: {g.raw_name})
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C8A882]/15 text-[#8B7355] font-medium">
                          {g.department_name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-gray-400">/{g.slug || '—'}</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {g.product_count} productos
                        </span>
                        <span className="text-gray-400">#{g.codigo}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleVisibility(g)}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isVisible
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } disabled:opacity-50`}
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

                    <button
                      onClick={() => setEditing(g)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C8A882]/50 bg-white text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <GroupEditModal group={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </>
  );
}
