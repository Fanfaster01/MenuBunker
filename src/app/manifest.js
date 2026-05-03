/**
 * Web App Manifest — permite a los clientes "instalar" el menú como app
 * en su home screen (iOS/Android/desktop). Cero costo, cero JS extra.
 *
 * Para mejor experiencia, conviene subir íconos PNG cuadrados a /public/icons/
 * (192x192 y 512x512). Por ahora apuntamos al favicon que ya existe.
 */
export default function manifest() {
  return {
    name: 'Búnker + La Victoriana',
    short_name: 'Búnker',
    description: 'Menú digital de Bunker Restaurant y La Victoriana Bodegón',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#C8302E',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
}
