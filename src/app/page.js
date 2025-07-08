import Link from 'next/link';
import Image from 'next/image';
import BunkerLogo from '@/components/common/BunkerLogo';

export default function Home() {
  const mainSections = [
    { 
      name: 'BÚNKER RESTAURANT', 
      path: '/bunker-restaurant',
      description: 'Consulta nuestro menú completo',
      logo: 'bunker'
    },
    { 
      name: 'BODEGÓN LA VICTORIANA', 
      path: '/la-victoriana',
      description: 'Tu supermercado de confianza',
      logo: 'victoriana'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-black p-4">
      {/* Header Section */}
      <div className="text-center mb-12 pt-8">
        <div className="mb-6">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#C8A882] to-[#8B7355] bg-clip-text text-transparent mb-4">
          
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#C8A882] to-[#8B7355] mx-auto rounded-full"></div>
        </div>
        <p className="text-xl text-gray-700 font-medium">Descubre los productos y opciones gastronómicas que tenemos para tí</p>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-16">
        {mainSections.map((section) => (
          <Link 
            href={section.path} 
            key={section.path}
            className={section.logo === 'victoriana' ? 
              "relative bg-gradient-to-br from-black to-gray-900 shadow-2xl rounded-2xl p-10 border-2 border-[#C8A882] hover:shadow-3xl hover:border-[#C8302E] hover:-translate-y-2 transition-all duration-500 text-center group overflow-hidden" :
              "relative bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl p-10 border-2 border-[#C8A882] hover:shadow-3xl hover:border-[#8B7355] hover:-translate-y-2 transition-all duration-500 text-center text-black group overflow-hidden"
            }
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8A882]/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#8B7355]/20 to-transparent rounded-full -ml-12 -mb-12"></div>
            
            {/* Logo Container */}
            {section.logo === 'bunker' ? (
              <div className="relative flex items-center justify-center h-40 mb-6 group-hover:scale-110 transition-transform duration-500">
                <BunkerLogo className="w-auto h-full max-h-32 text-[#8B7355]" width="200" height="80" />
              </div>
            ) : (
              <div className="relative group-hover:scale-105 transition-transform duration-500 flex-1 flex items-center justify-center">
                <Image 
                  src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
                  alt="La Victoriana Logo"
                  width={400}
                  height={400}
                  className="h-auto max-w-full filter drop-shadow-lg"
                />
              </div>
            )}
            
            {/* Content */}
            <div className="relative z-10">
              {section.logo !== 'victoriana' && (
                <>
                  <h2 className="text-2xl font-bold mb-3 text-[#8B7355]">
                    {section.name}
                  </h2>
                  <p className="text-lg text-gray-600 group-hover:text-[#8B7355] transition-colors duration-300">
                    {section.description}
                  </p>
                </>
              )}
              
              {/* Call to action */}
              <div className={section.logo === 'victoriana' ? 'mt-12' : 'mt-6'}>
                <span className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold ${
                  section.logo === 'victoriana' 
                    ? 'bg-[#C8A882] text-black group-hover:bg-[#C8302E] group-hover:text-white' 
                    : 'bg-[#C8A882] text-white group-hover:bg-[#8B7355]'
                } transition-all duration-300 shadow-lg`}>
                  Ver precios →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center py-8">
        <div className="w-16 h-1 bg-gradient-to-r from-[#C8A882] to-[#8B7355] mx-auto rounded-full mb-4"></div>
        <p className="text-gray-600 font-medium">&copy; 2025 Lista de Precios. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}