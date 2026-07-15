# Changelog — BRUCK APP

## 2026-07-14 — Fase 2: presupuestos por rubro/período

- feat: migración `bruck-migration-v13.sql` crea `bruck_presupuestos` (`client_id`, `company_id`, `rubro_id`, `mes`, `anio`, `monto`, `UNIQUE(rubro_id,mes,anio)`) con RLS (admin todo, cliente SELECT propio).
- feat: rutas `GET/POST /api/client/ci/presupuestos` (upsert por rubro+período) y `DELETE /api/client/ci/presupuestos/[id]` (+ equivalentes admin). El GET calcula lo real ejecutado desde `bruck_movimientos` por rubro/mes/año.
- feat: tab "Presupuestos" en `ContabilidadPanel` — edición inline por rubro con guardado explícito, columna de desvío coloreada según si es favorable (verde) o desfavorable (rojo) según la categoría del rubro (ingreso/egreso). Agregado al sidebar embebido del cliente.
- feat: tipo `CIPresupuesto` en `lib/supabase/types.ts`.
- fix (no relacionado): corregida columna `disponible` faltante en `bruck_cuentas_bancarias` — la migración v4 nunca se había aplicado en esta base, bloqueaba crear cuentas bancarias nuevas.
- Build y typecheck verificados (67 errores preexistentes sin cambios).

## 2026-07-14 — Fase 2: conciliaciones bancarias formales

- feat: migración `bruck-migration-v12.sql` agrega `UNIQUE(cuenta_bancaria_id, mes, anio)` a `bruck_conciliaciones` (tabla existía desde v3 sin uso).
- feat: rutas `GET/POST /api/client/ci/conciliaciones` y `PUT/DELETE /api/client/ci/conciliaciones/[id]` (+ equivalentes admin en `/api/admin/ci/[clientId]/conciliaciones`). El GET con `cuenta+mes+anio` calcula `saldo_apertura` encadenado del período anterior y `saldo_cierre` sugerido a partir de los movimientos reales.
- feat: tab "Conciliaciones" en `ContabilidadPanel` (compartido admin/cliente) — cerrar/reabrir período, historial por cuenta. Agregado también al sidebar embebido del cliente (`client-dashboard.tsx`).
- feat: tipo `CIConciliacionEstado` y constante `CI_CONCILIACION_ESTADOS` en `lib/supabase/types.ts`.
- Usa las acciones de permisos ya existentes del módulo `contabilidad` (ver/crear/editar/eliminar) — sin cambios al catálogo de permisos.
- Build y typecheck verificados (67 errores preexistentes sin cambios).

## 2026-07-14 — Fase 1, Paso 5b: enforcement real de permisos (cierre de Fase 1)

- feat: `lib/supabase/permissions.ts` — `hasPermission(admin, userId, module, action)`, fail-open si el usuario no tiene membership/plantilla (no rompe cuentas previas al modelo).
- feat: `verifyClientAuth(action)` ahora chequea el permiso vía `hasPermission` antes de autorizar (admin siempre pasa).
- feat: las 9 rutas de `/api/client/ci/*` (rubros, cuentas-bancarias, cuentas-contables, movimientos, dashboard) pasan la acción correspondiente a su método HTTP (GET→ver, POST→crear, PUT→editar, DELETE→eliminar).
- No se tocó `middleware.ts` — decisión documentada en [DECISIONES.md](./DECISIONES.md).
- Build y typecheck verificados (67 errores preexistentes sin cambios).
- **Fase 1 (bases de multi-tenant y permisos) queda cerrada.**

## 2026-07-14 — Fase 1, Paso 5a: UI admin para asignar plantilla de permisos

- feat: migración `bruck-migration-v11.sql` agrega `permission_template_id` a `memberships`, backfillado a "Cliente Estándar" (sin cambio de comportamiento).
- feat: endpoint `GET/PUT /api/admin/clients/[id]/permission-template` para leer/asignar la plantilla de un cliente.
- feat: selector de plantilla en `app/admin/clients/[id]/client-detail.tsx`, junto a los datos del cliente.
- Importante: esto es solo la UI de gestión — **todavía no hay enforcement real**. Asignar "Auditor" no bloquea nada hasta el Paso 5b (documentado como pendiente explícito, no construido a propósito hasta que haya un caso de uso real).
- Build y typecheck verificados (67 errores preexistentes sin cambios).

## 2026-07-14 — Fase 1, Paso 4: catálogo de permisos y plantillas de rol

- feat: migración `bruck-migration-v10.sql` crea `permission_templates` y `permission_template_actions` (módulo × acción), sembrado con plantillas "Cliente Estándar" (ver/crear/editar/eliminar) y "Auditor" (solo ver) sobre los módulos `archivos` y `contabilidad`.
- feat: agregados tipos `PermissionTemplate`, `PermissionTemplateAction`, `PermissionModule`, `PermissionAction` en `lib/supabase/types.ts`.
- Aún no se asigna ninguna plantilla a ninguna `membership`, ni se lee este catálogo desde `middleware.ts` o las API routes — eso es el Paso 5.

## 2026-07-14 — Fase 1, Paso 3: tabla memberships

- feat: migración `bruck-migration-v9.sql` crea `public.memberships` (user_id, company_id, role, UNIQUE(user_id, company_id)), con backfill de una membership `'cliente'` por cada cliente existente.
- feat: agregado tipo `Membership`/`MembershipRole` y entrada en `Database.Tables` de `lib/supabase/types.ts`.
- Decisión: admins no reciben membership por empresa (siguen accediendo vía `is_admin()`) — evita modelar un nivel de membership a nivel organización que hoy no aporta nada.
- No se modificó `middleware.ts` ni ninguna API route.

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
