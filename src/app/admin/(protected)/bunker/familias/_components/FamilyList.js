'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Pencil, Users, MessageSquareWarning, Package } from 'lucide-react';
import { updateFamilyMeta } from '../actions';
import FamilyEditModal from './FamilyEditModal';

/**
 * Lista de familias con quick-toggle de visibilidad y botón de edición.
 */
export default function FamilyList({ families }) {
  const [editing, setEditing] = useState(null); // family object or null
  const [toggling, setToggling] = useState(new Set()); // family_ids currently saving
  const [flash, setFlash] = useState(null); // { type, message }
  const [, startTransition] = useTransition();

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
      setFlash({ type: 'error', message: result.error || 'No se pudo actualizar' });
      setTimeout(() => setFlash(null), 3500);
    } else {
      setFlash({ type: 'success', message: `"${family.effective_name}" ${newValue ? 'visible' : 'oculta'} en el menú` });
      setTimeout(() => setFlash(null), 2500);
      startTransition(() => {
        // Next refresca el RSC cuando el revalidatePath dispara
      });
    }
  }

  async function handleSave(familyId, patch) {
    const result = await updateFamilyMeta(familyId, patch);
    if (result.ok) {
      setFlash({ type: 'success', message: 'Cambios guardados ✓' });
      setTimeout(() => setFlash(null), 2500);
      setEditing(null);
    }
    return result;
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
          {families.map((f) => {
            const isToggling = toggling.has(f.family_id);
            const isVisible = !!f.is_visible_on_menu;

            return (
              <li
                key={f.family_id}
                className={`p-4 transition-colors ${isVisible ? 'bg-white' : 'bg-gray-50/70'} hover:bg-amber-50/50`}
              >
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {/* Nombre + raw */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${isVisible ? 'text-[#6B5A45]' : 'text-gray-500'} truncate`}>
                        {f.effective_name}
                      </h3>
                      {f.display_name && f.display_name !== f.raw_name && (
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                          (Xetux: {f.raw_name})
                        </span>
                      )}
                      {f.parent_name && f.parent_name !== 'RAIZ' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C8A882]/15 text-[#8B7355] font-medium">
                          {f.parent_name}
                        </span>
                      )}
                      {f.notice && (
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

                  {/* Quick toggle visibilidad */}
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

                  {/* Botón editar */}
                  <button
                    onClick={() => setEditing(f)}
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

      {families.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay familias habilitadas en Xetux.</div>
      )}

      <FamilyEditModal family={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </>
  );
}
