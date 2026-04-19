import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function VictorianaHeader({ title, backHref = '/la-victoriana' }) {
  return (
    <header className="flex flex-col items-center mb-8">
      <div className="mb-5 max-w-xs w-full">
        <Image
          src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
          alt="La Victoriana"
          width={280}
          height={280}
          className="mx-auto"
          priority
        />
      </div>

      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <Link
          href={backHref}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-900 border border-[#C8A882]/50 text-[#C8A882] hover:bg-[#C8302E] hover:text-white hover:border-[#C8302E] hover:scale-105 transition-all duration-200 shadow-md"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <h1 className="text-xl md:text-3xl font-bold text-center text-[#C8A882] tracking-wide uppercase">
          {title}
        </h1>

        <div className="w-11 h-11" />
      </div>
    </header>
  );
}
