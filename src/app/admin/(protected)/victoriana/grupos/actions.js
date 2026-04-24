'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Actualiza la metadata de un grupo Victoriana.
 * Upserts en victoriana_group_meta por codigo (PK).
 */
export async function updateGroupMeta(codigo, departamento_codigo, input) {
  const { supabase } = await requireAdmin();

  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }
  if (!departamento_codigo || typeof departamento_codigo !== 'string') {
    return { ok: false, error: 'departamento_codigo requerido (para satisfacer NOT NULL en meta)' };
  }

  const ALLOWED = ['display_name', 'description', 'slug', 'sort_order', 'is_visible_on_menu'];
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
  for (const key of ['display_name', 'description']) {
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
    .from('victoriana_group_meta')
    .upsert({ codigo, departamento_codigo, ...patch }, { onConflict: 'codigo' });

  if (error) {
    console.error('[updateGroupMeta]', error);
    if (error.code === '23505') {
      return { ok: false, error: 'Ese slug ya está en uso por otro grupo del mismo departamento' };
    }
    return { ok: false, error: error.message || 'Error al guardar' };
  }

  revalidatePath('/admin/victoriana/grupos');
  revalidatePath('/la-victoriana/[slug]', 'page');
  revalidatePath('/la-victoriana/[slug]/[groupSlug]', 'page');

  return { ok: true };
}
