# Roadmap — BRUCK APP

_Última actualización: 2026-07-14_

## Fase 0 — Saneamiento (completada 2026-07-14)

- Restaurado `bruck-migration-v3.sql` (había sido sobreescrito accidentalmente con el resultado de una query, perdiendo el DDL real).
- Agregados a `.gitignore`: datos reales de cliente (`seed-vacchiani.sql`, `informes-vacchiani/`) y artefactos de build (`next-env.d.ts`, `tsconfig.tsbuildinfo`).
- Corregido `tailwind.config.js` (contenido duplicado/corrupto de un merge fallido).
- Eliminado archivo huérfano `app/output/app/admin/clients/[id]/client-detail.tsx` (versión vieja, no enrutada, no referenciada).
- Actualizado `README.md` (versión real de Next.js, estructura actualizada con Contabilidad Interna).
- Creada carpeta `/docs` con documentación base (este archivo y los demás).

## Fase 1 — Bases de multi-tenant y permisos (en progreso)

Foco elegido: sentar el modelo de organizaciones/consultores y permisos granulares, por ser la base estructural de la que depende el resto del documento funcional.

Plan por pasos pequeños y desplegables (cada uno commiteado por separado, sistema funcional en todo momento):

1. **`organizations`** (v7, hecho 2026-07-14) — tabla creada + seed "BRUCK". No modifica nada existente.
2. **`companies`** (v8, hecho 2026-07-14) — entidad real vinculada a `organizations`; backfill de `profiles`/`files`/`bruck_*` con `company_id` (nullable). `profiles.company` (texto) queda deprecado pero funcional, sin tocar código de la app.
3. **`memberships`** (v9, hecho 2026-07-14) — relación usuario↔empresa↔rol; backfill desde `profiles.role` actual. Admins no reciben membership por empresa (siguen vía `is_admin()`).
4. **`permissions`/plantillas de rol** — catálogo de acciones por módulo, sin aplicar aún en el middleware.
5. **Migración de `middleware.ts` y API routes** a validar por `memberships`+`permissions` en vez de `profiles.role` binario — recién acá cambia el comportamiento real.

Datos de este entorno son ficticios (cliente Vacchiani de prueba), por lo que no hay restricción de "producción real" en esta fase.
