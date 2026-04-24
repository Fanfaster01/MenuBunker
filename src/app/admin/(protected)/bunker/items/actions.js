'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.mjs';

const BUCKET = 'bunker-items';
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB post-compression cap

/**
 * Actualiza la metadata de un item Bunker.
 *
 * Upserts en bunker_item_meta por xetux_item_id.
 * Solo el admin (verificado por requireAdmin + RLS is_admin()) puede escribir.
 *
 * @param {number} xetuxItemId
 * @param {object} input  Campos editables. Si un campo NO viene, NO se modifica.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updateItemMeta(xetuxItemId, input) {
  const { supabase } = await requireAdmin();

  if (!xetuxItemId || typeof xetuxItemId !== 'number') {
    return { ok: false, error: 'xetux_item_id inválido' };
  }

  const ALLOWED = [
    'description',
    'image_url',
    'override_name',
    'is_featured',
    'is_hidden',
    'notes',
    'sort_order',
  ];

  const patch = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      patch[key] = input[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Sin cambios para aplicar' };
  }

  // Normalizar strings vacíos a null (preservar NULLs en columnas opcionales)
  for (const key of ['description', 'image_url', 'override_name', 'notes']) {
    if (patch[key] !== undefined && typeof patch[key] === 'string' && patch[key].trim() === '') {
      patch[key] = null;
    }
  }

  const { error } = await supabase
    .from('bunker_item_meta')
    .upsert({ xetux_item_id: xetuxItemId, ...patch }, { onConflict: 'xetux_item_id' });

  if (error) {
    console.error('[updateItemMeta] supabase error:', error);
    return { ok: false, error: error.message || 'Error al guardar' };
  }

  revalidatePath('/admin/bunker/items');
  revalidatePath('/bunker-restaurant/[slug]', 'page');

  return { ok: true };
}

/**
 * Sube una imagen al bucket bunker-items via Server Action.
 *
 * El cliente comprime primero (webp/jpg ~500KB) y nos pasa el Blob
 * como archivo en FormData. Aquí validamos admin + RLS y subimos al Storage
 * con el Supabase client server-side (que tiene la session por cookies).
 *
 * @param {FormData} formData  Debe contener: file (Blob), xetux_item_id (string)
 * @returns {Promise<{ok: boolean, url?: string, path?: string, error?: string, debug?: any}>}
 */
export async function uploadItemImage(formData) {
  const { supabase, user } = await requireAdmin();

  const file = formData.get('file');
  const xetuxItemIdRaw = formData.get('xetux_item_id');
  const xetuxItemId = Number(xetuxItemIdRaw);

  if (!file || typeof file === 'string') {
    return { ok: false, error: 'Archivo no recibido' };
  }
  if (!xetuxItemId) {
    return { ok: false, error: 'xetux_item_id inválido' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `La imagen supera el límite de ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Formato no soportado (usa JPG, PNG o WEBP)' };
  }

  // Extensión por tipo MIME (el cliente ya comprimió)
  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = extMap[file.type];
  const path = `${xetuxItemId}/${Date.now()}.${ext}`;

  // Convertir File/Blob a ArrayBuffer (server-side)
  const arrayBuffer = await file.arrayBuffer();

  // IMPORTANTE: el Storage upload lo hacemos con el admin client (service role)
  // porque el JWT del usuario no siempre se propaga correctamente al sub-cliente
  // de Storage desde @supabase/ssr. La autorización está cubierta por requireAdmin()
  // arriba, así que bypasear RLS aquí es seguro.
  const admin = getSupabaseAdmin();

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    upsert: true,
    contentType: file.type,
    cacheControl: '31536000',
  });

  if (uploadError) {
    console.error('[uploadItemImage] storage upload error:', uploadError);
    return {
      ok: false,
      error: uploadError.message || 'Error al subir al Storage',
      debug: { uploadError: uploadError.message, user_email: user.email },
    };
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Guardar URL en la meta
  const { error: metaError } = await supabase
    .from('bunker_item_meta')
    .upsert({ xetux_item_id: xetuxItemId, image_url: publicUrl }, { onConflict: 'xetux_item_id' });

  if (metaError) {
    console.error('[uploadItemImage] meta update error:', metaError);
    return { ok: false, error: metaError.message || 'Imagen subida pero no se pudo guardar la URL' };
  }

  revalidatePath('/admin/bunker/items');
  revalidatePath('/bunker-restaurant/[slug]', 'page');

  return { ok: true, url: publicUrl, path };
}

/**
 * Borra la imagen de un item (remueve del Storage + limpia image_url).
 */
export async function removeItemImage(xetuxItemId, storagePath) {
  const { supabase } = await requireAdmin();

  if (!xetuxItemId) return { ok: false, error: 'xetux_item_id requerido' };

  // Borrar del Storage si tenemos el path (usando admin client, ver nota en uploadItemImage)
  if (storagePath) {
    const admin = getSupabaseAdmin();
    const { error: rmError } = await admin.storage.from(BUCKET).remove([storagePath]);
    if (rmError) {
      console.error('[removeItemImage] storage error:', rmError);
      // No bloqueamos — si falla el storage, igual limpiamos la URL en DB
    }
  }

  const { error } = await supabase
    .from('bunker_item_meta')
    .upsert({ xetux_item_id: xetuxItemId, image_url: null }, { onConflict: 'xetux_item_id' });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/bunker/items');
  revalidatePath('/bunker-restaurant/[slug]', 'page');
  return { ok: true };
}
