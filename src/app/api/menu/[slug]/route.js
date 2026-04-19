export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/menu/[slug]
 *
 * Resuelve slug → familia Xetux → items. Usa bunker_family_meta como source of truth
 * para slug, display_name, description, notice, visibilidad.
 */
export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
    }

    // 1) Lookup familia por slug
    const { data: meta, error: metaErr } = await supabase
      .from('bunker_family_meta')
      .select(`
        family_id,
        slug,
        display_name,
        description,
        notice,
        icon_url,
        is_visible_on_menu,
        sort_order,
        bunker_family_cache:family_id (
          family_name,
          family_status_id
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (metaErr) {
      console.error(`[GET /api/menu/${slug}] meta error:`, metaErr.message);
      return NextResponse.json({ error: 'Error al obtener la categoría' }, { status: 500 });
    }

    if (!meta || !meta.is_visible_on_menu || meta.bunker_family_cache?.family_status_id !== 1) {
      return NextResponse.json({ error: `Categoría '${slug}' no encontrada` }, { status: 404 });
    }

    const category = {
      id: meta.family_id,
      slug: meta.slug,
      name: meta.display_name || meta.bunker_family_cache?.family_name || meta.slug,
      description: meta.description ?? null,
      notice: meta.notice ?? null,
      icon_url: meta.icon_url ?? null,
      sort_order: meta.sort_order ?? 0,
    };

    // 2) Fetch items de esa familia
    const { data: items, error: itemsErr } = await supabase
      .from('bunker_item_cache')
      .select(`
        xetux_item_id,
        xetux_product_id,
        item_name,
        ecommerce_name,
        item_description,
        tax_id,
        default_family_id,
        sale_price_1,
        final_price,
        product_position,
        meta:bunker_item_meta (
          description,
          image_url,
          override_name,
          is_featured,
          is_hidden,
          sort_order
        )
      `)
      .eq('default_family_id', meta.family_id);

    if (itemsErr) {
      console.error(`[GET /api/menu/${slug}] items error:`, itemsErr.message);
      return NextResponse.json({ error: 'Error al obtener los items' }, { status: 500 });
    }

    const shaped = (items ?? [])
      .filter((it) => !(it.meta?.is_hidden === true))
      .map((it) => ({
        xetux_item_id: it.xetux_item_id,
        name: it.meta?.override_name || it.item_name,
        description: it.meta?.description || it.item_description || null,
        image_url: it.meta?.image_url || null,
        final_price: it.final_price != null ? Number(it.final_price) : null,
        tax_id: it.tax_id,
        family_id: it.default_family_id,
        is_featured: it.meta?.is_featured === true,
      }))
      // Orden alfabético en español
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    return NextResponse.json(
      { category, items: shaped },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET /api/menu/[slug]] unexpected:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
