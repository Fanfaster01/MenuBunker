'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.mjs';

const BUCKET = 'victoriana-items';
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/**
 * Actualiza metadata de un producto Victoriana. Upsert por codigo (PK).
 */
export async function updateProductMeta(codigo, input) {
  const { supabase } = await requireAdmin();

  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }

  const ALLOWED = ['description', 'image_url', 'override_name', 'is_featured', 'is_hidden', 'notes', 'sort_order'];
  const patch = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      patch[key] = input[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Sin cambios para aplicar' };
  }

  for (const key of ['description', 'image_url', 'override_name', 'notes']) {
    if (patch[key] !== undefined && typeof patch[key] === 'string' && patch[key].trim() === '') {
      patch[key] = null;
    }
  }

  const { error } = await supabase
    .from('victoriana_product_meta')
    .upsert({ codigo, ...patch }, { onConflict: 'codigo' });

  if (error) {
    console.error('[updateProductMeta]', error);
    return { ok: false, error: error.message || 'Error al guardar' };
  }

  revalidatePath('/admin/victoriana/items');
  revalidatePath('/la-victoriana/[slug]/[groupSlug]', 'page');

  return { ok: true };
}

/**
 * Sube imagen al bucket victoriana-items. Mismo patrón que Bunker:
 * cliente comprime, server usa service_role para el Storage.
 */
export async function uploadProductImage(formData) {
  const { user } = await requireAdmin();

  const file = formData.get('file');
  const codigo = formData.get('codigo');

  if (!file || typeof file === 'string') {
    return { ok: false, error: 'Archivo no recibido' };
  }
  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `La imagen supera ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Formato no soportado (usa JPG, PNG o WEBP)' };
  }

  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = extMap[file.type];
  const path = `${codigo}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const admin = getSupabaseAdmin();

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    upsert: true,
    contentType: file.type,
    cacheControl: '31536000',
  });

  if (uploadError) {
    console.error('[uploadProductImage] storage error:', uploadError);
    return {
      ok: false,
      error: uploadError.message || 'Error al subir al Storage',
      debug: { uploadError: uploadError.message, user_email: user.email },
    };
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Guardar URL en meta
  const { error: metaError } = await admin
    .from('victoriana_product_meta')
    .upsert({ codigo, image_url: publicUrl }, { onConflict: 'codigo' });

  if (metaError) {
    console.error('[uploadProductImage] meta error:', metaError);
    return { ok: false, error: metaError.message || 'Imagen subida pero no se pudo guardar la URL' };
  }

  revalidatePath('/admin/victoriana/items');
  revalidatePath('/la-victoriana/[slug]/[groupSlug]', 'page');

  return { ok: true, url: publicUrl, path };
}

/**
 * Borra la imagen de un producto.
 */
export async function removeProductImage(codigo, storagePath) {
  await requireAdmin();
  if (!codigo) return { ok: false, error: 'codigo requerido' };

  const admin = getSupabaseAdmin();

  if (storagePath) {
    const { error: rmError } = await admin.storage.from(BUCKET).remove([storagePath]);
    if (rmError) console.error('[removeProductImage] storage error:', rmError);
  }

  const { error } = await admin
    .from('victoriana_product_meta')
    .upsert({ codigo, image_url: null }, { onConflict: 'codigo' });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/victoriana/items');
  revalidatePath('/la-victoriana/[slug]/[groupSlug]', 'page');
  return { ok: true };
}
