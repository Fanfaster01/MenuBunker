import { supabase } from '@/lib/supabaseClient';

const BASE_URL = 'https://menu-bunker.vercel.app';

/**
 * Sitemap dinámico — generado a partir de las views públicas de Supabase.
 *
 * Incluye:
 *   - Home, Bunker home, Victoriana home (priority alta)
 *   - Cada categoría visible de Bunker
 *   - Cada departamento visible de Victoriana
 *   - Cada grupo visible dentro de cada departamento
 *
 * Se regenera dinámicamente en cada request a /sitemap.xml. Si Supabase falla,
 * devolvemos al menos las rutas estáticas para no romper la indexación.
 */
export default async function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/bunker-restaurant`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/la-victoriana`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    // Cargamos categorías de Bunker y departamentos de Victoriana en paralelo.
    // Los grupos individuales de Victoriana NO se incluyen para mantener el
    // sitemap acotado; Google llegará a ellos crawleando los departamentos.
    const [bunkerCats, vicDepts] = await Promise.all([
      supabase.from('bunker_visible_categories').select('slug'),
      supabase.from('victoriana_visible_departments').select('slug'),
    ]);

    const bunkerRoutes = (bunkerCats.data ?? [])
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${BASE_URL}/bunker-restaurant/${c.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      }));

    const vicDeptRoutes = (vicDepts.data ?? [])
      .filter((d) => d.slug)
      .map((d) => ({
        url: `${BASE_URL}/la-victoriana/${d.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      }));

    return [...staticRoutes, ...bunkerRoutes, ...vicDeptRoutes];
  } catch (err) {
    console.error('[sitemap] Falló al cargar rutas dinámicas, devuelvo solo estáticas:', err);
    return staticRoutes;
  }
}
