import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BunkerLogo from './BunkerLogo';

export default function Header({ title }) {
  return (
    <header className="flex flex-col items-center mb-6">
      {/* Logo section */}
      <div className="mb-4 max-w-sm w-full">
        <BunkerLogo className="w-full h-auto text-[#8B7355]" width="300" height="120" />
      </div>
      
      {/* Navigation and title */}
      <div className="flex items-center justify-between w-full">
        <Link href="/bunker-restaurant" className="p-2 text-[#8B7355] hover:text-[#C8A882] transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-center text-[#C8A882]">{title}</h1>
        <div className="w-6" /> {/* Spacer for alignment */}
      </div>
    </header>
  );
}