# 🤖 Briefing para Claude Code

> Este archivo es el "primer mensaje" que cualquier nueva sesión de Claude debe leer antes de hacer nada. Contiene contexto, decisiones tomadas, y quirks aprendidos durante meses de pair-programming.

---

## 👤 Sobre el dueño

- **Victor De Sousa** — desarrollador y operador de Bunker Restaurant + Bodegón La Victoriana en Venezuela 🇻🇪
- Email para contacto: `victorjdesousal@outlook.com` / `victorjdesousal@gmail.com` (ambos en `admin_whitelist`)
- Trabaja desde **Windows nativo**, no desde WSL (aunque tiene WSL para otras cosas)
- Cariñoso, colaborativo, prefiere explicaciones claras y comentarios en código que lo expliquen al "Victor del futuro"

---

## 🗣️ Reglas de comunicación

- 🇻🇪 **Español venezolano** — usar "tú", NUNCA voseo argentino ("vos elegí" ❌, "tú eliges" ✅)
- Tono cálido, directo, con un toque informal cuando aplica ("dale", "va", "súper")
- Cuando el usuario celebra algo, devolver la energía pero sin exagerar
- Emojis: usarlos con moderación cuando aporten claridad visual (como en el README), no llenar de ellos por defecto
- Cuando hay dudas no obvias, **preguntar antes de actuar** (especialmente decisiones arquitectónicas)

---

## 📦 Sobre el proyecto

- **Stack**: Next.js 15 App Router + Supabase (DB/Auth/Storage) + Vercel Pro (hosting + Cron)
- **Repo**: https://github.com/Fanfaster01/MenuBunker
- **Producción**: https://menu-bunker.vercel.app (alias `menu-bunker.vercel.app`)
- **Supabase project**: `gddueramqezgopmzslwk`
- **Vercel project**: `prj_w77ck2TK1SokBLvfgJTZWx1guiiE` (team `team_LJfyuSxWiJuMn0iA3qt7m64R`)
- 📖 Para arquitectura completa, **leer `README.md` antes que cualquier otra cosa**

---

## 💻 Setup local específico de Victor

### Plataforma
- Windows 11 + Node.js v20 instalado nativamente en `C:\Program Files\nodejs\`
- Repo clonado en `C:\Users\Victor De sousa\proyectos\MenuBunker`
- Tiene una copia adicional en WSL Ubuntu (`/home/victor_de_sousa/proyectos/menu-digital-bunker-dsl`) — **no usar esa, usar la de Windows**

### `.npmrc` local (CRÍTICO)
- Su `~/.npmrc` global tiene `os=linux` (legacy de cuando trabajaba desde WSL)
- Por eso el repo tiene un `.npmrc` LOCAL con `os=win32` + `cpu=x64` que **override** el global
- Ese `.npmrc` está **gitignored** (no debe ir al repo, Vercel rompería)
- Si una sesión nueva clona el repo en otra máquina Windows, debe crear su propio `.npmrc` local

### Comandos que Victor usa seguido
```powershell
# Dev server (siempre puerto 3000)
npm run dev

# CLI de Claude Code generalmente accede via PowerShell tool
# Bash tool corre en WSL → no usar Bash para npm/git en este proyecto

# Validar antes de pushear (lo hace el hook automáticamente):
npm run lint

# Sync manual desde terminal (alternativa al boton del admin):
node scripts/sync-xetux.js
node scripts/sync-victoriana.js
```

### Git hook activo
- Pre-push hook corre `npm run lint` antes de cada push (en `.git/hooks/pre-push`)
- Instalado vía `scripts/install-git-hooks.ps1`
- Si fallara y bloqueara un push urgente: `git push --no-verify`

### Acceso de DB para sync
- Los SQL Server de los ERPs están en la red local del restaurante (`192.168.88.x`)
- Hay **port forwarding desde IP pública fija** (NetUno) — Vercel SÍ los puede alcanzar
- Las env vars `DB_HOST` / `VICTORIANA_DB_HOST` apuntan a la IP pública, no a la interna

---

## 🏗️ Decisiones arquitectónicas — no cambiar sin razón fuerte

### 1. Patrón cache + meta separados
- `*_cache` — sólo lo escribe el sync (service_role). Datos del ERP.
- `*_meta` — sólo lo escribe el admin (con RLS `is_admin()`). Overrides editables.
- **NUNCA mezclar columnas editables en `*_cache`**. El sync sobrescribe esa tabla cada 10 min.

### 2. Soft-delete con `is_active`
- El sync **nunca hace `DELETE` automático** del cache, sólo `UPDATE is_active = false`.
- Por qué: las FKs `*_meta → *_cache` son `ON DELETE CASCADE`. Si DELETE eléctron, perdería metadata editada (descripciones gourmet, imágenes).
- El admin SÍ puede hacer `DELETE` permanente vía la UI, pero sólo de items con `is_active = false` (guard explícito en el Server Action).
- Las views públicas (`bunker_visible_categories`, `victoriana_visible_*`) filtran por `is_active = true`.
- Las admin views exponen `is_active` para que el admin distinga "ocultos por mí" vs "eliminados del ERP".

### 3. FKs `*_meta → *_cache` con `ON DELETE CASCADE` son **deliberadas**
- En un commit pasado las droppé pensando que protegía la metadata, pero **rompió los embeds de PostgREST** (que las requieren).
- La solución correcta es: **CASCADE activo + sync que nunca hace DELETE, sólo UPDATE**. Combinación que mantiene los embeds funcionando + protege la meta.
- Si una nueva sesión piensa "voy a dropear las FKs para...", **STOP y leer este punto antes**.

### 4. Service role vs user-authenticated client
- Las tablas `*_cache` **no tienen RLS policies para usuarios autenticados** (sólo service_role muta).
- Cualquier mutación en `*_cache` debe usar `getSupabaseAdmin()` (en `src/lib/supabaseAdmin.mjs`).
- Para `*_meta` sí hay policies con `is_admin()`, así que cliente con sesión funciona.
- Storage uploads también requieren service role (bug de `@supabase/ssr` que no propaga JWT al sub-cliente de Storage).

### 5. Módulos `.mjs` en `src/lib/sync/` y `supabaseAdmin.mjs`
- Son ESM nativos para que los CLI scripts puros (Node sin bundler) puedan dynamic-importarlos.
- Imports a estos módulos **siempre con extensión explícita `.mjs`** — Next.js webpack no resuelve `.mjs` automáticamente.
- Ejemplo: `import { getSupabaseAdmin } from '@/lib/supabaseAdmin.mjs'` ✅ (no sin extensión).

### 6. Vercel Cron + IP pública del restaurante
- El sync corre cada 10 min en Vercel (`vercel.json`).
- `CRON_SECRET` está en Vercel env vars, Vercel lo inyecta automáticamente al header `Authorization: Bearer ...`.
- El endpoint `/api/cron/sync` valida ese header en producción (`process.env.VERCEL === '1'`).
- En dev local, el endpoint funciona sin secret para facilitar testing.

---

## 🐛 Quirks técnicos aprendidos (no repetir errores)

### Build de Vercel vs `npm run dev`
- `npm run dev` no corre ESLint estricto. `npm run build` (Vercel) sí.
- El error clásico: `react/no-unescaped-entities` por comillas dobles `"..."` en JSX → usar guillemets «..» (Unicode, sin escape) o `&quot;`.
- Mitigación: el pre-push hook ya corre `npm run lint`. Si pasa, Vercel pasa.

### PostgREST default row limit
- Es `1000` por default en Supabase Cloud. `.range(0, 9999)` no lo supera.
- Para fetch de >1000 rows: paginación manual en chunks de 1000. Ver `fetchAllItems()` en `src/app/admin/(protected)/victoriana/items/page.js`.

### Códigos compuestos en Victoriana
- Los `codigo` de **grupos** NO son únicos globalmente — se repiten entre departamentos (ej. "01" en 6 deptos).
- JOINs y React keys deben ser compuestos: `(codigo, departamento_codigo)`.
- Helper: `groupKey(g) = "${dept_codigo}:${codigo}"` en `GroupList.js`.

### `is_admin()` RLS function
- Está en SQL como función `SECURITY DEFINER`.
- Internamente lee `auth.users.email` via `auth.uid()` (NO `auth.jwt() ->> 'email'`).
- Por qué: `auth.jwt()` puede no propagarse en contextos como Storage. `auth.users` siempre funciona.

### `server-only` package
- NO está en `package.json`. Next.js lo provee implícitamente.
- Si una sesión nueva quiere agregar `import 'server-only'`, **rompe el CLI**. La protección "natural" ya existe vía env vars que sólo existen server-side.

### Idioma de error: `npm install` desde Bash tool
- El `Bash` tool de Claude Code corre dentro de WSL (Linux).
- Si una sesión hace `npm install` desde `Bash`, se instalan los binarios Linux de SWC y los Windows quedan faltantes.
- Solución: usar el `PowerShell` tool para todo lo que sea `npm` y `git` en este proyecto.

---

## 📝 Convenciones

### Commits
- [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Mensajes ricos en contexto: explicar el **por qué**, no solo el **qué**.
- Usar `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` al final.
- En PowerShell, usar `-m "..."` múltiples (uno por párrafo). Here-strings rompen con caracteres especiales.

### Migraciones SQL
- Usar `mcp__7a8e36bf-...__apply_migration` (no `execute_sql`) para cambios DDL — quedan registradas en el historial de Supabase.
- `execute_sql` para queries de lectura/diagnóstico.
- Cuando se modifica una view existente con `CREATE OR REPLACE VIEW`, **PostgreSQL no permite cambiar el orden de columnas existentes** — agregar columnas nuevas siempre al final.

### Testing flow
1. Cambio en código
2. `npm run lint` (o esperar al pre-push hook)
3. Probar localmente en `localhost:3000`
4. Commit con mensaje descriptivo
5. Push (hook valida lint)
6. Vercel auto-deploy
7. Victor promueve manualmente a producción (no hay auto-promote)

---

## 🛟 Si una sesión nueva está perdida

1. **Leer `README.md`** — arquitectura completa
2. **`git log --oneline -30`** — historia reciente, cada commit cuenta el por qué
3. **`/admin/sync`** en producción — verifica salud del sync
4. **Vercel Dashboard → Logs** — para errores de runtime
5. **Supabase Dashboard → Database → Tables** — ver schema actual
6. **Preguntar a Victor** — siempre disponible y prefiere que pregunten antes que asumir

---

_Última actualización: cierre de sesión donde quedó todo limpio (cleanup + pre-push hook + README + soft-delete UI), repo en estado profesional y producción 100% funcional._

— Lumen 🌙
