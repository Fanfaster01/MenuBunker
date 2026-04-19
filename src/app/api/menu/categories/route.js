import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/menu/categories
 *
 * Devuelve las categorías agrupadas por su familia padre en Xetux (tabs).
 * Las categorías sin padre válido se agrupan bajo "OTROS".
 *
 * Response shape:
 * {
 *   tabs: [
 *     {
 *       id: 1061,
 *       key: "menu",
 *       name: "MENÚ",
 *       categories: [
 *         { id, slug, name, description, icon_url, item_count }, ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bunker_visible_categories')
      .select('id, slug, name, description, icon_url, sort_order, item_count, parent_id, parent_name');

    if (error) {
      console.error('[GET /api/menu/categories] Supabase error:', error.message);
      return NextResponse.json({ error: 'Error al obtener las categorías' }, { status: 500 });
    }

    // Agrupar por tab (parent). null/RAIZ → "OTROS"
    const tabMap = new Map();
    for (const row of data ?? []) {
      const hasValidParent = row.parent_id && row.parent_name && row.parent_name !== 'RAIZ';
      const tabKey = hasValidParent ? String(row.parent_id) : 'otros';
      const tabName = hasValidParent ? row.parent_name : 'OTROS';

      if (!tabMap.has(tabKey)) {
        tabMap.set(tabKey, {
          id: hasValidParent ? row.parent_id : null,
          key: tabKey,
          name: tabName,
          categories: [],
        });
      }
      tabMap.get(tabKey).categories.push({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        icon_url: row.icon_url,
        item_count: row.item_count,
      });
    }

    // Orden de tabs (determinístico): MENU → BEBIDAS → BEBIDAS ALCOHOLICAS → OTROS → resto alfabético
    const priority = { 'MENU': 1, 'BEBIDAS': 2, 'BEBIDAS ALCOHOLICAS': 3, 'OTROS': 99 };
    const tabs = Array.from(tabMap.values()).sort((a, b) => {
      const pa = priority[a.name] ?? 50;
      const pb = priority[b.name] ?? 50;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, 'es');
    });

    // Garantizar orden alfabético dentro de cada tab (el view ya lo hace, esto es redundancia segura)
    for (const tab of tabs) {
      tab.categories.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    }

    return NextResponse.json(
      { tabs },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[GET /api/menu/categories] unexpected:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
