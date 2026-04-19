import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * GET /api/victoriana-menu/department/[slug]/[groupSlug]?limit=50&offset=0
 * Devuelve un grupo y sus productos (paginados, orden alfabético).
 */
export async function GET(request, { params }) {
  try {
    const { slug, groupSlug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    // 1) Dept + group
    const { data: dept, error: deptErr } = await supabase
      .from('victoriana_visible_departments')
      .select('codigo, slug, name, notice')
      .eq('slug', slug)
      .maybeSingle();
    if (deptErr) throw deptErr;
    if (!dept) return NextResponse.json({ error: `Departamento '${slug}' no encontrado` }, { status: 404 });

    const { data: group, error: groupErr } = await supabase
      .from('victoriana_visible_groups')
      .select('codigo, slug, name, description, product_count')
      .eq('departamento_codigo', dept.codigo)
      .eq('slug', groupSlug)
      .maybeSingle();
    if (groupErr) throw groupErr;
    if (!group) return NextResponse.json({ error: `Grupo '${groupSlug}' no encontrado` }, { status: 404 });

    // 2) Products
    const from = offset;
    const to = offset + limit - 1;
    const { data: products, error: prodErr, count } = await supabase
      .from('victoriana_product_cache')
      .select(`
        codigo, descri, descri_corta, marca, presentacion,
        precio, tax_rate, final_price,
        meta:victoriana_product_meta (description, image_url, override_name, is_featured, is_hidden, sort_order)
      `, { count: 'exact' })
      .eq('departamento_codigo', dept.codigo)
      .eq('grupo_codigo', group.codigo)
      .order('descri', { ascending: true })
      .range(from, to);

    if (prodErr) throw prodErr;

    const items = (products ?? [])
      .filter((p) => !(p.meta?.is_hidden === true))
      .map((p) => ({
        codigo: p.codigo,
        name: p.meta?.override_name || p.descri,
        description: p.meta?.description || p.descri_corta || null,
        image_url: p.meta?.image_url || null,
        marca: p.marca || null,
        presentacion: p.presentacion || null,
        final_price: p.final_price != null ? Number(p.final_price) : null,
        tax_rate: p.tax_rate != null ? Number(p.tax_rate) : 0,
        is_featured: p.meta?.is_featured === true,
      }));

    return NextResponse.json(
      {
        department: dept,
        group,
        items,
        pagination: {
          limit,
          offset,
          total: count ?? null,
          has_more: count != null ? offset + items.length < count : items.length === limit,
        },
      },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET .../department/[slug]/[groupSlug]]', err.message || err);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
