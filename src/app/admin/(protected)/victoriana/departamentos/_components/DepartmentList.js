'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Pencil, MessageSquareWarning, Package, Layers, AlertTriangle, Trash2 } from 'lucide-react';
import { updateDepartmentMeta, deleteDepartmentPermanently } from '../actions';
import DepartmentEditModal from './DepartmentEditModal';

export default function DepartmentList({ departments }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(new Set());
  const [flash, setFlash] = useState(null);

  function showFlash(type, message) {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 2500);
  }

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
      showFlash('success', `«${dept.effective_name}» ${newValue ? 'visible' : 'oculta'} en el menú`);
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

  async function deletePermanently(dept) {
    const cascadeNote =
      dept.group_count > 0 || dept.product_count > 0
        ? `\n\n⚠️ Borrar este departamento también eliminará en cascada sus ${dept.group_count} grupos. ` +
          `Los ${dept.product_count} productos asociados quedarán huérfanos pero no se eliminarán del caché — ` +
          `puedes borrarlos aparte desde Victoriana · Items.`
        : '';
    const confirmed = window.confirm(
      `¿Borrar definitivamente «${dept.effective_name}»?\n\n` +
        `Este departamento ya no está en La Victoriana. Al borrarlo se elimina del caché y su metadata.${cascadeNote}\n\n` +
        `Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setToggling((prev) => new Set(prev).add(dept.codigo));
    const result = await deleteDepartmentPermanently(dept.codigo);
    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(dept.codigo);
      return next;
    });

    if (!result.ok) {
      showFlash('error', result.error || 'No se pudo borrar');
    } else {
      showFlash('success', `«${result.deletedName}» eliminado definitivamente`);
      router.refresh();
    }
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
            const isDeletedFromErp = d.is_active === false;

            let rowBg = 'bg-white hover:bg-red-50/30';
            if (isDeletedFromErp) {
              rowBg = 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-l-red-300';
            } else if (!isVisible) {
              rowBg = 'bg-gray-50/70 hover:bg-red-50/30';
            }

            return (
              <li key={d.codigo} className={`p-4 transition-colors ${rowBg}`}>
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-semibold truncate ${
                          isDeletedFromErp ? 'text-red-700 line-through' : isVisible ? 'text-[#6B5A45]' : 'text-gray-500'
                        }`}
                      >
                        {d.effective_name}
                      </h3>
                      {!isDeletedFromErp && d.display_name && d.display_name !== d.raw_name && (
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                          (ERP: {d.raw_name})
                        </span>
                      )}
                      {isDeletedFromErp && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3" />
                          Eliminado del ERP
                        </span>
                      )}
                      {!isDeletedFromErp && d.notice && (
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

                  {isDeletedFromErp ? (
                    <button
                      onClick={() => deletePermanently(d)}
                      disabled={isToggling}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Borrar este departamento (cascadea sus grupos)"
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
                    </>
                  )}
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
