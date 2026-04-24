'use client';

import { useState } from 'react';
import { Eye, EyeOff, Pencil, MessageSquareWarning, Package, Layers } from 'lucide-react';
import { updateDepartmentMeta } from '../actions';
import DepartmentEditModal from './DepartmentEditModal';

export default function DepartmentList({ departments }) {
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(new Set());
  const [flash, setFlash] = useState(null);

  async function toggleVisibility(dept) {
    setToggling((prev) => new Set(prev).add(dept.codigo));
    const newValue = !dept.is_visible_on_menu;

    const result = await updateDepartmentMeta(dept.codigo, { is_visible_on_menu: newValue });

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(dept.codigo);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo actualizar');
    } else {
      showFlash('success', `"${dept.effective_name}" ${newValue ? 'visible' : 'oculta'} en el menú`);
    }
  }

  async function handleSave(codigo, patch) {
    const result = await updateDepartmentMeta(codigo, patch);
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

      <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 overflow-hidden">
        <ul className="divide-y divide-[#C8A882]/15">
          {departments.map((d) => {
            const isToggling = toggling.has(d.codigo);
            const isVisible = !!d.is_visible_on_menu;

            return (
              <li
                key={d.codigo}
                className={`p-4 transition-colors ${isVisible ? 'bg-white' : 'bg-gray-50/70'} hover:bg-red-50/30`}
              >
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${isVisible ? 'text-[#6B5A45]' : 'text-gray-500'} truncate`}>
                        {d.effective_name}
                      </h3>
                      {d.display_name && d.display_name !== d.raw_name && (
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                          (ERP: {d.raw_name})
                        </span>
                      )}
                      {d.notice && (
                        <span title="Tiene disclaimer configurado">
                          <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-gray-400">/{d.slug || '—'}</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {d.group_count} grupos
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {d.product_count} productos
                      </span>
                      <span className="text-gray-400">#{d.codigo}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleVisibility(d)}
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
                    onClick={() => setEditing(d)}
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
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay departamentos en la DB.</div>
      )}

      <DepartmentEditModal department={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </>
  );
}
