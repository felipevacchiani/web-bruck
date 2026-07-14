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

## Fase 1 — Enforcement de permisos (pendiente, a propósito)

La plantilla "Auditor" ya se puede asignar desde la ficha de cliente del admin, pero **hoy no bloquea nada**: ninguna API route ni el middleware leen `memberships.permission_template_id`. Falta:
- [ ] `middleware.ts`: bloquear escritura (POST/PATCH/DELETE) para memberships con plantilla que no incluya la acción `crear`/`editar`/`eliminar` sobre el módulo correspondiente.
- [ ] API routes de `files` y `bruck_*`: mismo chequeo a nivel de servidor (no solo UI), tanto para admin operando en nombre de un cliente como para el propio cliente.
- [ ] UI del cliente: ocultar botones de acción (subir, editar, eliminar) cuando su plantilla no lo permite, para no mostrar controles que el backend rechazaría.

No se implementa todavía porque no hay un caso de uso real (ningún cliente pidió un auditor de solo lectura); se retoma cuando surja la necesidad concreta, para no construir enforcement que nadie prueba end-to-end.

## Decisión pendiente del usuario

Definir foco de la Fase 1 de desarrollo funcional: profundizar Contabilidad Interna, sentar bases de multi-tenant/permisos, o construir el Centro de Operaciones del cliente. Ver [ROADMAP.md](./ROADMAP.md).
