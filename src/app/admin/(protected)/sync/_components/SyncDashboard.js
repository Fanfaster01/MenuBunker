'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2, Terminal } from 'lucide-react';
import { runSync } from '../actions';

/**
 * Dashboard client component:
 *   - Muestra status cards por cada lado (cache)
 *   - Botón "Sincronizar ahora" (global o individual)
 *   - Panel de resultados expandible con stdout/stderr
 */
export default function SyncDashboard({ bunker, victoriana }) {
  const [running, setRunning] = useState(null); // 'xetux' | 'victoriana' | 'all' | null
  const [results, setResults] = useState(null); // { ok, error, runs: [...] }

  async function handleRun(which) {
    setRunning(which);
    setResults(null);
    const result = await runSync(which);
    setResults(result);
    setRunning(null);
  }

  return (
    <>
      {/* Status cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatusCard status={bunker} onSync={() => handleRun('xetux')} disabled={running !== null} running={running === 'xetux'} />
        <StatusCard
          status={victoriana}
          onSync={() => handleRun('victoriana')}
          disabled={running !== null}
          running={running === 'victoriana'}
        />
      </div>

      {/* Global sync button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 p-4">
        <div>
          <p className="text-sm font-semibold text-[#6B5A45]">Sincronizar ambos a la vez</p>
          <p className="text-xs text-gray-500 mt-0.5">Corre Xetux seguido de La Victoriana (~30-60 seg total)</p>
        </div>
        <button
          onClick={() => handleRun('all')}
          disabled={running !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#8B7355] to-[#C8302E] hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {running === 'all' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sincronizando ambos...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sincronizar ambos ahora
            </>
          )}
        </button>
      </div>

      {/* Results panel */}
      {results && <ResultsPanel results={results} />}
    </>
  );
}

function StatusCard({ status, onSync, disabled, running }) {
  const freshness = useMemo(() => formatFreshness(status.lastSyncedAt), [status.lastSyncedAt]);
  const isStale = freshness.staleness === 'stale';
  const isFresh = freshness.staleness === 'fresh';

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 p-5 overflow-hidden">
      {/* Accent stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${status.color}`} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-lg text-[#6B5A45]">{status.label}</h3>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <Clock className={`w-3.5 h-3.5 ${isFresh ? 'text-green-500' : isStale ? 'text-red-500' : 'text-gray-400'}`} />
            <span
              className={
                isFresh ? 'text-green-700 font-medium' : isStale ? 'text-red-700 font-medium' : 'text-gray-500'
              }
            >
              {freshness.label}
            </span>
          </div>
        </div>

        <button
          onClick={onSync}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C8A882]/50 bg-white text-[#8B7355] hover:bg-[#C8A882]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {running ? 'Corriendo...' : 'Sincronizar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
        {status.counts.map((c) => (
          <div key={c.label}>
            <span className="font-bold text-[#8B7355]">{c.value.toLocaleString('es')}</span>{' '}
            <span className="text-gray-500">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsPanel({ results }) {
  const hasAnyOutput = results.runs?.some((r) => r.stdout || r.stderr);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#C8A882]/30 overflow-hidden">
      {/* Summary */}
      <div
        className={`px-5 py-4 flex items-center gap-3 border-b ${
          results.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
      >
        {results.ok ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${results.ok ? 'text-green-900' : 'text-red-900'}`}>
            {results.ok ? 'Sincronización completada ✓' : 'Error en la sincronización'}
          </p>
          {results.error && <p className="text-xs text-red-800 mt-0.5">{results.error}</p>}
        </div>
      </div>

      {/* Per-run details */}
      {hasAnyOutput && (
        <div className="divide-y divide-gray-200">
          {results.runs.map((run, idx) => (
            <RunDetail key={idx} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function RunDetail({ run }) {
  const [expanded, setExpanded] = useState(!run.ok); // expandir auto si falló

  const durationSec = (run.durationMs / 1000).toFixed(1);
  const statusColor = run.ok ? 'text-green-700' : run.timedOut ? 'text-orange-700' : 'text-red-700';
  const statusIcon = run.ok ? (
    <CheckCircle2 className="w-4 h-4 text-green-600" />
  ) : (
    <AlertCircle className="w-4 h-4 text-red-600" />
  );

  return (
    <div className="px-5 py-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-semibold text-sm text-[#6B5A45]">{run.label}</span>
          <span className={`text-xs ${statusColor}`}>
            {run.ok ? 'OK' : run.timedOut ? 'Timeout' : `Exit ${run.code}`} · {durationSec}s
          </span>
        </div>
        <Terminal className="w-4 h-4 text-gray-400" />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {run.stdout && (
            <pre className="bg-gray-900 text-gray-100 text-[11px] font-mono leading-snug p-3 rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
              {run.stdout.trim()}
            </pre>
          )}
          {run.stderr && (
            <div>
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1">stderr</p>
              <pre className="bg-red-950 text-red-100 text-[11px] font-mono leading-snug p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                {run.stderr.trim()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatFreshness(iso) {
  if (!iso) return { label: 'Nunca sincronizado', staleness: 'never' };

  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now - then) / 60000);

  let label;
  if (diffMin < 1) label = 'Hace segundos';
  else if (diffMin < 60) label = `Hace ${diffMin} min`;
  else if (diffMin < 60 * 24) label = `Hace ${Math.round(diffMin / 60)} h`;
  else label = `Hace ${Math.round(diffMin / (60 * 24))} días`;

  const staleness = diffMin < 30 ? 'fresh' : diffMin < 120 ? 'ok' : 'stale';
  return { label, staleness };
}
