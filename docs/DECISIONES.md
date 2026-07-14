# Decisiones — BRUCK APP

_Última actualización: 2026-07-14_

## 2026-07-14 — Saneamiento inicial (Fase 0)

**Contexto:** Análisis inicial del proyecto detectó datos reales de cliente sin proteger en el repo, un archivo de migración corrompido accidentalmente en el working tree, un archivo de configuración roto y un archivo huérfano commiteado.

**Decisiones:**
- Restaurar `bruck-migration-v3.sql` desde el último commit (`7c71990`) en vez de conservar el contenido corrompido, porque el contenido presente en el working tree no era SQL válido sino el resultado pegado de una consulta de verificación — pérdida accidental de trabajo, no una edición intencional.
- Excluir vía `.gitignore` los archivos que contienen datos reales de un cliente (`seed-vacchiani.sql`, `informes-vacchiani/`) en lugar de eliminarlos del disco, porque pueden ser insumos de trabajo legítimos del usuario que simplemente no deben viajar al repositorio.
- Eliminar `app/output/app/admin/clients/[id]/client-detail.tsx` (estaba tracked en git) por ser una copia vieja, no enrutada por Next.js (no es `page.tsx`) y no referenciada por ningún import.
- No implementar `darkMode` en Tailwind todavía: corregir la sintaxis rota del config es un fix de bug; agregar dark mode real es una feature que requiere trabajo de UI en toda la app y debe planificarse como tal, no colarse en un saneamiento.

## 2026-07-14 — Alcance de IA

Confirmado con las instrucciones maestras del proyecto: no se desarrolla ninguna funcionalidad de IA salvo que el documento funcional la marque explícitamente como evolución futura. El documento la menciona como capacidad futura transversal, sin especificación técnica — se mantiene fuera de alcance hasta indicación explícita del usuario.

## Pendiente de decisión

Foco de la Fase 1 de desarrollo funcional (ver [ROADMAP.md](./ROADMAP.md) y [PENDIENTES.md](./PENDIENTES.md)).
