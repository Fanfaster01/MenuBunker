import Link from 'next/link';
import BunkerLogo from '@/components/common/BunkerLogo';
import Footer from '@/components/common/Footer';

export default function BunkerRestaurant() {
  const sections = [
    { name: 'DESAYUNOS', path: '/desayunos' },
    { name: 'ENTRADAS', path: '/entradas' },
    { name: 'PRINCIPALES', path: '/principales' },
    { name: 'CORTES AL CARBÓN', path: '/cortes' },
    { name: 'HAMBURGUESAS', path: '/hamburguesas' },
    { name: 'ENSALADAS', path: '/ensaladas' },
    { name: 'BEBIDAS', path: '/bebidas' },
    { name: 'MENÚ INFANTIL', path: '/menu-infantil' }
  ];

  return (
    <main className="min-h-screen bg-white text-black p-4">
      <div className="max-w-sm mx-auto mb-8">
        <BunkerLogo className="w-full h-auto text-[#C8A882]" width="300" height="120" />
      </div>

      <div className="flex justify-center mb-6">
        <Link 
          href="/"
          className="group relative bg-gradient-to-r from-[#8B7355] to-[#6B5A45] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Volver al Inicio
          </span>
          <div className="absolute inset-0 rounded-full bg-[#C8A882] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {sections.map((section) => (
          <Link 
            href={section.path} 
            key={section.path}
            className="bg-white shadow-lg rounded-lg p-6 border-2 border-[#C8A882] hover:shadow-xl hover:border-[#8B7355] transition-all duration-200 flex items-center justify-center text-center h-32 text-black group"
          >
            <span className="font-bold text-xl text-[#8B7355] group-hover:text-[#C8A882] transition-colors">{section.name}</span>
          </Link>
        ))}
      </div>
      
      <Footer />
    </main>
  );
}