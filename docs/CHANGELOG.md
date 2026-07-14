# Changelog — BRUCK APP

## 2026-07-14 — Fase 1, Paso 2: tabla companies

- feat: migración `bruck-migration-v8.sql` crea `public.companies` (vinculada a `organizations`), agrega `company_id` nullable a `profiles`/`files`/`bruck_*` con backfill automático desde los clientes existentes.
- feat: agregado tipo `Company` y campo `company_id` en `Profile`, `FileRecord` y las interfaces `CI*` de `lib/supabase/types.ts`.
- fix (docs): corregido dato erróneo del informe inicial — las tablas `bruck_*` sí tenían RLS habilitado desde v3 (solo faltan políticas de escritura para clientes, no todo RLS).
- No se modificó `middleware.ts` ni ninguna API route — `client_id` sigue siendo la única columna que usa el código de la app hasta el Paso 5.

## 2026-07-14 — Fase 1, Paso 1: tabla organizations

- feat: migración `bruck-migration-v7.sql` crea `public.organizations` (id, name, slug, active) con RLS (lectura para cualquier autenticado, escritura solo admin), sembrada con la organización "BRUCK".
- feat: agregado tipo `Organization` y entrada en `Database.Tables` en `lib/supabase/types.ts`.
- No se modificó `profiles`, `files` ni `bruck_*` — sin impacto en funcionalidad existente.

## 2026-07-14 — Fase 0: Saneamiento

- fix: restaurado `bruck-migration-v3.sql` (sobreescrito accidentalmente en el working tree).
- fix: corregido `tailwind.config.js` (sintaxis duplicada/rota de un merge fallido).
- chore: `.gitignore` ahora excluye datos reales de cliente (`seed-*.sql`, `informes-*/`) y artefactos de build (`next-env.d.ts`, `tsconfig.tsbuildinfo`).
- chore: eliminado archivo huérfano `app/output/app/admin/clients/[id]/client-detail.tsx` (no enrutado, no referenciado).
- docs: actualizado `README.md` (versión real de Next.js 14, estructura con módulo Contabilidad Interna).
- docs: creada carpeta `/docs` (ARQUITECTURA, BASE_DATOS, REGLAS_NEGOCIO, DECISIONES, ROADMAP, PENDIENTES, CHANGELOG).
