# Roadmap — BRUCK APP

_Última actualización: 2026-07-14_

## Fase 0 — Saneamiento (completada 2026-07-14)

- Restaurado `bruck-migration-v3.sql` (había sido sobreescrito accidentalmente con el resultado de una query, perdiendo el DDL real).
- Agregados a `.gitignore`: datos reales de cliente (`seed-vacchiani.sql`, `informes-vacchiani/`) y artefactos de build (`next-env.d.ts`, `tsconfig.tsbuildinfo`).
- Corregido `tailwind.config.js` (contenido duplicado/corrupto de un merge fallido).
- Eliminado archivo huérfano `app/output/app/admin/clients/[id]/client-detail.tsx` (versión vieja, no enrutada, no referenciada).
- Actualizado `README.md` (versión real de Next.js, estructura actualizada con Contabilidad Interna).
- Creada carpeta `/docs` con documentación base (este archivo y los demás).

## Fase 1 — a definir

Pendiente de decisión del usuario sobre el foco (ver [PENDIENTES.md](./PENDIENTES.md)). Opciones evaluadas:

1. **Consolidar lo existente**: unificar API admin/client duplicada, habilitar RLS en `bruck_*`, formalizar migraciones.
2. **Profundizar Contabilidad Interna**: conciliaciones completas, presupuestos, flujo de fondos.
3. **Bases de multi-tenant/permisos**: tabla de organizaciones/consultores, permisos granulares por acción.
4. **Centro de Operaciones del cliente**: workspace tipo Notion con widgets, tareas, notificaciones.

No se avanza en desarrollo funcional de Fase 1 hasta acordar el foco.
