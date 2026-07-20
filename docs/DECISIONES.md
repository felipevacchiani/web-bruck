# Decisiones — BRUCK APP

_Última actualización: 2026-07-17_

## 2026-07-17 — Rediseño de identidad visual: Fase A (base de tokens)

**Contexto:** el usuario pidió aplicar la guía de identidad visual de BRUCK (paleta, tipografía Geist, radios, sombras) a todo el portal. Relevamiento previo: ~700 colores hardcodeados en estilos inline repartidos en 13 archivos (`client-detail.tsx` 161, `contabilidad-panel.tsx` 205, `client-dashboard.tsx` 157, resto de páginas admin/login/auditoría el resto). Además se detectó que `tailwind.config.js` existe pero **no está wireado** (no hay `postcss.config.js` ni directivas `@tailwind` en `globals.css`) — las clases de Tailwind nunca se compilaron; lo que sí se usa es un micro-set de clases utilitarias escritas a mano en `globals.css` (para login/reset-password) más `style={{}}` inline con hex literal en el resto del código.

**Decisiones:**
- No reescribir los ~700 usos de color de una sola vez: se aborda en fases (A base → B portal cliente → C panel admin → D resto), cada una verificada en el navegador por el usuario antes de seguir.
- No wirear Tailwind ahora (agregar `postcss.config.js` real) — sería un cambio de infraestructura no pedido, con riesgo de romper todo el CSS existente de golpe. Se actualiza `tailwind.config.js` con la paleta completa igual, por si se decide wirear más adelante, pero queda inerte por ahora.
- Se centralizan los tokens en dos lugares: variables CSS en `app/globals.css` (`:root`, usables incluso desde `style={{ background: 'var(--bruck-green)' }}`) y un objeto TS en `lib/ui/theme.ts` (para casos donde se necesite el valor hex real, ej. cálculos de `rgba()` con opacidad variable). Las fases B/C/D deben importar de `theme.ts` en vez de repetir hex literales nuevos.
- Tipografía: se instaló el paquete `geist` (oficial de Vercel, wrapper de `next/font/local`) en vez de `next/font/google`, porque Next 14.2 embebe una lista de Google Fonts fija al momento de su release y es probable que no incluya Geist (agregada después a Google Fonts).

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
