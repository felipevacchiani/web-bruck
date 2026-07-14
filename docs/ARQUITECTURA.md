# Arquitectura — BRUCK APP

_Última actualización: 2026-07-14_

## Stack

- Next.js 14.2 (App Router), React 18, TypeScript 5.
- Supabase: Auth + Postgres + Storage (backend único, sin servidor propio adicional).
- TailwindCSS 3.4 para estilos.
- `xlsx` para importación de extractos bancarios.
- Sin ORM (acceso directo vía `@supabase/supabase-js` / `@supabase/ssr`), sin framework de testing, sin librería de componentes UI ni de gráficos.

## Estructura de carpetas

```
app/
  login/, reset-password/        → Autenticación
  dashboard/                      → Rol "client": archivos propios + Contabilidad Interna
  admin/                           → Rol "admin": clientes, alertas, auditoría, reportes
  admin/clients/[id]/contabilidad/ → Panel de Contabilidad Interna por cliente (admin)
  view/[id]/                       → Visor de HTML estático subido (embrión de "dashboards")
  api/admin/                       → Endpoints REST para el rol admin
  api/client/ci/                   → Endpoints REST para el rol client (Contabilidad Interna)
lib/supabase/
  client.ts, server.ts             → Clientes SSR/browser (anon key)
  admin.ts                         → Cliente con service_role (solo server-side, nunca en browser)
  audit.ts                         → Registro de auditoría
  ci-client-auth.ts                → Autorización específica del módulo Contabilidad Interna
  types.ts                         → Tipos y constantes de dominio
middleware.ts                       → Único punto de control de acceso (sesión + rol + active)
```

## Control de acceso actual

`middleware.ts` es el único gate: valida sesión de Supabase, bloquea usuarios con `profile.active = false`, y redirige `/admin` vs `/dashboard` según `profile.role` (`'admin' | 'client'`). **No hay permisos granulares por acción/módulo** — es un modelo binario.

## Estado real vs. documento funcional

El documento funcional (`Documento Funcional BRUCK APP - Revisado.docx`) describe una plataforma SaaS multi-tenant (Super Admin → Consultor → Empresas → Usuarios), con permisos granulares, Data Hub, motor de automatizaciones, CRM de clientes y dashboards construidos visualmente. El código implementado hoy es **single-tenant** (un solo consultor, BRUCK, sin tabla de organizaciones), con dos roles fijos y un módulo de Contabilidad Interna razonablemente maduro. Ver [DECISIONES.md](./DECISIONES.md) y [PENDIENTES.md](./PENDIENTES.md) para el detalle de esta brecha y qué se decidió priorizar.

## Deuda técnica conocida

- **Duplicación de API**: `app/api/admin/ci/[clientId]/...` y `app/api/client/ci/...` implementan los mismos recursos (cuentas bancarias, cuentas contables, movimientos, rubros) por separado para cada rol. Candidato a unificar en un solo handler parametrizado por rol/permiso.
- **RLS incompleta**: las tablas `bruck_*` (Contabilidad Interna) no tienen Row Level Security habilitado en los `.sql` de migración; la protección depende de `ci-client-auth.ts` a nivel de aplicación usando `service_role`. `profiles`, `files` y `audit_logs` sí tienen RLS.
- **Migraciones informales**: scripts SQL sueltos numerados a mano (`bruck-migration-v2.sql` … `v6.sql`, `migration.sql`), aplicados manualmente en el SQL Editor de Supabase, sin Supabase CLI ni carpeta `supabase/migrations`, sin rollback.
- **`contabilidad-panel.tsx`** (`app/admin/clients/[id]/contabilidad/`) concentra ~1400 líneas — candidato a descomponer en componentes más chicos si se sigue ampliando ese módulo.
