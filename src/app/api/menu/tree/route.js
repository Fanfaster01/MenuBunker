import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/menu/tree
 *
 * Devuelve la jerarquía del menú: top-level (padres con hijos + categorías huérfanas directas).
 *
 * Response:
 * {
 *   top_level: [
 *     {
 *       slug, name, item_count,
 *       is_direct: bool,     // true = categoría huérfana (sin hijos, link va directo a productos)
 *       children: [ {slug, name, item_count}, ... ]  // vacío si is_direct
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  try {
    // 1) Todas las categorías visibles con info de padre
    const { data: categories, error: catErr } = await supabase
      .from('bunker_visible_categories')
      .select('id, slug, name, description, icon_url, item_count, parent_id, parent_name');

    if (catErr) {
      console.error('[GET /api/menu/tree] categories error:', catErr.message);
      return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
    }

    // 2) Resolver info de los padres reales (para slug y display_name)
    const parentIds = [...new Set((categories ?? []).map((c) => c.parent_id).filter(Boolean))];
    let parentInfoMap = new Map();
    if (parentIds.length > 0) {
      const [{ data: parentMeta }, { data: parentCache }] = await Promise.all([
        supabase.from('bunker_family_meta').select('family_id, slug, display_name').in('family_id', parentIds),
        supabase.from('bunker_family_cache').select('family_id, family_name').in('family_id', parentIds),
      ]);
      const nameMap = new Map((parentCache ?? []).map((p) => [p.family_id, p.family_name]));
      parentInfoMap = new Map(
        (parentMeta ?? []).map((m) => [
          m.family_id,
          { slug: m.slug, name: m.display_name || nameMap.get(m.family_id) || `familia-${m.family_id}` },
        ])
      );
    }

    // 3) Construir top_level: padres agrupan hijos; huérfanos van directo al primer nivel
    const topLevelMap = new Map();

    for (const row of categories ?? []) {
      const hasValidParent = row.parent_id && row.parent_name && row.parent_name !== 'RAIZ';
      const parentInfo = hasValidParent ? parentInfoMap.get(row.parent_id) : null;

      if (hasValidParent && parentInfo) {
        // Es hijo de un padre real: agregarlo al padre
        const key = `parent:${row.parent_id}`;
        if (!topLevelMap.has(key)) {
          topLevelMap.set(key, {
            slug: parentInfo.slug,
            name: parentInfo.name,
            children: [],
            item_count: 0,
            is_direct: false,
          });
        }
        const parent = topLevelMap.get(key);
        parent.children.push({
          slug: row.slug,
          name: row.name,
          description: row.description,
          icon_url: row.icon_url,
          item_count: row.item_count,
        });
        parent.item_count += row.item_count;
      } else {
        // Huérfana: va directo al top-level como "is_direct"
        const key = `direct:${row.slug}`;
        topLevelMap.set(key, {
          slug: row.slug,
          name: row.name,
          description: row.description,
          icon_url: row.icon_url,
          children: [],
          item_count: row.item_count,
          is_direct: true,
        });
      }
    }

    // 4) Orden: MENÚ → BEBIDAS → BEBIDAS ALCOHÓLICAS → huérfanas/resto alfabético
    const priority = { menu: 1, bebidas: 2, 'bebidas-alcoholicas': 3 };
    const topLevel = Array.from(topLevelMap.values()).sort((a, b) => {
      const pa = priority[a.slug] ?? 50;
      const pb = priority[b.slug] ?? 50;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    // 5) Orden alfabético dentro de cada padre
    for (const item of topLevel) {
      item.children.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    }

    return NextResponse.json(
      { top_level: topLevel },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET /api/menu/tree] unexpected:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
