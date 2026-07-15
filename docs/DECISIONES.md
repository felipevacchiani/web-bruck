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

## 2026-07-14 — Enforcement de permisos a nivel de API route, no de middleware

**Contexto:** al implementar el Paso 5b (enforcement real de `permission_templates`), había que decidir dónde chequear el permiso: en `middleware.ts` (un solo punto central) o en cada API route.

**Decisión:** se implementó en `lib/supabase/ci-client-auth.ts` (ya era el único punto de autorización que usan las 9 rutas de `/api/client/ci/*`), no en `middleware.ts`. Razón: `middleware.ts` nunca hizo autorización granular por acción — solo decide a qué sección (`/admin` vs `/dashboard`) redirigir según `profile.role`. Enseñarle a interpretar método HTTP + path → módulo/acción para cada API hubiera duplicado lógica que ya vive correctamente en el handler de cada ruta. El roadmap original mencionaba "migrar middleware.ts" de forma genérica; en la práctica no había nada que migrar ahí.

## Pendiente de decisión

Foco de la próxima fase de desarrollo funcional una vez cerrada la Fase 1 (ver [ROADMAP.md](./ROADMAP.md) y [PENDIENTES.md](./PENDIENTES.md)).

## 2026-07-14 — Enforcement de multi-tenant a nivel de API route, no de RLS

**Contexto:** al construir el scoping por organización (Fase 4), había que decidir si el aislamiento entre consultores se hace cumplir en RLS (a nivel de base de datos) o en cada API route (a nivel de aplicación, con `service_role`).

**Decisión:** se implementó a nivel de API route, replicando el mismo patrón que ya usa todo el proyecto (Fase 1 hizo lo mismo con los permisos granulares). Cada endpoint admin verifica explícitamente `organization_id` antes de operar. RLS se mantiene binaria (`admin`/`super_admin` ve todo vía `is_admin()`, `client` ve solo lo suyo) — **no filtra por organización**.

**Por qué:** consistencia con el resto del código (toda la lógica de negocio ya vive en las API routes con `service_role`, no hay flujos que dependan de RLS para autorización fina), y porque hacerlo en RLS hubiera requerido reescribir todas las políticas existentes de `bruck_*`, `files`, `companies`, etc. para incluir `organization_id` en cada una — mucho mayor superficie de cambio para el mismo resultado práctico hoy (un solo entorno real, sin consultores externos todavía).

**Riesgo aceptado:** si una API route tiene un bug de scoping, no hay red de seguridad a nivel de base de datos. Documentado como pendiente en `docs/PENDIENTES.md` — reforzar con RLS real antes de vender a un segundo consultor externo de verdad.
