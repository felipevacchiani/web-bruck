# BRUCK Portal de Clientes

Portal privado para clientes de BRUCK. Construido con Next.js 14 + Supabase.

## Stack
- Next.js 14.2 (App Router)
- Supabase (Auth + Database + Storage)
- Tailwind CSS
- TypeScript

Ver `/docs` para arquitectura, modelo de datos, decisiones y roadmap detallados.

## Setup

### 1. Variables de entorno
```bash
cp .env.example .env.local
```
Completar con las claves de Supabase (Settings > API).

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar base de datos
Ejecutar el archivo `supabase-rls.sql` en el SQL Editor de Supabase.

### 4. Correr en desarrollo
```bash
npm run dev
```

## Estructura
```
app/
  login/                    → Login + recuperar contraseña
  dashboard/                → Vista cliente (sus archivos + contabilidad)
  view/[id]/                → Visor de archivo HTML
  admin/                    → Panel admin (lista clientes, alertas, auditoría, reportes)
  admin/clients/[id]/       → Ficha de cliente + módulo Contabilidad Interna
  api/admin/                → API routes rol admin (usuarios, archivos, contabilidad interna)
  api/client/ci/            → API routes rol client para Contabilidad Interna
lib/supabase/               → Clientes browser/server/admin, auth de Contabilidad Interna, tipos
middleware.ts                → Protección de rutas + control de roles (admin/client)
*.sql (raíz)                 → Migraciones aplicadas manualmente en Supabase SQL Editor
```

## Crear usuario admin
Ejecutar en SQL Editor de Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

## Notas importantes
- Los archivos subidos son solo HTML
- Storage bucket: `client-files` (privado)
- RLS activo en `profiles` y `files`
- El Service Role Key nunca se expone al browser
