'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Loader2, Package, Star } from 'lucide-react';
import { compressImage } from '@/lib/imageUpload';
import { uploadItemImage } from '../actions';

/**
 * Modal de edición de un item Bunker.
 *
 * Layout: 2 columnas en desktop (form + preview).
 * En móvil: apilado.
 */
// Parent monta el modal condicionalmente con key={item.item_id} para reiniciar
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

  // Cerrar con ESC
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
      // 1. Comprimir en el cliente (canvas → webp/jpg, max 1200×1200)
      const { blob, ext, mime } = await compressImage(file);

      // 2. Empaquetar en FormData para mandarlo a la Server Action
      const formData = new FormData();
      const filename = `image.${ext}`;
      const compressedFile = new File([blob], filename, { type: mime });
      formData.append('file', compressedFile);
      formData.append('xetux_item_id', String(item.xetux_item_id));

      // 3. Subir via Server Action (maneja RLS + actualiza bunker_item_meta)
      const result = await uploadItemImage(formData);

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
    if (!confirm('¿Eliminar la imagen de este item?')) return;

    setUploading(true);
    setError(null);

    const result = await onRemoveImage({ ...item, image_url: values.image_url });
    if (result.ok) {
      setField('image_url', null);
    } else {
      setError(result.error || 'No se pudo eliminar');
    }
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

    const result = await onSave(item.xetux_item_id, patch);
    setSaving(false);

    if (!result.ok) {
      setError(result.error || 'Error al guardar');
    }
  }

  const price = item.final_price != null ? `$${Number(item.final_price).toFixed(2)}` : '—';
  const previewName = values.override_name.trim() || item.raw_name;
  const previewDesc = values.description.trim() || item.xetux_description || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !uploading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-linear-to-r from-amber-50 to-white shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#6B5A45] truncate">Editar item</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Xetux: <span className="font-mono">{item.raw_name}</span> · ID {item.xetux_item_id} · {item.family_effective_name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50 shrink-0"
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
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 shrink-0">
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
                      id={`file-${item.xetux_item_id}`}
                    />
                    <label
                      htmlFor={`file-${item.xetux_item_id}`}
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

              {/* Override name */}
              <Field
                label="Nombre visible"
                help={`Si lo dejas vacío, se usa el de Xetux: "${item.raw_name}"`}
              >
                <input
                  type="text"
                  value={values.override_name}
                  onChange={(e) => setField('override_name', e.target.value)}
                  placeholder={item.raw_name}
                  maxLength={100}
                  className="input"
                />
              </Field>

              {/* Description */}
              <Field
                label="Descripción gourmet"
                help={
                  item.xetux_description
                    ? `Xetux dice: "${item.xetux_description}". Lo que escribas aquí reemplaza eso en el menú digital.`
                    : 'Texto que aparece debajo del nombre en la tarjeta del menú.'
                }
              >
                <textarea
                  value={values.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={item.xetux_description || 'Ej: Jugoso corte de lomo acompañado de puré casero y chimichurri'}
                  maxLength={500}
                  rows={4}
                  className="input resize-y min-h-[90px]"
                />
              </Field>

              {/* Flags */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-amber-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.is_featured}
                    onChange={(e) => setField('is_featured', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      Destacar
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-tight">
                      Aparece primero en su familia
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-red-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.is_hidden}
                    onChange={(e) => setField('is_hidden', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-gray-300 text-red-500 focus:ring-red-400"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-gray-700">Ocultar del menú</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-tight">
                      No aparece aunque Xetux lo tenga visible
                    </span>
                  </div>
                </label>
              </div>

              {/* Notes (privadas) */}
              <Field label="Notas internas" help="Solo visibles en el admin. No aparecen en el menú público.">
                <textarea
                  value={values.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Ej: cambiar foto por una mejor..."
                  maxLength={500}
                  rows={2}
                  className="input resize-y min-h-[50px]"
                />
              </Field>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{error}</div>
              )}
            </div>

            {/* RIGHT: Preview */}
            <div className="px-6 py-5 bg-linear-to-br from-amber-50 via-white to-orange-50">
              <div className="sticky top-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Preview del menú
                </div>
                <div className="bg-white rounded-xl shadow-md border border-[#C8A882]/40 overflow-hidden">
                  {values.image_url && (
                    <div className="relative w-full aspect-video bg-gray-100">
                      <Image
                        src={values.image_url}
                        alt={previewName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#6B5A45] text-base leading-tight flex items-center gap-1.5">
                          {previewName}
                          {values.is_featured && (
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </h3>
                        {previewDesc && (
                          <p className="text-sm text-gray-600 leading-snug mt-1">{previewDesc}</p>
                        )}
                      </div>
                      <span className="font-extrabold text-[#8B7355] whitespace-nowrap">{price}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 mt-3 leading-snug">
                  Así se verá en <code className="bg-white px-1 rounded-sm">/bunker-restaurant/{item.family_slug || '…'}</code>
                  {values.is_hidden && (
                    <span className="block mt-1 text-red-600 font-semibold">⚠ Oculto — no aparecerá en el menú público</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
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
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-[#C8A882] to-[#8B7355] hover:shadow-md transition-all disabled:opacity-50"
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
          border-color: #c8a882;
          box-shadow: 0 0 0 3px rgba(200, 168, 130, 0.2);
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
