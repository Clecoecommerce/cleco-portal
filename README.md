# Cleco · Portal de Clientes

Portal web de cobranza B2B para clientes de Cleco SpA. Construido con Next.js 14, TypeScript, Tailwind CSS y Supabase.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS v3 |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Deploy | Vercel (región São Paulo `gru1`) |

---

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Configurar la base de datos

1. Ve a [Supabase Dashboard](https://app.supabase.com) → tu proyecto → **SQL Editor**
2. Copia y ejecuta el contenido de `supabase/schema.sql`
3. Ve a **Storage** → crea un bucket llamado `facturas` (privado)
4. Ejecuta las políticas de storage comentadas al final del schema SQL

### 4. Crear primer usuario

En Supabase Dashboard → **Authentication** → **Users** → Invite user  
(o usa la API de signup si quieres activar el registro público)

### 5. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new)
2. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy → la URL de producción queda lista automáticamente

---

## Estructura del proyecto

```
src/
├── app/
│   ├── auth/login/          # Login (Server Action)
│   ├── dashboard/           # Panel, Deudores, Pagos, Ayuda
│   └── api/auth/callback/   # Supabase auth callback
├── components/
│   ├── ui/                  # Badge, Button, MetricCard, UploadModal
│   └── layout/              # TopNav, MobileDrawer
├── lib/
│   ├── supabase/            # client.ts + server.ts
│   └── utils.ts             # cn, formatCLP, formatRUT, formatDate
└── types/
    └── database.ts          # Tipos TypeScript del schema
```

---

## Funcionalidades

- **Login** con email + contraseña (Supabase Auth)
- **Panel** — métricas de cartera + tabla de facturas con búsqueda
- **Deudores** — listado de empresas deudoras con riesgo y mora
- **Pagos** — historial de recuperos y cálculo de honorarios (12%)
- **Ayuda** — FAQ + contacto con ejecutivo asignado
- **Modal de carga** — drag & drop de PDF/XML hacia Supabase Storage
- **Responsive** — mobile-first, tabla en modo card en pantallas pequeñas
- **RLS** — cada cliente solo ve sus propios datos

---

© 2026 Cleco SpA · Santiago, Chile
