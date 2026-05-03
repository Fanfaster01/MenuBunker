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
 * Borra DEFINITIVAMENTE un item del cache.
 *
 * Solo permitido para items con `is_active = false` (ya marcados como
 * eliminados del ERP por el sync). El CASCADE de la FK borra también
 * la metadata correspondiente, así que ANTES de llamar esto, asegúrate
 * de que el item realmente desapareció del ERP definitivamente.
 *
 * Esto es para limpieza manual del cache cuando el admin confirma que
 * el item ya no volverá.
 */
export async function deleteItemPermanently(xetuxItemId) {
  const { supabase } = await requireAdmin();

  if (!xetuxItemId || typeof xetuxItemId !== 'number') {
    return { ok: false, error: 'xetux_item_id inválido' };
  }

  // Guard: solo permitir borrado de items YA marcados inactivos.
  const { data: row, error: fetchErr } = await supabase
    .from('bunker_item_cache')
    .select('xetux_item_id, item_name, is_active, image_url:bunker_item_meta(image_url)')
    .eq('xetux_item_id', xetuxItemId)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!row) return { ok: false, error: 'Item no encontrado' };
  if (row.is_active !== false) {
    return {
      ok: false,
      error: 'Solo se pueden borrar definitivamente items marcados como "Eliminados del ERP".',
    };
  }

  const admin = getSupabaseAdmin();

  // Borrar imagen del Storage si existe (antes del CASCADE)
  const imageUrl = row.image_url?.[0]?.image_url || row.image_url?.image_url || null;
  if (imageUrl) {
    const path = extractStoragePathFromUrl(imageUrl, BUCKET);
    if (path) {
      await admin.storage.from(BUCKET).remove([path]).catch(() => {
        /* no bloqueamos por fallo del storage */
      });
    }
  }

  // DELETE en cache → CASCADE borra meta automáticamente.
  // Usamos admin client (service_role) porque las tablas *_cache no tienen
  // policy RLS para DELETE con usuario autenticado: solo el service_role puede
  // mutarlas. La autorización se garantiza vía requireAdmin() + guard is_active
  // arriba.
  const { error: delErr, count } = await admin
    .from('bunker_item_cache')
    .delete({ count: 'exact' })
    .eq('xetux_item_id', xetuxItemId);

  if (delErr) return { ok: false, error: delErr.message };
  if (count === 0) {
    return { ok: false, error: 'No se borró ninguna fila (verifica permisos RLS).' };
  }

  revalidatePath('/admin/bunker/items');
  return { ok: true, deletedName: row.item_name };
}

/**
 * Aplica el mismo patch a varios items de una.
 *
 * Uso típico: ocultar/mostrar 10 items, destacar/quitar destacado en bulk.
 * No se permite cambiar `image_url` ni `description` en bulk (no tiene sentido
 * UX y evita pisar datos personalizados sin querer). Solo flags + sort_order.
 *
 * @param {number[]} xetuxItemIds  Array de IDs (max 200)
 * @param {object} patch           Solo claves de BULK_ALLOWED
 */
const BULK_ALLOWED = ['is_featured', 'is_hidden', 'sort_order'];
const MAX_BULK_SIZE = 200;

export async function bulkUpdateItemMeta(xetuxItemIds, patch) {
  const { supabase } = await requireAdmin();

  if (!Array.isArray(xetuxItemIds) || xetuxItemIds.length === 0) {
    return { ok: false, error: 'xetuxItemIds debe ser un array no vacío' };
  }
  if (xetuxItemIds.length > MAX_BULK_SIZE) {
    return { ok: false, error: `Máximo ${MAX_BULK_SIZE} items por operación bulk` };
  }
  if (!xetuxItemIds.every((id) => typeof id === 'number' && Number.isInteger(id))) {
    return { ok: false, error: 'Todos los IDs deben ser enteros' };
  }

  const cleanPatch = {};
  for (const key of BULK_ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      cleanPatch[key] = patch[key];
    }
  }
  if (Object.keys(cleanPatch).length === 0) {
    return { ok: false, error: 'Sin cambios válidos. Permitidos: ' + BULK_ALLOWED.join(', ') };
  }

  // Upsert masivo: una fila por item con el mismo patch.
  // onConflict por PK (xetux_item_id) — si ya existe meta se actualiza, si no se crea.
  const rows = xetuxItemIds.map((id) => ({ xetux_item_id: id, ...cleanPatch }));

  const { error } = await supabase
    .from('bunker_item_meta')
    .upsert(rows, { onConflict: 'xetux_item_id' });

  if (error) {
    console.error('[bulkUpdateItemMeta]', error);
    return { ok: false, error: error.message || 'Error al guardar bulk' };
  }

  revalidatePath('/admin/bunker/items');
  revalidatePath('/bunker-restaurant/[slug]', 'page');

  return { ok: true, count: xetuxItemIds.length };
}

/**
 * Borra DEFINITIVAMENTE varios items en una operación. Solo permite los
 * que están marcados como is_active=false (eliminados del ERP). Si alguno
 * no cumple, se rechaza la operación entera (todo o nada).
 *
 * Borra también las imágenes asociadas del Storage. CASCADE FK borra metas.
 */
export async function bulkDeleteItemsPermanently(xetuxItemIds) {
  await requireAdmin();

  if (!Array.isArray(xetuxItemIds) || xetuxItemIds.length === 0) {
    return { ok: false, error: 'xetuxItemIds debe ser un array no vacío' };
  }
  if (xetuxItemIds.length > MAX_BULK_SIZE) {
    return { ok: false, error: `Máximo ${MAX_BULK_SIZE} items por operación bulk` };
  }

  const admin = getSupabaseAdmin();

  // Guard: TODOS los seleccionados deben ser is_active=false.
  const { data: rows, error: fetchErr } = await admin
    .from('bunker_item_cache')
    .select('xetux_item_id, item_name, is_active, bunker_item_meta(image_url)')
    .in('xetux_item_id', xetuxItemIds);

  if (fetchErr) return { ok: false, error: fetchErr.message };

  const found = new Set((rows ?? []).map((r) => r.xetux_item_id));
  const missing = xetuxItemIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    return { ok: false, error: `Items no encontrados: ${missing.length}` };
  }

  const stillActive = (rows ?? []).filter((r) => r.is_active !== false);
  if (stillActive.length > 0) {
    return {
      ok: false,
      error: `${stillActive.length} ítem(s) aún están activos en el ERP. Solo se pueden borrar los marcados como «Eliminados del ERP».`,
    };
  }

  // Borrar imágenes del Storage en paralelo (best-effort, no bloqueante)
  const paths = (rows ?? [])
    .map((r) => {
      const url = r.bunker_item_meta?.[0]?.image_url || r.bunker_item_meta?.image_url;
      return url ? extractStoragePathFromUrl(url, BUCKET) : null;
    })
    .filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from(BUCKET).remove(paths).catch(() => {
      /* best-effort */
    });
  }

  // DELETE en cache (CASCADE borra meta automáticamente)
  const { error: delErr, count } = await admin
    .from('bunker_item_cache')
    .delete({ count: 'exact' })
    .in('xetux_item_id', xetuxItemIds);

  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath('/admin/bunker/items');
  return { ok: true, count: count ?? xetuxItemIds.length };
}

/**
 * Helper: extrae el path interno del Storage desde un publicUrl.
 */
function extractStoragePathFromUrl(publicUrl, bucket) {
  if (!publicUrl) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(publicUrl.substring(idx + marker.length));
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
