"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import VictorianaHeader from './VictorianaHeader';
import VictorianaFooter from '@/components/common/VictorianaFooter';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import DepartmentSearch from './DepartmentSearch';
import { DepartmentGridSkeleton } from './skeletons';

/**
 * Vista de un departamento: grid de grupos + barra de búsqueda global del dept.
 */
export default function DepartmentView({ slug }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/victoriana-menu/department/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setState({ status: 'ok', data, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', data: null, error: err.message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const title = state.data?.department?.name?.toUpperCase() || slug.replace(/-/g, ' ').toUpperCase();

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#0c0c0c] text-white p-4">
        <VictorianaHeader title={title} backHref="/la-victoriana" />
        <DepartmentGridSkeleton count={6} />
        <VictorianaFooter />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <VictorianaHeader title={title} backHref="/la-victoriana" />
        <ErrorDisplay error={state.error} />
        <VictorianaFooter />
      </div>
    );
  }

  const { department, groups } = state.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#0c0c0c] text-white p-4">
      <VictorianaHeader title={department.name.toUpperCase()} backHref="/la-victoriana" />

      {department.notice && (
        <div className="max-w-4xl mx-auto mb-6 flex gap-3 p-4 bg-gradient-to-r from-[#1a1a1a] to-[#0c0c0c] border-l-4 border-[#C8302E] rounded-r-lg shadow-md">
          <Info className="w-5 h-5 text-[#C8302E] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold text-[#C8A882]">Importante:</span> {department.notice}
          </p>
        </div>
      )}

      <DepartmentSearch deptSlug={department.slug} deptName={department.name}>
        <div className="max-w-6xl mx-auto mb-5 flex justify-end items-center">
          <span className="text-xs text-[#C8A882] font-medium">
            {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} · {department.product_count} productos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {groups.map((g, idx) => (
            <Link
              href={`/la-victoriana/${department.slug}/${g.slug}`}
              key={g.slug}
              style={{ animationDelay: `${idx * 25}ms` }}
              className="fade-in-up group relative overflow-hidden bg-gray-900 rounded-2xl p-5 border border-[#C8A882]/40 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#C8302E] transition-all duration-300 flex items-center justify-between gap-3 min-h-24"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C8302E]/0 via-[#C8302E]/0 to-[#C8302E]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex-1 text-left">
                <h3 className="font-bold text-base md:text-lg text-white group-hover:text-[#C8A882] transition-colors uppercase tracking-wide">
                  {g.name}
                </h3>
                <p className="text-xs text-[#C8A882] mt-0.5">
                  {g.product_count} {g.product_count === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <ChevronRight className="relative w-5 h-5 text-[#C8A882] group-hover:text-[#C8302E] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </DepartmentSearch>

      <VictorianaFooter />
    </div>
  );
}
