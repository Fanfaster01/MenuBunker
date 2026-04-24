/**
 * Sync Xetux → Supabase — CLI wrapper.
 *
 * Uso:  node scripts/sync-xetux.js
 *
 * La lógica real vive en src/lib/sync/xetux.js (módulo ESM reusable).
 * Este script solo:
 *   1. Carga .env si existe
 *   2. Llama a la función exportada
 *   3. Propaga el exit code
 */

const fs = require('fs');
const path = require('path');

// ========== Cargar .env ==========
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  });
}

// ========== Run ==========
(async () => {
  try {
    const { runXetuxSync } = await import('../src/lib/sync/xetux.mjs');
    const result = await runXetuxSync({ log: (msg) => console.log(msg) });
    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    console.error('\n❌ FATAL:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    process.exit(1);
  }
})();
