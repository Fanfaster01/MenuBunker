'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.mjs';

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

/**
 * Borra DEFINITIVAMENTE un departamento del cache.
 *
 * ⚠️ IMPORTANTE: el FK victoriana_group_cache.departamento_codigo CASCADEa,
 * así que borrar un dept también borra TODOS sus grupos (y el meta de cada uno).
 * Los productos quedan huérfanos (no FK), pero como las views públicas filtran
 * por la cadena dept→grupo→producto via JOIN, dejan de mostrarse automáticamente.
 *
 * Solo permitido si is_active=false.
 */
export async function deleteDepartmentPermanently(codigo) {
  await requireAdmin();

  if (!codigo || typeof codigo !== 'string') {
    return { ok: false, error: 'codigo inválido' };
  }

  const admin = getSupabaseAdmin();

  const { data: row, error: fetchErr } = await admin
    .from('victoriana_department_cache')
    .select('codigo, nombre, is_active')
    .eq('codigo', codigo)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!row) return { ok: false, error: 'Departamento no encontrado' };
  if (row.is_active !== false) {
    return {
      ok: false,
      error: 'Solo se pueden borrar definitivamente departamentos marcados como «Eliminados del ERP».',
    };
  }

  const { error: delErr, count } = await admin
    .from('victoriana_department_cache')
    .delete({ count: 'exact' })
    .eq('codigo', codigo);

  if (delErr) return { ok: false, error: delErr.message };
  if (count === 0) {
    return { ok: false, error: 'No se borró ninguna fila (verifica permisos RLS).' };
  }

  revalidatePath('/admin/victoriana/departamentos');
  revalidatePath('/admin/victoriana/grupos');
  revalidatePath('/admin/victoriana/items');
  revalidatePath('/la-victoriana');

  return { ok: true, deletedName: row.nombre };
}
