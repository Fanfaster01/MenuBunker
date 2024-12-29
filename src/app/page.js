import Link from 'next/link';
import BunkerLogo from '@/components/common/BunkerLogo';
import Footer from '@/components/common/Footer';

export default function Home() {
  const sections = [
    { name: 'DESAYUNOS', path: '/desayunos' },
    { name: 'ENTRADAS', path: '/entradas' },
    { name: 'PRINCIPALES', path: '/principales' },
    { name: 'CORTES AL CARBÓN', path: '/cortes' },
    { name: 'HAMBURGUESAS', path: '/hamburguesas' },
    { name: 'ENSALADAS', path: '/ensaladas' },
    { name: 'MENÚ INFANTIL', path: '/menu-infantil' }
  ];

  return (
    <main className="min-h-screen bg-gray-100 text-black p-4">
      <div className="max-w-sm mx-auto mb-12">
        <BunkerLogo className="w-full h-auto text-black" width="300" height="120" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {sections.map((section) => (
          <Link 
            href={section.path} 
            key={section.path}
            className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200 flex items-center justify-center text-center h-32 text-black"
          >
            <span className="font-bold text-lg">{section.name}</span>
          </Link>
        ))}
      </div>
      <Footer />
    </main>
  );
}