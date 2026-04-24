'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import BunkerLogo from '@/components/common/BunkerLogo';

const ERROR_MESSAGES = {
  unauthorized: 'Este email no está autorizado para acceder al panel.',
  expired: 'El link expiró. Solicita uno nuevo.',
  invalid: 'El link no es válido. Intenta de nuevo.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState(
    errorCode ? ERROR_MESSAGES[errorCode] || 'Ocurrió un error.' : ''
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    // 1. Pre-check: ¿email está en la whitelist?
    try {
      const resp = await fetch('/api/admin/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const { allowed } = await resp.json();
      if (!allowed) {
        setStatus('error');
        setErrorMsg('Este email no está autorizado.');
        return;
      }
    } catch {
      setStatus('error');
      setErrorMsg('No se pudo verificar el email. Intenta de nuevo.');
      return;
    }

    // 2. Enviar magic link
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'No se pudo enviar el link. Intenta de nuevo.');
      return;
    }

    setStatus('sent');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <BunkerLogo className="text-[#8B7355]" width="240" height="96" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#C8A882]/30 p-8">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-2 text-center">Panel de Administración</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Ingresa tu email autorizado y te enviamos un link mágico para entrar
          </p>

          {status === 'sent' ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
              <div className="text-green-700 font-semibold mb-1">¡Link enviado! 📬</div>
              <p className="text-sm text-green-800">
                Revisa <strong>{email}</strong> — el correo puede tardar unos segundos.
              </p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                }}
                className="mt-3 text-xs text-green-700 underline hover:text-green-900"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={status === 'loading'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A882] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full bg-gradient-to-r from-[#C8A882] to-[#8B7355] text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link mágico'}
              </button>
            </form>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Si no recibes el correo en 1 minuto, revisa spam.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50" />}>
      <LoginForm />
    </Suspense>
  );
}
