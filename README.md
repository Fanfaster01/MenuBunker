# 🍽️ MenuBunker

> Menú digital dinámico de **Bunker Restaurant** + **Bodegón La Victoriana**, sincronizado automáticamente con sus ERPs (Xetux + Victoriana DB) cada 10 minutos.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-000000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Pro-000000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/license-private-red)]()

---

## 📍 ¿Qué es esto?

Una sola aplicación Next.js que sirve **dos menús digitales** completamente data-driven:

- 🍴 **Bunker Restaurant** → `/bunker-restaurant` (~300 items en 32 familias jerárquicas)
- 🛒 **La Victoriana Bodegón** → `/la-victoriana` (~2.900 productos en 15 departamentos × 89 grupos)
- 🎛️ **Panel admin** → `/admin` (CRUD + sync + upload de imágenes)

Los datos vienen de los ERPs SQL Server del restaurante; el sync corre automático en Vercel cada 10 min y deja todo en una capa de cache en Supabase. La metadata editable (descripciones gourmet, imágenes, visibilidad) vive aparte y sobrevive a cambios en el ERP.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│   ERPs (red local restaurante)  │         │   Vercel (cloud)                │
│                                 │         │                                 │
│   📊 Xetux SQL Server           │◀────────│   ⏱  Cron Job */10 * * * *      │
│      (Bunker · Restaurant)      │   IP    │      → /api/cron/sync           │
│                                 │ pública │      → src/lib/sync/{xetux,     │
│   📊 Victoriana DB (VAD10)      │         │              victoriana}.mjs    │
│      (La Victoriana · Bodegón)  │         │                                 │
└─────────────────────────────────┘         │   🍽️  Next.js App               │
                                            │      → /bunker-restaurant       │
                                            │      → /la-victoriana           │
                                            │      → /admin (Supabase Auth)   │
                                            │                                 │
                                            └────────────┬────────────────────┘
                                                         │
                                                         ▼
                                            ┌─────────────────────────────────┐
                                            │   🗄️  Supabase                   │
                                            │                                 │
                                            │   • *_cache (sync, read-only)   │
                                            │   • *_meta  (editable, admin)   │
                                            │   • Storage (imágenes)          │
                                            │   • Auth (magic link)           │
                                            │   • RLS policies                │
                                            └─────────────────────────────────┘
```

### Patrón clave: cache + meta separados

Cada entidad (familia, item, departamento, grupo, producto) vive en **dos tablas**:

| Tabla | Quién escribe | Qué contiene |
|---|---|---|
| `*_cache` | Sólo el **sync** (service_role) | Datos del ERP: nombre, precio, jerarquía, `is_active` (soft-delete) |
| `*_meta` | Sólo el **admin** (vía RLS `is_admin()`) | Overrides: descripción gourmet, imagen, slug, flags `is_visible_on_menu`, `is_hidden`, `is_featured` |

**¿Por qué separados?** El sync sobrescribe `*_cache` cada 10 min. La metadata editada por el admin sobrevive intacta. Si un item desaparece del ERP, queda como `is_active=false` (y ya no se muestra al cliente final), pero conserva su descripción/imagen — si vuelve, los recupera automáticamente.

---

## 🛠️ Stack

- ⚡ **[Next.js 15](https://nextjs.org)** App Router · React Server Components · Server Actions
- 🗄️ **[Supabase](https://supabase.com)** (Postgres + Auth + Storage)
- 🎨 **[Tailwind CSS 3](https://tailwindcss.com)** + **[Lucide icons](https://lucide.dev)**
- 🔌 **[mssql](https://github.com/tediousjs/node-mssql)** para conectar a los SQL Server del ERP
- 🚀 **[Vercel](https://vercel.com)** (Pro · Cron Jobs · Edge regions)

---

## 🚀 Quick start

### Pre-requisitos

- Node.js ≥ 20
- Acceso al repositorio + a la organización Vercel + al proyecto Supabase
- Estar en la red local del restaurante (o tener IP pública con port forwarding) para correr el sync local

### Setup

```bash
# 1. Clonar
git clone https://github.com/Fanfaster01/MenuBunker.git
cd MenuBunker

# 2. Instalar deps
npm install

# 3. Crear .env (NO se commitea, está en .gitignore)
cp .env.example .env  # si existiera, si no lo armas a mano
# Editar y poner las credenciales — pedir al equipo

# 4. Instalar el git hook que valida ESLint antes de cada push
powershell.exe -ExecutionPolicy Bypass -File scripts\install-git-hooks.ps1

# 5. Levantar el dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y deberías ver el landing.

### 🔑 Variables de entorno

```bash
# Supabase (mismo en local y Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://gddueramqezgopmzslwk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...                 # ⚠️ secreto, server-only

# Xetux (Bunker)
DB_HOST=...                                          # IP pública con port forwarding
DB_PORT=1433
DB_NAME=XETUXPOS
DB_USER=...
DB_PASSWORD=...

# Victoriana DB
VICTORIANA_DB_HOST=...                               # IP pública con port forwarding
VICTORIANA_DB_PORT=14333
VICTORIANA_DB_NAME=VAD10
VICTORIANA_DB_USER=...
VICTORIANA_DB_PASSWORD=...

# Cron auth (sólo en Vercel — protege /api/cron/sync)
CRON_SECRET=...
```

---

## 📁 Estructura del repo

```
MenuBunker/
├── src/
│   ├── app/
│   │   ├── (public)
│   │   │   ├── page.js                   # 🏠 Landing
│   │   │   ├── bunker-restaurant/        # 🍴 Menú Bunker dinámico
│   │   │   └── la-victoriana/            # 🛒 Menú Victoriana dinámico
│   │   ├── admin/
│   │   │   ├── login/page.js             # 🔐 Magic link
│   │   │   ├── auth/callback/route.js    # ↳ landing del link
│   │   │   └── (protected)/              # 🛡️ Gate (requireAdmin)
│   │   │       ├── layout.js             # Shell + nav del admin
│   │   │       ├── page.js               # Dashboard
│   │   │       ├── bunker/               # Familias + items
│   │   │       ├── victoriana/           # Deptos + grupos + items
│   │   │       └── sync/                 # Status + boton "Sync ahora"
│   │   └── api/
│   │       ├── menu/                     # APIs públicas Bunker
│   │       ├── victoriana-menu/          # APIs públicas Victoriana
│   │       ├── admin/check-email/        # Pre-check del whitelist
│   │       └── cron/sync/route.js        # ⏱ Endpoint de Vercel Cron
│   ├── components/
│   │   ├── bunker/                       # Componentes UI Bunker
│   │   ├── victoriana/                   # Componentes UI Victoriana
│   │   └── common/                       # Header, Footer, ImageModal...
│   ├── lib/
│   │   ├── adminAuth.js                  # requireAdmin() + isEmailWhitelisted()
│   │   ├── supabaseClient.js             # Public client (RLS, lazy init)
│   │   ├── supabaseServer.js             # Server client con sesión (cookies)
│   │   ├── supabaseBrowser.js            # Browser client con sesión
│   │   ├── supabaseAdmin.mjs             # ⚠️ Service role (server-only)
│   │   ├── imageUpload.js                # Compresión + upload a Storage
│   │   └── sync/
│   │       ├── xetux.mjs                 # Lógica sync Bunker
│   │       └── victoriana.mjs            # Lógica sync Victoriana
│   └── middleware.js                     # Refresca session cookie en /admin/*
├── scripts/
│   ├── sync-xetux.js                     # CLI wrapper (delegado al .mjs)
│   ├── sync-victoriana.js                # CLI wrapper
│   ├── sync-all.bat                      # Batch para Windows (fallback manual)
│   └── install-git-hooks.ps1             # Instala el pre-push hook
├── vercel.json                           # Config de cron + maxDuration
└── next.config.mjs                       # remotePatterns para imágenes Storage
```

---

## 🔄 Workflows comunes

### ➕ Agregar un admin

Las cuentas se controlan vía la tabla `admin_whitelist`. Hay que agregarlo por SQL directo (no hay UI a propósito — más seguro):

```sql
INSERT INTO public.admin_whitelist (email, note)
VALUES ('nuevo@email.com', 'Cargo o motivo');
```

A partir de ahí, ese email puede ir a `/admin/login`, recibir el magic link, y entrar.

Para **quitar** un admin: `DELETE FROM public.admin_whitelist WHERE email = '...';`

### ⏱ Cambiar la frecuencia del cron

Editar `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/10 * * * *"   // cada 10 min — ajusta acá
    }
  ]
}
```

Ejemplos:
- `*/5 * * * *` — cada 5 min
- `0 * * * *` — cada hora exacta
- `0 8-22 * * *` — sólo de 8am a 10pm
- `*/15 * * * *` — cada 15 min

Commit + push y Vercel re-registra el cron en el siguiente deploy.

### 🔧 Correr el sync manualmente

**Desde el admin** (más fácil):
1. Ir a `/admin/sync`
2. Click en **"Sincronizar ambos ahora"**

**Desde la línea de comandos** (si Vercel está caído o quieres ver el output crudo):
```bash
node scripts/sync-xetux.js
node scripts/sync-victoriana.js
```

### 🖼️ Subir imagen de un producto

1. Ir a `/admin/bunker/items` (o `/admin/victoriana/items`)
2. Filtrar **"Sin imagen"** para ver candidatos
3. Click **"Editar"** → **"Subir imagen"** (max 5MB, se comprime a 1200×1200 webp)
4. La imagen aparece **inmediatamente** en el menú público

### 👁️ Ocultar / mostrar una categoría del menú público

`/admin/bunker/familias` (o `/admin/victoriana/departamentos`) → toggle **"Visible/Oculta"** al lado de cada fila. Cambio instantáneo.

### 🗑️ Borrar un item que ya no existe en el ERP

1. Ir a `/admin/bunker/items` (o Victoriana items)
2. Filtrar **"🗑️ Eliminados del ERP"** (los items con badge rojo)
3. Click **"Borrar"** en cada uno → confirmas → desaparece (se borra el cache + meta + imagen)

---

## 🧰 Mantenimiento

### Verificar salud del sync

`/admin/sync` muestra el último timestamp de cada cache. Indicador verde si fue hace <30min, amarillo <2h, rojo >2h.

También puedes ver los logs del cron en **Vercel Dashboard → Logs** → filtro `/api/cron/sync`.

### Backups de Supabase

Supabase Pro hace **PITR (Point-in-Time Recovery)** automático de los últimos 7 días. Para snapshots manuales: Dashboard → Database → Backups.

### Actualizar dependencias

```bash
npm outdated         # ver qué está atrasado
npm audit            # vulnerabilidades
npm update <pkg>     # update minor/patch (seguro)
```

⚠️ **Bumps mayores pendientes** (requieren testing dedicado, ver sección Roadmap).

### Health check rápido

```bash
# Local
npm run lint              # ESLint (lo corre el pre-push hook automáticamente)
npm run build             # Validar build de prod

# Producción
curl -sI https://menu-bunker.vercel.app/api/menu/categories
# → debería responder 200 con cabeceras Cache-Control
```

---

## 🐛 Troubleshooting

### El menú público está vacío

1. ¿El cache tiene data? — `SELECT count(*) FROM bunker_item_cache WHERE is_active=true;`
2. ¿El sync corrió recientemente? — Ver `/admin/sync`
3. Si lleva mucho sin correr: forzar manual desde `/admin/sync` o ver Vercel logs por error

### El sync no corre / falla

- Vercel Cron Logs → revisar el último intento
- Causas comunes:
  - `CRON_SECRET` no coincide → 401
  - IPs públicas/credenciales del ERP cambiaron
  - SQL Server abajo → timeout

### `/admin/login` dice "email no autorizado"

El email no está en `admin_whitelist`. Agregarlo via SQL (ver workflow arriba).

### Build falla en Vercel pero local pasa

100% de las veces: ESLint estricto detecta algo que `npm run dev` no. Solución:

```bash
npm run build   # antes de pushear, lo replica localmente
```

(El **pre-push hook** ya corre `npm run lint` automáticamente y previene esto.)

### Subo una imagen y no aparece en el menú

- Verifica en `/admin/bunker/items` que el item tenga la imagen guardada (preview en el modal)
- Si el modal la muestra pero el menú público no: hard refresh (Ctrl+Shift+R) — el menú tiene cache de 60s

---

## 🗺️ Roadmap / pendientes

- [ ] **Next.js 16** upgrade (15.3 → 16.2) — requiere lectura de release notes
- [ ] **Tailwind 4** upgrade — necesita migración de `tailwind.config.mjs`
- [ ] **Lucide 1.x** — checar renames de iconos
- [ ] **mssql 12** — resolvería 7 vulnerabilidades moderate/high de la cadena `@azure/msal-node`
- [ ] Borrado en bulk de items "eliminados del ERP" cuando son muchos
- [ ] Borrado permanente para familias/departamentos/grupos (hoy sólo items)
- [ ] Dashboard de salud del sync (gráfico últimos 30 ciclos, tasa de éxito)
- [ ] Logs persistidos del sync en Supabase (no sólo Vercel logs efímeros)

---

## 🤝 Contribuir

El repo tiene un **pre-push hook** que corre `npm run lint`. Si agregas una nueva máquina al equipo:

```bash
powershell.exe -ExecutionPolicy Bypass -File scripts\install-git-hooks.ps1
```

Convención de commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.).

---

## 📜 Créditos

Construido con muchas iteraciones, café ☕, y la colaboración de **Victor De Sousa** + **Claude (Anthropic)** durante varias sesiones de pair-programming.

> _"La calidad tiene nombre"_ — La Victoriana 🐄
