import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/victoriana-menu/departments
 * Lista de departamentos visibles con productos.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('victoriana_visible_departments')
      .select('codigo, slug, name, description, icon_url, product_count, group_count');

    if (error) {
      console.error('[GET /api/victoriana-menu/departments]', error.message);
      return NextResponse.json({ error: 'Error al obtener departamentos' }, { status: 500 });
    }

    return NextResponse.json(
      { departments: data ?? [] },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET /api/victoriana-menu/departments] unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
