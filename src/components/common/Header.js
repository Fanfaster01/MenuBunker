import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BunkerLogo from './BunkerLogo';

export default function Header({ title, backHref = '/bunker-restaurant' }) {
  return (
    <header className="flex flex-col items-center mb-8">
      {/* Logo */}
      <div className="mb-6 max-w-xs w-full">
        <BunkerLogo className="w-full h-auto text-[#8B7355]" width="280" height="110" />
      </div>

      {/* Navigation and title */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <Link
          href={backHref}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#C8A882]/50 text-[#8B7355] hover:bg-[#C8A882]/10 hover:border-[#8B7355] hover:scale-105 transition-all duration-200 shadow-xs"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <h1 className="text-xl md:text-3xl font-bold text-center text-[#8B7355] tracking-wide uppercase">
          {title}
        </h1>

        <div className="w-11 h-11" />
      </div>
    </header>
  );
}
