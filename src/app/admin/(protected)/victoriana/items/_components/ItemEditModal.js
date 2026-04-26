'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Loader2, Package, Star } from 'lucide-react';
import { compressImage } from '@/lib/imageUpload';
import { uploadProductImage } from '../actions';

// Parent monta el modal condicionalmente con key={item.codigo} para reiniciar
// state via useState initializer en cada apertura.
export default function ItemEditModal({ item, onClose, onSave, onRemoveImage }) {
  const [values, setValues] = useState(() => ({
    override_name: item.override_name ?? '',
    description: item.custom_description ?? '',
    image_url: item.image_url ?? null,
    is_featured: !!item.is_featured,
    is_hidden: !!item.is_hidden,
    notes: item.notes ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving && !uploading) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving, uploading]);

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 10 MB antes de comprimir.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { blob, ext, mime } = await compressImage(file);
      const formData = new FormData();
      const compressedFile = new File([blob], `image.${ext}`, { type: mime });
      formData.append('file', compressedFile);
      formData.append('codigo', String(item.codigo));

      const result = await uploadProductImage(formData);

      if (!result.ok) {
        console.error('[upload debug]', result.debug);
        setError(result.error || 'No se pudo subir la imagen');
        return;
      }

      setField('image_url', result.url);
    } catch (err) {
      console.error('[upload client error]', err);
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    if (!values.image_url) return;
    if (!confirm('¿Eliminar la imagen de este producto?')) return;

    setUploading(true);
    setError(null);
    const result = await onRemoveImage({ ...item, image_url: values.image_url });
    if (result.ok) setField('image_url', null);
    else setError(result.error || 'No se pudo eliminar');
    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const patch = {
      override_name: values.override_name.trim() || null,
      description: values.description.trim() || null,
      image_url: values.image_url || null,
      is_featured: !!values.is_featured,
      is_hidden: !!values.is_hidden,
      notes: values.notes.trim() || null,
    };

    const result = await onSave(item.codigo, patch);
    setSaving(false);
    if (!result.ok) setError(result.error || 'Error al guardar');
  }

  const price = item.final_price != null ? `$${Number(item.final_price).toFixed(2)}` : '—';
  const previewName = values.override_name.trim() || item.raw_name;
  const previewDesc = values.description.trim() || item.descri_corta || '';
  const previewDetails = [item.marca, item.presentacion, `Cód. ${item.codigo}`].filter(Boolean).join(' · ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !uploading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#6B5A45] truncate">Editar producto</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              ERP: <span className="font-mono">{item.raw_name}</span> · #{item.codigo} · {item.department_name} → {item.group_name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* LEFT: Form */}
            <div className="px-6 py-5 space-y-5">
              {/* Image uploader */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                <div className="flex items-start gap-3">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex-shrink-0">
                    {values.image_url ? (
                      <Image src={values.image_url} alt={previewName} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFilePick}
                      disabled={uploading}
                      className="hidden"
                      id={`vfile-${item.codigo}`}
                    />
                    <label
                      htmlFor={`vfile-${item.codigo}`}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        uploading
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-[#C8A882] bg-white text-[#8B7355] hover:bg-[#C8A882]/10'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {values.image_url ? 'Reemplazar' : 'Subir imagen'}
                    </label>
                    {values.image_url && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    )}
                    <p className="text-[11px] text-gray-500 leading-tight">
                      JPG, PNG o WEBP · Max 5 MB · Se redimensiona a 1200×1200.
                    </p>
                  </div>
                </div>
              </div>

              <Field label="Nombre visible" help={`Si lo dejas vacío, se usa el del ERP: "${item.raw_name}"`}>
                <input
                  type="text"
                  value={values.override_name}
                  onChange={(e) => setField('override_name', e.target.value)}
                  placeholder={item.raw_name}
                  maxLength={100}
                  className="input"
                />
              </Field>

              <Field
                label="Descripción gourmet"
                help={
                  item.descri_corta
                    ? `ERP descripción corta: "${item.descri_corta}". Lo que escribas aquí se muestra en el menú.`
                    : 'Texto que aparece debajo del nombre del producto en el menú.'
                }
              >
                <textarea
                  value={values.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={item.descri_corta || 'Ej: Corte de res argentino ideal para asados'}
                  maxLength={500}
                  rows={4}
                  className="input resize-y min-h-[90px]"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-amber-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.is_featured}
                    onChange={(e) => setField('is_featured', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      Destacar
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-tight">
                      Aparece primero en su grupo
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-red-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.is_hidden}
                    onChange={(e) => setField('is_hidden', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-gray-700">Ocultar del menú</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-tight">
                      No aparece aunque el ERP lo tenga
                    </span>
                  </div>
                </label>
              </div>

              <Field label="Notas internas" help="Solo visibles en el admin.">
                <textarea
                  value={values.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Ej: revisar precio la próxima semana..."
                  maxLength={500}
                  rows={2}
                  className="input resize-y min-h-[50px]"
                />
              </Field>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{error}</div>
              )}
            </div>

            {/* RIGHT: Preview (estilo Victoriana: fondo oscuro) */}
            <div className="px-6 py-5 bg-gradient-to-br from-gray-900 via-black to-gray-900">
              <div className="sticky top-0">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Preview del menú
                </div>
                {values.image_url && (
                  <div className="relative w-full aspect-video bg-gray-800 rounded-xl mb-3 overflow-hidden">
                    <Image
                      src={values.image_url}
                      alt={previewName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <article className="bg-gray-900 rounded-xl p-4 border border-[#C8A882]/40 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-white leading-tight mb-1 flex items-center gap-1.5">
                        {previewName}
                        {values.is_featured && (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{previewDetails}</p>
                      {previewDesc && (
                        <p className="text-sm text-gray-400 leading-snug line-clamp-2">{previewDesc}</p>
                      )}
                    </div>
                    <span className="font-extrabold text-lg text-[#C8A882] whitespace-nowrap">{price}</span>
                  </div>
                </article>
                <p className="text-[11px] text-gray-500 mt-3 leading-snug">
                  Así se verá en <code className="bg-gray-800 text-gray-300 px-1 rounded">/la-victoriana/{item.department_slug || '…'}/{item.group_slug || '…'}</code>
                  {values.is_hidden && (
                    <span className="block mt-1 text-red-400 font-semibold">⚠ Oculto — no aparecerá en el menú público</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
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
