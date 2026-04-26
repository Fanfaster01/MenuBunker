'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal para editar la metadata de un departamento Victoriana.
 * Props: department (o null), onClose, onSave(codigo, patch).
 */
// Parent monta el modal condicionalmente con key={dept.codigo} para reiniciar
// state via useState initializer en cada apertura.
export default function DepartmentEditModal({ department, onClose, onSave }) {
  const [values, setValues] = useState(() => ({
    display_name: department.display_name ?? '',
    description: department.description ?? '',
    notice: department.notice ?? '',
    slug: department.slug ?? '',
    sort_order: department.sort_order ?? 0,
    is_visible_on_menu: !!department.is_visible_on_menu,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const patch = {
      display_name: values.display_name.trim() || null,
      description: values.description.trim() || null,
      notice: values.notice.trim() || null,
      slug: values.slug.trim().toLowerCase(),
      sort_order: Number.isFinite(Number(values.sort_order)) ? Number(values.sort_order) : 0,
      is_visible_on_menu: !!values.is_visible_on_menu,
    };

    const result = await onSave(department.codigo, patch);
    setSaving(false);
    if (!result.ok) setError(result.error || 'Error al guardar');
  }

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-[#6B5A45]">Editar departamento</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ERP: <span className="font-mono">{department.raw_name}</span> · #{department.codigo} · {department.group_count} grupos · {department.product_count} productos
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            <Field label="Nombre visible" help={`Si lo dejas vacío, se usa el del ERP: "${department.raw_name}"`}>
              <input
                type="text"
                value={values.display_name}
                onChange={(e) => setField('display_name', e.target.value)}
                placeholder={department.raw_name}
                maxLength={100}
                className="input"
              />
            </Field>

            <Field label="Slug (URL)" help="Solo letras minúsculas, números y guiones.">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">/la-victoriana/</span>
                <input
                  type="text"
                  value={values.slug}
                  onChange={(e) => setField('slug', e.target.value.toLowerCase())}
                  pattern="[a-z0-9-]+"
                  required
                  maxLength={80}
                  className="input flex-1"
                />
              </div>
            </Field>

            <Field label="Descripción (subtítulo)" help="Texto corto que aparece debajo del nombre.">
              <input
                type="text"
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Ej: Carnes frescas y cortes seleccionados"
                maxLength={200}
                className="input"
              />
            </Field>

            <Field label="Aviso / disclaimer" help="Mensaje destacado en la página del departamento.">
              <textarea
                value={values.notice}
                onChange={(e) => setField('notice', e.target.value)}
                placeholder="Ej: Los precios pueden variar según disponibilidad."
                maxLength={500}
                rows={3}
                className="input resize-y min-h-[72px]"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Orden" help="Menor número aparece primero.">
                <input
                  type="number"
                  value={values.sort_order}
                  onChange={(e) => setField('sort_order', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Visibilidad" help=" ">
                <label className="flex items-center gap-2 h-10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.is_visible_on_menu}
                    onChange={(e) => setField('is_visible_on_menu', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#C8302E] focus:ring-[#C8302E]"
                  />
                  <span className="text-sm text-gray-700">
                    {values.is_visible_on_menu ? 'Visible en el menú' : 'Oculto del menú'}
                  </span>
                </label>
              </Field>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{error}</div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C8302E] to-red-700 hover:shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          transition: all 150ms;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #c8302e;
          box-shadow: 0 0 0 3px rgba(200, 48, 46, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  );
}
