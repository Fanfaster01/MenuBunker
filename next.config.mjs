/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb', // permitir imágenes comprimidas al subir via Server Action
    },
  },
  images: {
    // Permite cargar imágenes servidas desde Supabase Storage con <Image> optimizado.
    // El hostname se extrae de NEXT_PUBLIC_SUPABASE_URL en runtime vía env var.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    // Redirigir rutas viejas hardcoded del Bunker al menú dinámico nuevo.
    // Preserva bookmarks y enlaces externos existentes.
    return [
      { source: '/desayunos',     destination: '/bunker-restaurant/desayunos',     permanent: true },
      { source: '/entradas',      destination: '/bunker-restaurant/entradas',      permanent: true },
      { source: '/principales',   destination: '/bunker-restaurant/principales',   permanent: true },
      { source: '/cortes',        destination: '/bunker-restaurant/cortes-al-carbon', permanent: true },
      { source: '/hamburguesas',  destination: '/bunker-restaurant/hamburguesas',  permanent: true },
      { source: '/ensaladas',     destination: '/bunker-restaurant/ensaladas',     permanent: true },
      // /bebidas antes agrupaba 8 sub-familias; ahora cada sub-familia tiene su propia página,
      // así que redirigimos al home del bunker para que el cliente elija.
      { source: '/bebidas',       destination: '/bunker-restaurant',                permanent: false },
      { source: '/menu-infantil', destination: '/bunker-restaurant/menu-infantil', permanent: true },
    ];
  },
};

export default nextConfig;
