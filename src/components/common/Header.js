import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Header({ title }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <Link href="/" className="p-2">
        <ArrowLeft className="w-6 h-6" />
      </Link>
      <h1 className="text-2xl font-bold text-center">{title}</h1>
      <div className="w-6" /> {/* Spacer for alignment */}
    </header>
  );
}