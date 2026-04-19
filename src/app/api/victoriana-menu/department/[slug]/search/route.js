export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/victoriana-menu/department/[slug]/search?q=XXX&limit=50&offset=0
 * Busca productos dentro de un departamento.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    if (!q) return NextResponse.json({ items: [], pagination: { limit, offset, total: 0, has_more: false } });
    if (q.length < 2) return NextResponse.json({ error: 'Búsqueda debe tener al menos 2 caracteres' }, { status: 400 });

    // Resolver codigo del depto
    const { data: dept, error: deptErr } = await supabase
      .from('victoriana_visible_departments')
      .select('codigo, slug, name')
      .eq('slug', slug)
      .maybeSingle();
    if (deptErr) throw deptErr;
    if (!dept) return NextResponse.json({ error: `Departamento '${slug}' no encontrado` }, { status: 404 });

    const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
    const from = offset;
    const to = offset + limit - 1;

    const { data: products, error: prodErr, count } = await supabase
      .from('victoriana_product_cache')
      .select(`
        codigo, descri, descri_corta, marca, presentacion,
        precio, tax_rate, final_price, grupo_codigo,
        meta:victoriana_product_meta (description, image_url, override_name, is_featured, is_hidden)
      `, { count: 'exact' })
      .eq('departamento_codigo', dept.codigo)
      .ilike('descri', pattern)
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
        grupo_codigo: p.grupo_codigo,
        is_featured: p.meta?.is_featured === true,
      }));

    return NextResponse.json({
      department: dept,
      query: q,
      items,
      pagination: {
        limit, offset,
        total: count ?? null,
        has_more: count != null ? offset + items.length < count : items.length === limit,
      },
    });
  } catch (err) {
    console.error('[GET .../department/[slug]/search]', err.message || err);
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
  }
}
