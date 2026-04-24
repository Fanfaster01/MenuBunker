/**
 * Sync Victoriana → Supabase — CLI wrapper.
 *
 * Uso:  node scripts/sync-victoriana.js
 *
 * La lógica real vive en src/lib/sync/victoriana.js.
 */

const fs = require('fs');
const path = require('path');

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

(async () => {
  try {
    const { runVictorianaSync } = await import('../src/lib/sync/victoriana.js');
    const result = await runVictorianaSync({ log: (msg) => console.log(msg) });
    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    console.error('\n❌ FATAL:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    process.exit(1);
  }
})();
