"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import VictorianaFooter from '@/components/common/VictorianaFooter';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { DepartmentGridSkeleton } from './skeletons';

export default function DepartmentsHome() {
  const [state, setState] = useState({ status: 'loading', departments: [], error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/victoriana-menu/departments');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setState({ status: 'ok', departments: data.departments || [], error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', departments: [], error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-black to-[#0c0c0c] text-white p-4">
      <div className="max-w-sm mx-auto mb-8 pt-4">
        <Image
          src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
          alt="La Victoriana"
          width={300}
          height={300}
          className="mx-auto"
          priority
        />
      </div>

      <div className="flex justify-center mb-10">
        <Link
          href="/"
          className="group relative bg-gradient-to-r from-[#C8302E] to-[#A02624] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Volver al Inicio
          </span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#C8A882] mb-2">Nuestros Departamentos</h2>
        <p className="text-sm text-gray-400">Explora por categoría</p>
      </div>

      {state.status === 'loading' && <DepartmentGridSkeleton count={9} />}

      {state.status === 'error' && (
        <div className="max-w-2xl mx-auto">
          <ErrorDisplay error={state.error} />
        </div>
      )}

      {state.status === 'ok' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {state.departments.map((dept, idx) => (
            <Link
              href={`/la-victoriana/${dept.slug}`}
              key={dept.slug}
              style={{ animationDelay: `${idx * 30}ms` }}
              className="fade-in-up group relative overflow-hidden bg-gray-900 rounded-2xl p-6 border border-[#C8A882]/50 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#C8302E] transition-all duration-300 flex flex-col justify-center min-h-32"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C8302E]/0 via-[#C8302E]/0 to-[#C8302E]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg md:text-xl text-white group-hover:text-[#C8A882] transition-colors uppercase tracking-wide">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-[#C8A882] mt-1">
                    {dept.group_count} {dept.group_count === 1 ? 'grupo' : 'grupos'} · {dept.product_count} productos
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-[#C8A882] group-hover:text-[#C8302E] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <VictorianaFooter />
    </main>
  );
}
