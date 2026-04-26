'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.mjs';

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

/**
 * Borra DEFINITIVAMENTE un grupo del cache.
 *
 * Solo permitido si is_active=false. CASCADE borra su meta. Productos asociados
 * (victoriana_product_cache.grupo_codigo) quedan huérfanos pero no se borran;
 * dejan de aparecer en el menú público porque las views filtran por JOIN.
 *
 * PK compuesta (codigo, departamento_codigo).
 */
export async function deleteGroupPermanently(codigo, departamento_codigo) {
  await requireAdmin();

  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }
  if (!departamento_codigo || typeof departamento_codigo !== 'string') {
    return { ok: false, error: 'departamento_codigo requerido' };
  }

  const admin = getSupabaseAdmin();

  const { data: row, error: fetchErr } = await admin
    .from('victoriana_group_cache')
    .select('codigo, departamento_codigo, nombre, is_active')
    .eq('codigo', codigo)
    .eq('departamento_codigo', departamento_codigo)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!row) return { ok: false, error: 'Grupo no encontrado' };
  if (row.is_active !== false) {
    return {
      ok: false,
      error: 'Solo se pueden borrar definitivamente grupos marcados como «Eliminados del ERP».',
    };
  }

  const { error: delErr, count } = await admin
    .from('victoriana_group_cache')
    .delete({ count: 'exact' })
    .eq('codigo', codigo)
    .eq('departamento_codigo', departamento_codigo);

  if (delErr) return { ok: false, error: delErr.message };
  if (count === 0) {
    return { ok: false, error: 'No se borró ninguna fila (verifica permisos RLS).' };
  }

  revalidatePath('/admin/victoriana/grupos');
  revalidatePath('/admin/victoriana/items');
  revalidatePath('/la-victoriana');

  return { ok: true, deletedName: row.nombre };
}
