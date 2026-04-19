import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/victoriana-menu/department/[slug]
 * Devuelve un departamento + sus grupos visibles con conteos.
 */
export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });

    const { data: dept, error: deptErr } = await supabase
      .from('victoriana_visible_departments')
      .select('codigo, slug, name, description, notice, icon_url, product_count, group_count')
      .eq('slug', slug)
      .maybeSingle();

    if (deptErr) {
      console.error('[GET /api/victoriana-menu/department/[slug]]', deptErr.message);
      return NextResponse.json({ error: 'Error al obtener departamento' }, { status: 500 });
    }

    if (!dept) {
      return NextResponse.json({ error: `Departamento '${slug}' no encontrado` }, { status: 404 });
    }

    const { data: groups, error: groupsErr } = await supabase
      .from('victoriana_visible_groups')
      .select('codigo, slug, name, description, product_count')
      .eq('departamento_codigo', dept.codigo);

    if (groupsErr) {
      console.error('[GET .../department/[slug] groups]', groupsErr.message);
      return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
    }

    return NextResponse.json(
      { department: dept, groups: groups ?? [] },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET .../department/[slug]] unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
