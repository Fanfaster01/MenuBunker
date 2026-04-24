'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Actualiza la metadata de una familia Bunker.
 *
 * Upserts en bunker_family_meta por family_id. Solo el admin (verificado por
 * requireAdmin + RLS policy is_admin()) puede escribir.
 *
 * @param {number} familyId
 * @param {object} input  Campos editables. Cualquiera puede ser null/undefined.
 *                        Si un campo NO viene en input, NO se modifica.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updateFamilyMeta(familyId, input) {
  const { supabase } = await requireAdmin();

  if (!familyId || typeof familyId !== 'number') {
    return { ok: false, error: 'family_id inválido' };
  }

  // Construir el patch solo con claves presentes en input
  const patch = {};
  const ALLOWED = ['display_name', 'description', 'notice', 'slug', 'sort_order', 'is_visible_on_menu', 'icon_url'];
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      patch[key] = input[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Sin cambios para aplicar' };
  }

  // Normalizar strings vacíos a null (preservar NULLs semánticos en columnas opcionales)
  for (const key of ['display_name', 'description', 'notice', 'icon_url']) {
    if (patch[key] !== undefined && typeof patch[key] === 'string' && patch[key].trim() === '') {
      patch[key] = null;
    }
  }

  // Validar slug si viene
  if (patch.slug !== undefined) {
    if (typeof patch.slug !== 'string' || !patch.slug.trim()) {
      return { ok: false, error: 'El slug no puede estar vacío' };
    }
    const slug = patch.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { ok: false, error: 'El slug solo puede tener letras minúsculas, números y guiones' };
    }
    patch.slug = slug;
  }

  // Upsert por family_id. Si no existe el row, lo crea; si existe, actualiza.
  const { error } = await supabase
    .from('bunker_family_meta')
    .upsert({ family_id: familyId, ...patch }, { onConflict: 'family_id' });

  if (error) {
    console.error('[updateFamilyMeta] supabase error:', error);
    // Error de uniqueness en slug probablemente
    if (error.code === '23505') {
      return { ok: false, error: 'Ese slug ya está en uso por otra familia' };
    }
    return { ok: false, error: error.message || 'Error al guardar' };
  }

  // Refresh del listado y de las rutas públicas que dependen de esta data
  revalidatePath('/admin/bunker/familias');
  revalidatePath('/bunker-restaurant');
  revalidatePath('/bunker-restaurant/[slug]', 'page');

  return { ok: true };
}
