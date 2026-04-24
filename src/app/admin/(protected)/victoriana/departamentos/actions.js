'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Actualiza la metadata de un departamento Victoriana.
 *
 * Upserts en victoriana_department_meta por codigo (PK).
 * Solo el admin (verificado por requireAdmin + RLS is_admin()) puede escribir.
 *
 * @param {string} codigo
 * @param {object} input  Campos editables.
 */
export async function updateDepartmentMeta(codigo, input) {
  const { supabase } = await requireAdmin();

  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }

  const ALLOWED = ['display_name', 'description', 'notice', 'slug', 'sort_order', 'is_visible_on_menu', 'icon_url'];
  const patch = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      patch[key] = input[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Sin cambios para aplicar' };
  }

  // Normalizar strings vacíos a null
  for (const key of ['display_name', 'description', 'notice', 'icon_url']) {
    if (patch[key] !== undefined && typeof patch[key] === 'string' && patch[key].trim() === '') {
      patch[key] = null;
    }
  }

  // Validar slug
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

  const { error } = await supabase
    .from('victoriana_department_meta')
    .upsert({ codigo, ...patch }, { onConflict: 'codigo' });

  if (error) {
    console.error('[updateDepartmentMeta]', error);
    if (error.code === '23505') {
      return { ok: false, error: 'Ese slug ya está en uso por otro departamento' };
    }
    return { ok: false, error: error.message || 'Error al guardar' };
  }

  revalidatePath('/admin/victoriana/departamentos');
  revalidatePath('/la-victoriana');
  revalidatePath('/la-victoriana/[slug]', 'page');

  return { ok: true };
}
