# Pendientes — BRUCK APP

_Última actualización: 2026-07-14_

## Deuda técnica (saneamiento, no funcional)

- [ ] Unificar `app/api/admin/ci/[clientId]/...` y `app/api/client/ci/...` en un solo set de handlers parametrizado por rol, para eliminar duplicación.
- [x] Agregar políticas RLS de INSERT/UPDATE/DELETE para clientes en `bruck_*` — escrito en `bruck-migration-v26.sql` (2026-07-27). **Pendiente correrlo en Supabase SQL Editor**, no aplicado a la base real todavía.
- [ ] Formalizar migraciones: mover a `supabase/migrations` con Supabase CLI (o al menos convención estricta con changelog), en vez de scripts SQL sueltos numerados a mano.
- [ ] Descomponer `contabilidad-panel.tsx` (~1400 líneas) en componentes más chicos si el módulo sigue creciendo.
- [ ] Configurar `darkMode` en `tailwind.config.js` y aplicar dark mode real en la UI (pedido por las instrucciones maestras del proyecto, no implementado aún).
- [x] Definir estrategia de testing — CI básico agregado (`.github/workflows/ci.yml`: typecheck + lint + build en cada push/PR a `develop`). Sigue sin haber tests automatizados (unit/e2e), solo los chequeos estáticos.
- [x] Los 89 errores de `tsc --noEmit` (67 documentados + nuevos desde 2026-07-14) resueltos (2026-07-27): causa raíz era una regresión de inferencia en `@supabase/supabase-js` 2.56+ bajo `strictNullChecks` (colapsa las filas a `never`); se fijó la versión exacta en `2.55.0` en `package.json` para que un futuro `npm install` no vuelva a saltar a una versión con el bug. El resto eran `profile` sin chequear null en varias rutas admin y `target` desactualizado en `tsconfig.json`. `tsc --noEmit` corre limpio.
- [x] **`next@14.2.29` con ~28 CVEs conocidos** — resuelto (2026-07-27): upgrade a Next 16.2.12 + React 19, verificado (tsc/lint/build limpios + smoke test en navegador). Ver `CHANGELOG.md` para el detalle (proxy.ts, eslint flat config, reglas de React Compiler bajadas a warn). `xlsx` sigue sin fix disponible (prototype pollution / ReDoS), pero su uso es solo admin/browser-side para importar extractos bancarios — exposición baja, aceptada por ahora.
- [x] `audit_logs` no se scopeaba por `organization_id` directo, sino aproximado por `user_id` de los admins de la org — corregido (2026-07-27): columna `organization_id` agregada en `bruck-migration-v27.sql` (**pendiente correrla**, incluye backfill), `logAudit()` ahora la recibe y persiste, y la query de `/admin/auditoria` filtra directo por ella.
- [x] UI del cliente en Contabilidad Interna ahora oculta los botones de crear/editar/eliminar cuando su plantilla no lo permite (2026-07-27) — resuelto el ítem de la Fase 1 más abajo.

## Funcionalidades del documento funcional no implementadas

- Multi-tenant real (Super Admin, múltiples consultores, tabla de organizaciones).
- Sistema de permisos granular por acción/módulo (hoy es binario admin/client).
- Portal del Cliente como workspace (widgets, centro de solicitudes, tareas, notificaciones, salud del cliente).
- Constructor visual de dashboards (hoy son HTML estáticos subidos, servidos en `app/view/[id]`).
- Centro de Datos / Data Hub (conexiones a fuentes externas, modelo de datos unificado).
- Motor de procesos y automatizaciones.
- Centro de Clientes tipo CRM.
- Cualquier funcionalidad de IA (explícitamente fuera de alcance hasta nueva indicación).

## Fase 4 — Multi-tenant real (mayormente cerrada, con gaps conocidos)

- [ ] **RLS no filtra por organización** — el enforcement de aislamiento entre consultores está a nivel de API route (`service_role`), no de RLS. Si una API route tuviera un bug de scoping, no hay red de seguridad a nivel de base de datos. Reforzar con políticas RLS por `organization_id` cuando haya más de un consultor real usando la plataforma.
- [ ] Auditoría (`/admin/auditoria`) se scopea de forma aproximada (por `user_id` del consultor), no por `organization_id` directo en `audit_logs` — funciona pero no es tan preciso como el resto del scoping.
- [ ] No hay auto-registro de consultores (`super_admin` los crea manualmente) — suficiente para las primeras ventas, revisar si hace falta self-signup más adelante.
- [x] Probado end-to-end con una segunda organización real de prueba (2026-07-15): aislamiento de clientes, actividad y datos confirmado; se dejó como sandbox permanente para futuras pruebas.

## Centro de Datos (iniciado 2026-07-15)

- [x] Google Sheets público (link compartido) como fuente de datos — leído en vivo, mostrado como tabla.
- [x] Vincular una fuente de datos a un gráfico (2026-07-17): si se detecta una columna de texto (primera) y una numérica, se ofrece alternar Tabla/Gráfico con barras SVG reales sobre los datos leídos en vivo del Sheet. Implementado tanto en la ficha de cliente (admin) como en "Fuentes de datos" del portal del cliente.
- [x] Gráfico configurable (2026-07-17): tipo (barras/línea/torta) y columnas de etiqueta/valor elegibles por el admin, en vez de solo detección automática.
- [ ] Google Sheets privados vía OAuth (requiere que el usuario configure credenciales en Google Cloud Console primero).
- [ ] Excel/CSV subido directamente, conexión a bases de datos externas, APIs, ERP — sin caso de uso real todavía.

## Informes personalizados (iniciado 2026-07-20)

Módulo nuevo y separado de "Fuentes de datos" — genera un informe HTML con el diseño BRUCK a partir de un Google Sheet o un documento Word, con borrador/publicado y vista previa antes de mostrarlo al cliente. Sin IA: el Word se procesa con `mammoth` (parser determinístico de .docx) y el HTML se envuelve en una plantilla fija (`lib/report-template.ts`).

- [x] Crear informe desde Google Sheet (tabla) o desde archivo .docx (títulos, párrafos, listas, tablas, imágenes embebidas).
- [x] Vista previa en modal (iframe sandboxed) antes de publicar; editar título y nombre del cliente sin regenerar todo el contenido.
- [x] Borrador/publicado — el cliente solo ve los publicados, en "Informes personalizados" dentro del grupo "Informes" del sidebar.
- [x] Regenerar contenido desde el Sheet origen (relee datos en vivo). Para Word no hay "regenerar": no se guarda el .docx original, solo el HTML resultante — si el documento cambia, hay que crear un informe nuevo.
- [ ] Editar textos puntuales del HTML generado desde la vista previa (hoy solo título/nombre de cliente; el criterio de aceptación pide poder "editar textos puntuales" del cuerpo, no implementado).
- [ ] Detección/corrección "inteligente" de jerarquía visual más allá del mapeo de estilos de Word (Title/Heading 1-3) — cualquier mejora más allá de esto entraría en terreno de IA, fuera de alcance por regla del proyecto salvo indicación expresa.

## Capítulo 4 — Portal del Cliente (mayormente cerrado 2026-07-15)

Completos y verificados: Centro de notificaciones, Centro de solicitudes, Centro de tareas, Actividad reciente, Página de inicio personalizada, Perfil de la empresa.

- [ ] **Constructor de dashboards real** (punto 7, pendiente grande): filtros interactivos, comparar períodos, exportar desde el dashboard. Hoy solo se ven fechas de versión + historial. Requiere un motor de gráficos con binding a datos — proyecto propio, a planificar por separado cuando haya prioridad para eso.
- [ ] Tareas con `source` distinto de `'manual'`: generación automática desde documentos vencidos, solicitudes o automatizaciones no implementada.
- [ ] "Conversar con la empresa" (IA conversacional) — explícitamente fuera de alcance, el documento funcional no lo marca como "evolución futura" y las instrucciones del proyecto excluyen IA salvo indicación expresa.
- [ ] Notificaciones por email — hoy solo in-app, el documento menciona "también podrán enviarse por correo si la organización así lo configura".
- [ ] Perfil de empresa: `logo_url` es solo texto (pegar URL), no hay upload de imagen real; `sucursales`/`responsables` tienen columna en la base pero no UI todavía.

## Sistema de permisos — próximos pasos (documento funcional, arquitectura general)

- [x] Perfiles predefinidos (Director, Gerencia Administrativa, Tesorería, Administración, RRHH) — sembrados 2026-07-15, aproximados a la granularidad actual (ver `CHANGELOG.md`).
- [x] Selector de empresa sin cerrar sesión — descartado (2026-07-15): confirmado con el usuario que no hay caso real de un usuario cliente en más de una empresa. El consultor ya administra muchas empresas desde una sola cuenta (eso ya funcionaba).
- [x] Invitar usuarios adicionales a una empresa existente, con plantilla de permisos — hecho 2026-07-15 (`/api/admin/clients/[id]/company-users` + sección en la ficha de cliente).
- [x] Suspender/reactivar organización — hecho 2026-07-15 (`PUT /api/super-admin/organizations/[id]`, bloqueado en `middleware.ts`, botón en `/admin/organizaciones`).
- [ ] Licencias, planes, backups, acceso temporal auditado a una organización — sin caso de uso real todavía, no implementado a propósito.
- [ ] Permisos por categoría dentro de un módulo (ej. RRHH filtrado solo a documentos `laboral`, no todo `archivos`) — requiere ampliar el modelo de `permission_template_actions` más allá de módulo×acción.

## Fase 3 — Gestión Documental (cerrada 2026-07-14)

Etiquetas libres + versionado inmutable implementados y verificados. Estados de documento confirmados como suficientes por el usuario, sin cambios.

## Fase 2 — Contabilidad Interna (cerrada 2026-07-14)

Conciliaciones, Presupuestos y Flujo de Fondos implementados y verificados en producción. Posible mejora futura (no bloqueante): permitir elegir el rango de meses del Flujo de Fondos (hoy fijo en 3 atrás / 3 adelante).

- [x] **Editar movimiento existente** (fecha/descripción/monto/factura/comentario) — hecho 2026-07-27. No existía ningún botón que permitiera corregir un movimiento ya cargado (solo "Clasificar", que no toca esos campos); había que borrar y recrear. Modal chico nuevo (`modal.type === 'mov-edit'`) + botón ✎ en Movimientos y Bancos, gateado por `canWrite`. Verificado end-to-end en navegador.

## Fase 1 — Enforcement de permisos (parcial)

Implementado (2026-07-14, Paso 5b): las 9 rutas de `/api/client/ci/*` (rubros, cuentas bancarias, cuentas contables, movimientos, dashboard) ahora chequean `memberships.permission_template_id` vía `verifyClientAuth(action)` (`lib/supabase/ci-client-auth.ts` + `lib/supabase/permissions.ts`) antes de ejecutar la acción. Un cliente con plantilla "Auditor" recibe 401 en POST/PUT/DELETE.

No implementado (módulo `archivos`): no existe ninguna ruta donde el **cliente** pueda crear/editar/eliminar archivos — solo el admin sube/gestiona archivos por cliente. El módulo `archivos` del catálogo de permisos queda sin uso real hasta que exista una acción de escritura del lado del cliente para archivos.
- [x] UI del cliente: ocultar botones de acción (crear/editar/eliminar en Contabilidad Interna) cuando su plantilla no lo permite — hecho 2026-07-27 (`ContabilidadPanel` recibe `canWrite`, calculado server-side en `app/dashboard/contabilidad/page.tsx` vía `hasPermission()`).
- [ ] Middleware no fue tocado a propósito: nunca hizo autorización granular por acción (solo redirect admin/dashboard), y ese chequeo ya vive correctamente a nivel de cada API route vía `verifyClientAuth`. Ver [DECISIONES.md](./DECISIONES.md).

## Decisión pendiente del usuario

Definir foco de la Fase 1 de desarrollo funcional: profundizar Contabilidad Interna, sentar bases de multi-tenant/permisos, o construir el Centro de Operaciones del cliente. Ver [ROADMAP.md](./ROADMAP.md).
