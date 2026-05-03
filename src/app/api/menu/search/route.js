export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 80;

/**
 * GET /api/menu/search?q=XXX&limit=40&offset=0
 *
 * Búsqueda global de items en TODO el menú de Bunker. Match contra item_name
 * + ecommerce_name. Devuelve cada hit con su categoría (slug + name) para que
 * el cliente pueda construir el link al detalle de la categoría.
 *
 * Implementación: dos queries en cascada porque PostgREST no infiere FK entre
 * bunker_item_cache.default_family_id y bunker_family_meta.family_id (ambas
 * apuntan a bunker_family_cache.family_id pero no hay FK directa).
 *
 *   1. Buscar items por nombre (con embed de su meta).
 *   2. Cargar metadata + cache de las familias involucradas.
 *   3. JS-side: filtrar por visibilidad y armar la respuesta.
 *
 * Filtros aplicados:
 *   - item.is_active = true
 *   - item.meta.is_hidden != true
 *   - familia.is_visible_on_menu = true
 *   - familia.cache.is_active = true
 *   - familia.cache.family_status_id = 1
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    if (!q) {
      return NextResponse.json({ items: [], pagination: { limit, offset, total: 0, has_more: false } });
    }
    if (q.length < 2) {
      return NextResponse.json({ error: 'Búsqueda debe tener al menos 2 caracteres' }, { status: 400 });
    }

    const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
    const from = offset;
    const to = offset + limit - 1;

    // 1) Buscar items por nombre — embed solo bunker_item_meta (sí tiene FK directa)
    const { data: rows, error: itemsErr, count } = await supabase
      .from('bunker_item_cache')
      .select(
        `
        xetux_item_id,
        item_name,
        ecommerce_name,
        item_description,
        final_price,
        default_family_id,
        meta:bunker_item_meta (
          description,
          image_url,
          override_name,
          is_featured,
          is_hidden
        )
      `,
        { count: 'exact' }
      )
      .or(`item_name.ilike.${pattern},ecommerce_name.ilike.${pattern}`)
      .eq('is_active', true)
      .order('item_name', { ascending: true })
      .range(from, to);

    if (itemsErr) {
      console.error('[GET /api/menu/search] items', itemsErr.message);
      return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
    }

    // 2) Recolectar familias necesarias y cargar su meta + cache
    const familyIds = Array.from(
      new Set((rows ?? []).map((r) => r.default_family_id).filter((id) => id != null))
    );

    let familyMap = new Map();
    if (familyIds.length > 0) {
      const { data: families, error: famErr } = await supabase
        .from('bunker_family_meta')
        .select(
          `
          family_id,
          slug,
          display_name,
          is_visible_on_menu,
          bunker_family_cache:family_id (
            family_name,
            family_status_id,
            is_active
          )
        `
        )
        .in('family_id', familyIds);

      if (famErr) {
        console.error('[GET /api/menu/search] families', famErr.message);
        return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
      }

      for (const f of families ?? []) {
        familyMap.set(f.family_id, f);
      }
    }

    // 3) Filtrar y mapear
    const items = (rows ?? [])
      .filter((r) => {
        if (r.meta?.is_hidden === true) return false;
        const fam = familyMap.get(r.default_family_id);
        if (!fam) return false;
        if (fam.is_visible_on_menu !== true) return false;
        const cache = fam.bunker_family_cache;
        if (!cache) return false;
        if (cache.family_status_id !== 1) return false;
        if (cache.is_active === false) return false;
        return true;
      })
      .map((r) => {
        const fam = familyMap.get(r.default_family_id);
        return {
          xetux_item_id: r.xetux_item_id,
          name: r.meta?.override_name || r.item_name,
          description: r.meta?.description || r.item_description || null,
          image_url: r.meta?.image_url || null,
          final_price: r.final_price != null ? Number(r.final_price) : null,
          is_featured: r.meta?.is_featured === true,
          category: {
            slug: fam.slug,
            name: fam.display_name || fam.bunker_family_cache?.family_name || fam.slug,
          },
        };
      });

    return NextResponse.json({
      query: q,
      items,
      pagination: {
        limit,
        offset,
        // total cuenta los items visibles post-filter (lo que el usuario ve)
        // raw_total es el match en cache antes de filtrar visibilidad (debug)
        total: items.length,
        raw_total: count ?? null,
        has_more: count != null ? offset + items.length < count : items.length === limit,
      },
    });
  } catch (err) {
    console.error('[GET /api/menu/search] unexpected:', err.message || err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
