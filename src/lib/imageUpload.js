'use client';

/**
 * Helpers para subir imágenes de items/productos a Supabase Storage
 * desde el navegador. El cliente sube directo (usando su sesión JWT)
 * para evitar cargar el server con archivos grandes.
 */

import { getSupabaseBrowser } from './supabaseBrowser';

const MAX_DIM = 1200; // max edge size
const JPEG_QUALITY = 0.85;

/**
 * Resize + convert a JPEG/WebP en canvas.
 * Retorna un Blob listo para subir.
 */
export async function compressImage(file, { maxDim = MAX_DIM, quality = JPEG_QUALITY } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen');
  }

  const img = await fileToImage(file);
  const { width, height } = fitWithin(img.width, img.height, maxDim);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Preferimos webp si el navegador lo soporta
  const mime = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
  const ext = mime === 'image/webp' ? 'webp' : 'jpg';

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error('No se pudo comprimir la imagen');
  return { blob, ext, mime };
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitWithin(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

/**
 * Sube un archivo a un bucket público y retorna { url, path }.
 * El path se genera con prefijo + timestamp para evitar colisiones.
 *
 * @param {object} args
 * @param {string} args.bucket   — ej. 'bunker-items'
 * @param {string} args.prefix   — ej. String(xetux_item_id)
 * @param {File}   args.file     — archivo original del input
 */
export async function uploadImageToBucket({ bucket, prefix, file }) {
  const { blob, ext } = await compressImage(file);

  const supabase = getSupabaseBrowser();
  const timestamp = Date.now();
  const path = `${prefix}/${timestamp}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type,
    cacheControl: '31536000',
  });

  if (error) {
    throw new Error(error.message || 'Error al subir la imagen');
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: urlData.publicUrl, path };
}

/**
 * Dado un publicUrl del storage, retorna el path interno (ej. "123/1701234567.webp").
 * Útil para borrar después.
 */
export function extractStoragePath(publicUrl, bucket) {
  if (!publicUrl) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(publicUrl.substring(idx + marker.length));
}
