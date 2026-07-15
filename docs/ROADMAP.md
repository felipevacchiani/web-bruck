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
4. **`permission_templates`/`permission_template_actions`** (v10, hecho 2026-07-14) — catálogo de acciones por módulo agrupadas en plantillas, sembrado con "Cliente Estándar" y "Auditor". Sin aplicar aún en el middleware ni asignado a ninguna membership.
5a. **UI admin para asignar plantilla** (v11, hecho 2026-07-14) — `permission_template_id` en `memberships` (backfill a "Cliente Estándar"), endpoint `GET/PUT /api/admin/clients/[id]/permission-template` y selector en la ficha de cliente del admin.
5b. **Enforcement real** (hecho 2026-07-14) — las 9 rutas de `/api/client/ci/*` chequean la plantilla vía `verifyClientAuth(action)` antes de ejecutar. Un cliente "Auditor" ya no puede crear/editar/eliminar en Contabilidad Interna (recibe 401). No se tocó `middleware.ts` (nunca hizo autorización granular; el chequeo vive en cada API route). El módulo `archivos` queda sin enforcement porque hoy no existe ninguna acción de escritura del lado del cliente sobre archivos — nada que bloquear todavía.

Con esto, la Fase 1 (bases de multi-tenant y permisos) queda funcionalmente cerrada: esquema completo, UI de gestión, y enforcement real en el único módulo donde aplicaba. Datos de este entorno son ficticios (cliente Vacchiani de prueba).

## Fase 2 — Profundizar Contabilidad Interna (en progreso)

1. **Conciliaciones bancarias formales** (v12, hecho 2026-07-14) — tab "Conciliaciones" en `ContabilidadPanel` (admin y cliente), rutas `/api/{admin/ci/[clientId]|client/ci}/conciliaciones[/[id]]`. Cierra formalmente un mes por cuenta con saldo apertura/cierre encadenado entre períodos, distinto del flag suelto por movimiento.
2. **Presupuestos** (v13, hecho 2026-07-14) — tab "Presupuestos" en `ContabilidadPanel`, rutas `/api/{admin/ci/[clientId]|client/ci}/presupuestos[/[id]]`. Monto por rubro/mes/año, comparado contra lo real ejecutado.
3. **Flujo de fondos** (hecho 2026-07-14) — tab "Flujo de Fondos" en `ContabilidadPanel`, endpoint `GET /api/{admin/ci/[clientId]|client/ci}/flujo-fondos`. Sin tabla nueva: combina `bruck_movimientos` reales (meses ≤ actual) con `bruck_presupuestos` proyectados (meses futuros), saldo acumulado encadenado desde el saldo inicial de las cuentas. A nivel de cliente completo, no por cuenta individual (los presupuestos tampoco están segmentados por cuenta).

Con esto, la Fase 2 (Contabilidad Interna) queda funcionalmente cerrada: Conciliaciones, Presupuestos y Flujo de Fondos.

## Fase 3 — Gestión Documental avanzada (en progreso)

1. **Etiquetas libres multi-categoría** (v14, hecho 2026-07-14) — campo `files.tags` (texto libre, múltiples), complementa la categoría fija existente. Input al subir, chips + filtro en la lista de archivos (admin y cliente).
2. **Versionado inmutable formal** (v15, hecho 2026-07-14) — `version`/`is_current`/`previous_version_id` en `files`. Subir nueva versión crea fila nueva; la anterior queda inmutable (bloqueada a nivel de API, no solo de UI) y accesible desde el historial. Listado principal solo muestra la versión vigente.
3. **Estados de documento más ricos** — confirmado por el usuario que los estados actuales (`pendiente/visto/aprobado`) están bien, no requiere cambios.

Con esto, la Fase 3 (Gestión Documental avanzada) queda cerrada: etiquetas libres + versionado inmutable.

## Fase 4 — Multi-tenant real: Super Administrador (hecha 2026-07-14)

Requisito de negocio del usuario: vender BRUCK APP a múltiples consultores/líderes, no solo usarlo internamente. Se completó el modelo de 4 niveles del documento funcional (BRUCK → Super Admin → Consultor → Empresas → Usuarios):

1. **Esquema** (v16): `profiles.organization_id` + rol `super_admin`. `felipevacchiani@gmail.com` promovido a `super_admin`.
2. **Autorización**: los 31 puntos del código que chequeaban `role === 'admin'` ahora aceptan `admin` **o** `super_admin`.
3. **UI Super Admin**: `/admin/organizaciones` (visible solo para `super_admin`) — crear una organización nueva + su primer consultor (usuario `admin` con contraseña inicial), ver empresas/consultores por organización.
4. **Scoping real**: todas las rutas admin (clientes, archivos, Contabilidad Interna, alertas, auditoría, reportes) filtran por `organization_id` — un consultor ya no ve clientes/datos de otro consultor. Solo `super_admin` ve todo.
5. **Creación de cliente corregida**: ahora crea `company` + `membership` en la organización del consultor (antes quedaba huérfano, sin scoping posible).

Ver [BASE_DATOS.md](./BASE_DATOS.md) para el detalle del enforcement (a nivel de API route, no de RLS) y su limitación conocida.
