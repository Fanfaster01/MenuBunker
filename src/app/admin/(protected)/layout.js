import Link from 'next/link';
import { requireAdmin } from '@/lib/adminAuth';
import BunkerLogo from '@/components/common/BunkerLogo';
import LogoutButton from './_components/LogoutButton';

/**
 * Layout para rutas protegidas de /admin.
 *
 * Aplica a TODO lo que esté dentro de src/app/admin/(protected)/.
 * /admin/login y /admin/auth/callback quedan FUERA del grupo → no usan este layout.
 *
 * Corre requireAdmin() en cada render: si no hay sesión o el usuario no está
 * en admin_whitelist, redirige a /admin/login.
 */
export default async function AdminProtectedLayout({ children }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#C8A882]/40 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <BunkerLogo className="text-[#8B7355]" width="120" height="48" />
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#C8A882]/20 text-[#8B7355] text-xs font-semibold uppercase tracking-wide">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-gray-500">{user.email}</span>
            <LogoutButton />
          </div>
        </div>

        {/* Secondary nav */}
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          <NavLink href="/admin" label="Inicio" />
          <NavLink href="/admin/bunker/familias" label="Bunker · Familias" />
          <NavLink href="/admin/bunker/items" label="Bunker · Items" />
          <NavLink href="/admin/victoriana/departamentos" label="Victoriana · Deptos" />
          <NavLink href="/admin/victoriana/grupos" label="Victoriana · Grupos" />
          <NavLink href="/admin/victoriana/items" label="Victoriana · Items" />
          <NavLink href="/admin/sync" label="Sync" />
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#8B7355] hover:bg-[#C8A882]/15 hover:text-[#6B5A45] transition-colors whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
