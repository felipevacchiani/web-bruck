# Pendientes — BRUCK APP

_Última actualización: 2026-07-14_

## Deuda técnica (saneamiento, no funcional)

- [ ] Unificar `app/api/admin/ci/[clientId]/...` y `app/api/client/ci/...` en un solo set de handlers parametrizado por rol, para eliminar duplicación.
- [ ] Agregar políticas RLS de INSERT/UPDATE/DELETE para clientes en `bruck_*` (hoy solo tienen SELECT vía RLS; la escritura depende únicamente de `ci-client-auth.ts` a nivel de aplicación).
- [ ] Formalizar migraciones: mover a `supabase/migrations` con Supabase CLI (o al menos convención estricta con changelog), en vez de scripts SQL sueltos numerados a mano.
- [ ] Descomponer `contabilidad-panel.tsx` (~1400 líneas) en componentes más chicos si el módulo sigue creciendo.
- [ ] Configurar `darkMode` en `tailwind.config.js` y aplicar dark mode real en la UI (pedido por las instrucciones maestras del proyecto, no implementado aún).
- [ ] Definir estrategia de testing (hoy no hay tests ni CI configurados).
- [ ] `npx tsc --noEmit` reporta 67 errores preexistentes (mayormente `Property 'x' does not exist on type 'never'` en API routes que usan el cliente Supabase tipado con `Database`, más `implicit any` en `middleware.ts`/`lib/supabase/server.ts`). No introducidos por trabajo reciente; requieren revisión aparte antes de confiar en el tipado del cliente Supabase.

## Funcionalidades del documento funcional no implementadas

- Multi-tenant real (Super Admin, múltiples consultores, tabla de organizaciones).
- Sistema de permisos granular por acción/módulo (hoy es binario admin/client).
- Portal del Cliente como workspace (widgets, centro de solicitudes, tareas, notificaciones, salud del cliente).
- Constructor visual de dashboards (hoy son HTML estáticos subidos, servidos en `app/view/[id]`).
- Centro de Datos / Data Hub (conexiones a fuentes externas, modelo de datos unificado).
- Motor de procesos y automatizaciones.
- Centro de Clientes tipo CRM.
- Cualquier funcionalidad de IA (explícitamente fuera de alcance hasta nueva indicación).

## Fase 2 — Contabilidad Interna (pendiente)

- [ ] Presupuestos: definir modelo de datos (por rubro/mes/año) y comparación contra lo ejecutado real.
- [ ] Flujo de fondos: proyección de ingresos/egresos futuros, probablemente dependiente de Presupuestos.

## Fase 1 — Enforcement de permisos (parcial)

Implementado (2026-07-14, Paso 5b): las 9 rutas de `/api/client/ci/*` (rubros, cuentas bancarias, cuentas contables, movimientos, dashboard) ahora chequean `memberships.permission_template_id` vía `verifyClientAuth(action)` (`lib/supabase/ci-client-auth.ts` + `lib/supabase/permissions.ts`) antes de ejecutar la acción. Un cliente con plantilla "Auditor" recibe 401 en POST/PUT/DELETE.

No implementado (módulo `archivos`): no existe ninguna ruta donde el **cliente** pueda crear/editar/eliminar archivos — solo el admin sube/gestiona archivos por cliente. El módulo `archivos` del catálogo de permisos queda sin uso real hasta que exista una acción de escritura del lado del cliente para archivos.
- [ ] UI del cliente: ocultar botones de acción (crear/editar/eliminar en Contabilidad Interna) cuando su plantilla no lo permite, para no mostrar controles que el backend ahora rechaza con 401.
- [ ] Middleware no fue tocado a propósito: nunca hizo autorización granular por acción (solo redirect admin/dashboard), y ese chequeo ya vive correctamente a nivel de cada API route vía `verifyClientAuth`. Ver [DECISIONES.md](./DECISIONES.md).

## Decisión pendiente del usuario

Definir foco de la Fase 1 de desarrollo funcional: profundizar Contabilidad Interna, sentar bases de multi-tenant/permisos, o construir el Centro de Operaciones del cliente. Ver [ROADMAP.md](./ROADMAP.md).
