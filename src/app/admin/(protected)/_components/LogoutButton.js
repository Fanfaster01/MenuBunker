'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-[#8B7355] transition-colors disabled:opacity-50"
      aria-label="Cerrar sesión"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Salir</span>
    </button>
  );
}
