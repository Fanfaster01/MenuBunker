'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Info, Server, Terminal } from 'lucide-react';

/**
 * Guía de la arquitectura de sync automático.
 *
 * La forma primaria es Vercel Cron (cada 10 min, endpoint /api/cron/sync).
 * Se mantiene documentación del flow CLI local como fallback manual.
 */
export default function TaskSchedulerGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-6 bg-white rounded-2xl shadow-xs border border-[#C8A882]/30 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-amber-50/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-[#8B7355]" />
          <div>
            <h2 className="font-bold text-[#6B5A45]">Sync automático · Vercel Cron</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              El sync corre automáticamente cada 10 minutos en Vercel
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-6 pt-2 space-y-5 border-t border-gray-100">
          {/* Context */}
          <div className="flex gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900 leading-snug">
              <p className="font-semibold mb-0.5">Cómo funciona</p>
              <p className="text-xs">
                Vercel llama al endpoint <Code>/api/cron/sync</Code> cada 10 min. Ese endpoint se conecta a los
                SQL Server de Xetux y Victoriana vía tu IP pública + port forwarding, copia los datos a
                Supabase, y termina. No depende de que ninguna PC local esté encendida.
              </p>
            </div>
          </div>

          <Section title="Configuración (una sola vez)">
            <p className="text-sm text-gray-700 mb-3">
              El cron está definido en <Code>vercel.json</Code> del repo. Para que funcione, Vercel necesita
              estas <strong>env vars</strong> en el proyecto:
            </p>
            <EnvList
              vars={[
                { k: 'NEXT_PUBLIC_SUPABASE_URL', note: 'Ya configurada', ok: true },
                { k: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', note: 'Ya configurada', ok: true },
                { k: 'SUPABASE_SERVICE_ROLE_KEY', note: 'Ya configurada', ok: true },
                { k: 'DB_HOST', note: 'IP pública + puerto de Xetux' },
                { k: 'DB_PORT', note: 'Puerto de Xetux (default 1433)' },
                { k: 'DB_USER', note: 'Usuario SQL de Xetux' },
                { k: 'DB_PASSWORD', note: 'Password SQL de Xetux' },
                { k: 'DB_NAME', note: 'Nombre de la base (ej. XETUXPOS)' },
                { k: 'VICTORIANA_DB_HOST', note: 'IP pública + puerto de Victoriana' },
                { k: 'VICTORIANA_DB_PORT', note: 'Puerto de Victoriana (default 14333)' },
                { k: 'VICTORIANA_DB_USER', note: 'Usuario SQL de Victoriana' },
                { k: 'VICTORIANA_DB_PASSWORD', note: 'Password SQL de Victoriana' },
                { k: 'VICTORIANA_DB_NAME', note: 'Nombre de la base (ej. VAD10)' },
                {
                  k: 'CRON_SECRET',
                  note:
                    'Un string aleatorio. Vercel lo genera al activar el cron y lo inyecta automáticamente; solo autentica que las llamadas son de Vercel y no de alguien tratando de disparar el sync.',
                },
              ]}
            />
            <p className="text-xs text-gray-500 mt-3">
              Dashboard de Vercel → proyecto <Code>menu-bunker</Code> → Settings → Environment Variables
            </p>
          </Section>

          <Section title="Cron schedule" icon={<Terminal className="w-4 h-4" />}>
            <CopyableBlock value={"*/10 * * * *"} />
            <p className="text-xs text-gray-500 mt-2">
              Cada 10 minutos, los 7 días de la semana. Si necesitas cambiarlo (ej. solo en horario del
              restaurante), edita <Code>vercel.json</Code> y re-deploya.
            </p>
          </Section>

          <Section title="Ver logs del cron">
            <p className="text-sm text-gray-700">
              Dashboard de Vercel → proyecto <Code>menu-bunker</Code> → <strong>Logs</strong> →
              filtrar por <Code>/api/cron/sync</Code>. Cada ejecución deja el stdout del sync
              (cuántas familias / items / productos procesó, errores si los hubo).
            </p>
          </Section>

          <Section title="Correr manualmente desde tu PC (fallback)">
            <p className="text-sm text-gray-700 mb-2">
              Si Vercel se cae o necesitas forzar un sync fuera de banda, puedes correr los scripts
              desde la carpeta del proyecto:
            </p>
            <CopyableBlock value="node scripts/sync-xetux.js" className="mb-1.5" />
            <CopyableBlock value="node scripts/sync-victoriana.js" />
            <p className="text-xs text-gray-500 mt-2">
              O ambos en secuencia con el batch: <Code>scripts\sync-all.bat</Code>
            </p>
          </Section>
        </div>
      )}
    </section>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h3 className="font-semibold text-[#6B5A45] mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded-sm bg-gray-100 text-[#8B7355] font-mono text-[11px] whitespace-nowrap">
      {children}
    </code>
  );
}

function EnvList({ vars }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <ul className="divide-y divide-gray-100">
        {vars.map((v) => (
          <li key={v.k} className="flex items-center gap-3 px-3 py-2 text-xs">
            <code className="font-mono font-semibold text-[#8B7355] shrink-0">{v.k}</code>
            <span className="flex-1 text-gray-600 truncate">{v.note}</span>
            {v.ok && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <Check className="w-3 h-3" />
                OK
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyableBlock({ value, className = '' }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      className={`relative bg-gray-900 text-gray-100 rounded-lg px-3 py-2 pr-10 text-xs font-mono overflow-x-auto ${className}`}
    >
      <span className="break-all">{value}</span>
      <button
        onClick={copy}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        aria-label="Copiar"
        title="Copiar al portapapeles"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
