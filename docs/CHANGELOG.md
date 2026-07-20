# Changelog — BRUCK APP

## 2026-07-17 — Fuentes de datos: selección de hoja + modal a pantalla completa

- feat: campo opcional "Hoja" al conectar un Google Sheet (`sourceForm.gid`) — permite pegar el gid de una pestaña específica del spreadsheet sin tener que copiar la URL completa de esa pestaña. Cada hoja se conecta como una fuente de datos independiente (mismo modelo de datos, sin migración: el gid se agrega al `url` guardado vía `withGid()`).
- fix/mejora: el modal de visualización (tabla/gráfico) ahora ocupa 95vw × 88vh en vez de un ancho fijo de 900px — el usuario reportó que el gráfico se veía chico. El SVG usa `viewBox` + `preserveAspectRatio="none"` para escalar con el contenedor.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-17 — Centro de Datos: gráfico real para fuentes de datos (Google Sheets)

- feat: `detectChartColumn`/`toNum` (en `client-detail.tsx` y `client-dashboard.tsx`) detectan automáticamente una columna de etiqueta (primera) y una numérica en los datos leídos en vivo de un Google Sheet.
- feat: toggle Tabla/Gráfico en el modal de visualización de una fuente de datos, tanto en la ficha de cliente del admin como en "Fuentes de datos" del portal del cliente — cuando se detecta una columna numérica, se puede alternar a un gráfico de barras SVG real (mismo patrón sin librerías externas usado en Flujo de Fondos).
- Sin cambios de backend: sigue usando los mismos endpoints de lectura en vivo (`/api/admin/clients/[id]/data-sources/[sourceId]`, `/api/client/data-sources/[sourceId]`).
- Typecheck: sin errores nuevos (los dos archivos tocados solo muestran errores preexistentes no relacionados, patrón `Set<T>` iteration). Build verificado.
- Pendiente de confirmación del usuario: conectar un Sheet real de punta a punta y ver el gráfico en el navegador.

## 2026-07-14 — Fase 3: versionado inmutable de archivos (cierre de Fase 3)

- feat: migración `bruck-migration-v15.sql` agrega `version`, `is_current`, `previous_version_id` a `files`.
- feat: `POST /api/admin/files/[id]/version` — sube una nueva versión (crea fila nueva, marca la anterior `is_current=false`, encadena vía `previous_version_id`). Copia metadatos (categoría, tags, fechas fiscales, etc.) de la versión anterior; resetea `doc_status` a `pendiente` para re-aprobación.
- feat: `PATCH`/`DELETE` de `/api/admin/files/[id]` ahora rechazan con 409 si el archivo no es la versión vigente (`is_current=false`) — inmutabilidad real a nivel de API, no solo de UI.
- feat: listado principal (admin y cliente) filtra a solo `is_current=true`; badge `vN` cuando `version>1`; botón "↑ Nueva versión" y panel de historial (solo lectura, con descarga) en la ficha de cliente del admin.
- fix (no relacionado): renombrado el campo "Etiqueta" (nombre del documento individual) a "Nombre del documento" — se confundía con el nuevo campo "Etiquetas" de búsqueda.
- Build verificado. Typecheck: 66 errores (por debajo del baseline de 67 — los casts `as any` agregados en las rutas de archivos redujeron algunos errores preexistentes de paso).
- **Fase 3 (Gestión Documental avanzada) queda cerrada**: etiquetas libres + versionado inmutable. Estados de documento confirmados como suficientes por el usuario.

## 2026-07-14 — Fase 3: etiquetas libres en archivos

- feat: migración `bruck-migration-v14.sql` agrega `files.tags text[]` (default `{}`) + índice GIN.
- feat: `POST /api/admin/files` acepta `tags` (formdata, separadas por coma); `PATCH /api/admin/files/[id]` permite editarlas.
- feat: input de etiquetas en el formulario de subida (admin), chips `#etiqueta` en la lista de archivos (admin y cliente), filtro por etiqueta en la vista del admin.
- feat: campo `tags: string[]` en `FileRecord` (`lib/supabase/types.ts`).
- Complementa la categoría fija existente — no se modificó `category` ni ningún dato existente.
- Build verificado. Typecheck: 68 errores (1 más que el baseline de 67, mismo patrón preexistente `Set<T>` iteration ya presente en el archivo, no funcional).

## 2026-07-14 — Fase 2: flujo de fondos (cierre de Fase 2)

- feat: endpoint `GET /api/{admin/ci/[clientId]|client/ci}/flujo-fondos` — sin tabla nueva. Combina `bruck_movimientos` reales (períodos ≤ mes actual) con `bruck_presupuestos` proyectados (períodos futuros), saldo acumulado encadenado desde `bruck_cuentas_bancarias.saldo_inicial`. Rango por defecto: 3 meses atrás, 3 adelante (parámetros `desde`/`hasta` opcionales en formato `YYYY-MM`).
- feat: tab "Flujo de Fondos" en `ContabilidadPanel` — tabla Mes/Ingresos/Egresos/Neto/Saldo con badge Real/Proyectado. Agregado al sidebar embebido del cliente.
- Alcance a nivel de cliente completo, no por cuenta bancaria individual (consistente con que Presupuestos tampoco está segmentado por cuenta).
- Build y typecheck verificados (67 errores preexistentes sin cambios).
- **Fase 2 (Contabilidad Interna: Conciliaciones + Presupuestos + Flujo de Fondos) queda cerrada.**

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

## 2026-07-14 — Fase 4: Super Administrador / multi-tenant real

- feat: migración `bruck-migration-v16.sql` agrega `profiles.organization_id`, rol `super_admin` (constraint ampliado), `is_admin()` ampliada, promueve `felipevacchiani@gmail.com` a `super_admin`.
- feat: 31 puntos del código (`middleware.ts` + rutas admin/CI/files + páginas) actualizados de `role === 'admin'` a `['admin','super_admin'].includes(role)`, vía reemplazo sistemático verificado (regex + build).
- feat: `POST/GET /api/super-admin/organizations` (solo `super_admin`) — crear organización + su primer consultor, con sus propias plantillas de permisos sembradas. UI en `/admin/organizaciones`.
- feat: **scoping real por organización** en: listado y ficha de clientes, archivos (subir/editar/eliminar/versionar/descargar/ver), las 14 rutas de Contabilidad Interna del admin, alertas, auditoría (aproximado), reportes CSV. Un consultor (`admin`) ya no ve ni puede tocar datos de otro consultor; `super_admin` ve todo.
- fix: creación de cliente (`POST /api/admin/clients`) ahora crea `company` + `membership` (con plantilla "Cliente Estándar") en la organización del consultor — antes el cliente quedaba sin `company_id`/`organization_id`, roto para cualquier scoping futuro.
- Build verificado. Typecheck sube a ~93 errores (mismo patrón preexistente de `never` por falta de casts `as any`, ya tolerado por `next.config.js` `ignoreBuildErrors: true` en todo el proyecto — no bloquea build).
- **Limitación conocida documentada**: el aislamiento entre organizaciones es a nivel de API route, no de RLS. Ver [PENDIENTES.md](./PENDIENTES.md).

## 2026-07-15 — Perfiles predefinidos (Director, Gerencia Administrativa, Tesorería, Administración, RRHH)

- feat: migración `bruck-migration-v17.sql` siembra 4 plantillas nuevas para todas las organizaciones existentes (además de "Cliente Estándar" y "Auditor" de v10): Director (solo lectura), Gerencia Administrativa (completo), Tesorería (contabilidad operativa sin eliminar + archivos solo lectura), Administración (operativo sin eliminar), Recursos Humanos (solo archivos, sin contabilidad).
- feat: `POST /api/super-admin/organizations` siembra las mismas 6 plantillas para organizaciones nuevas (antes solo sembraba 2).
- **Limitación conocida**: los perfiles se aproximan con la granularidad actual (módulo `archivos`/`contabilidad` × acción `ver/crear/editar/eliminar`). No hay permisos por categoría dentro de un módulo (ej. "RRHH solo ve documentos laborales" no está implementado — RRHH ve todo `archivos` en modo lectura, no filtrado por categoría). Documentado en `docs/PENDIENTES.md`.
- Build verificado.

## 2026-07-15 — Invitar usuarios adicionales a una empresa

- feat: `GET/POST /api/admin/clients/[id]/company-users` — lista los usuarios que comparten `company_id` con el cliente y permite invitar uno nuevo (email/nombre/contraseña + plantilla de permisos), scopeado por organización igual que el resto de rutas de Fase 4.
- feat: sección "Usuarios de esta empresa" + modal "Invitar usuario" en la ficha de cliente del admin. Antes cada empresa quedaba atada 1:1 a un solo usuario; ahora una empresa puede tener usuarios ilimitados, cada uno con su propia plantilla de permisos (ej. uno "Tesorería", otro "Recursos Humanos").
- Build verificado.

## 2026-07-15 — Suspender/reactivar organización (Super Admin)

- feat: `PUT /api/super-admin/organizations/[id]` — togglea `organizations.active` (solo `super_admin`).
- feat: `middleware.ts` bloquea el acceso de cualquier usuario (`admin`/`client`) cuya organización esté suspendida (`organizations.active = false`), redirigiendo a `/login?error=organization_suspended`. `super_admin` nunca es bloqueado por esto.
- feat: botón "Suspender"/"Reactivar" por organización en `/admin/organizaciones`, con confirmación explícita.
- Licencias, planes y backups quedan documentados como pendientes sin implementar — sin caso de uso real todavía (ver `docs/PENDIENTES.md`).
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 1: Centro de notificaciones

- feat: migración `bruck-migration-v18.sql` crea `public.notifications` (user_id, company_id, type, title, message, link, read) con RLS.
- feat: `lib/supabase/notifications.ts` — `notifyUser()`/`notifyCompany()`, helper reutilizable para el resto de módulos del Portal del Cliente (solicitudes, tareas, dashboards).
- feat: `GET /api/client/notifications`, `PUT /api/client/notifications` (marcar todas leídas), `PUT /api/client/notifications/[id]` (marcar una leída).
- feat: campanita con contador de no leídas + dropdown en el header del dashboard del cliente.
- feat: primera integración real — aprobar un documento (`PATCH /api/admin/files/[id]` con `doc_status: 'aprobado'`) notifica automáticamente al cliente dueño.
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 2: Centro de solicitudes

- feat: migración `bruck-migration-v19.sql` crea `public.requests` (organization_id, company_id, created_by, title, description, categoría/período sugeridos, due_date, status, file_id) con RLS.
- feat: `GET/POST /api/admin/clients/[id]/requests` — el consultor crea una solicitud puntual para una empresa (ej. "extracto bancario de agosto"), notifica a todos los usuarios de esa empresa.
- feat: `GET /api/client/requests` + `POST /api/client/requests/[id]/fulfill` — el cliente ve sus solicitudes y sube el archivo directamente desde la solicitud; el sistema crea el `file` con la categoría/período precargados, marca la solicitud como completada y notifica al consultor que la creó.
- feat: sección "Solicitudes" + modal "Nueva solicitud" en la ficha de cliente del admin; nueva vista "📥 Solicitudes" (con badge de pendientes) en el sidebar del dashboard del cliente.
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 3: Centro de tareas

- feat: migración `bruck-migration-v20.sql` crea `public.tasks` (organization_id, company_id, assigned_to, created_by, title, description, source, status, due_date) con RLS.
- feat: `GET/POST /api/admin/clients/[id]/tasks` — el consultor crea una tarea y la asigna a un usuario específico de la empresa (de los ya invitados), notifica al asignado.
- feat: `GET /api/client/tasks` + `PUT /api/client/tasks/[id]` — el usuario ve sus tareas asignadas y cambia el estado entre `pendiente/en_proceso/finalizada/no_aplica`; notifica a quien creó la tarea.
- feat: sección "Tareas" + modal "Nueva tarea" (con selector de asignado) en la ficha de cliente; vista "📝 Tareas" con badge de pendientes en el sidebar del cliente.
- `source` queda como `'manual'` siempre por ahora — la generación automática desde documentos vencidos/solicitudes/automatizaciones no está implementada (documentado en `docs/PENDIENTES.md`).
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 4 y 5: Actividad reciente + Página de inicio

- feat: vista "🕐 Actividad reciente" en el sidebar del cliente — línea de tiempo completa reutilizando `notifications` (sin tabla ni API nueva).
- feat: **página de inicio personalizada** (`showHome`, vista por defecto al iniciar sesión): saludo, KPIs clickeables (solicitudes pendientes, tareas pendientes, documentos pendientes, saldo actual vía `/api/client/ci/dashboard`), próximos vencimientos (documentos con `due_date` en 7 días sin aprobar), documentos recientes, y actividad reciente (últimas 5 notificaciones) con acceso directo a cada módulo.
- Responde las 3 preguntas que pide el documento funcional: qué está pasando (KPIs + actividad), qué tengo que hacer (solicitudes/tareas pendientes + vencimientos), qué cambió (actividad reciente).
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 6: Perfil de la empresa

- feat: migración `bruck-migration-v21.sql` amplía `companies` con `cuit`, `razon_social`, `direccion`, `telefono`, `email_contacto`, `logo_url`, `info_societaria`, `sucursales` (jsonb), `responsables` (jsonb).
- feat: `GET/PUT /api/admin/clients/[id]/company-profile` (el consultor edita) + `GET /api/client/company-profile` (el cliente ve, solo lectura).
- feat: sección colapsable "Perfil de la empresa" en la ficha de cliente del admin; vista "🏢 Mi empresa" en el sidebar del cliente.
- **Simplificaciones documentadas**: `logo_url` es un campo de texto (pegar una URL ya alojada), no un upload de imagen — evita duplicar la lógica de storage. "Bancos" no se agrega porque ya existe como `bruck_cuentas_bancarias`. "Integraciones" no se agrega — sin caso de uso real todavía. Edición es solo del consultor; el cliente ve pero no edita (no hay señal de que necesite autoservicio ahí).
- Build verificado.

## 2026-07-15 — Portal del Cliente, punto 7: Dashboards publicados (versión acotada)

- feat: el visor de dashboards HTML (`/view/[id]`) ahora muestra la fecha de la versión actual y, si existen versiones anteriores (Fase 3), un desplegable "Historial" para navegar a cada una.
- **No implementado a propósito, documentado como iniciativa aparte**: filtros interactivos, comparar períodos, exportar desde el dashboard. Esto requiere un constructor de dashboards real (motor de gráficos con binding a datos) — un proyecto propio, no un incremento chico. Construir una versión decorativa que no filtre/compare de verdad violaría el estándar de calidad del proyecto ("no funciones sin implementar"). Ver `docs/PENDIENTES.md`.
- Build verificado.

**Cierre de Capítulo 4 (Portal del Cliente)**: 6 de 7 puntos completos y verificados en producción (notificaciones, solicitudes, tareas, actividad reciente, página de inicio, perfil de empresa); el punto 7 queda parcialmente resuelto con una mejora honesta y acotada, más una iniciativa grande documentada para el constructor de dashboards real.

## 2026-07-15 — Flujo de Fondos interactivo (primer dashboard real con datos reales)

- feat: la pestaña "Flujo de Fondos" (Fase 2) ahora tiene selector de rango de período (desde/hasta) conectado a la API real (que ya soportaba estos parámetros desde su creación, nunca expuestos en la UI).
- feat: gráfico SVG real (sin dependencias externas) — barras de ingresos/egresos por mes + línea de saldo acumulado, con opacidad distinta para períodos reales vs. proyectados.
- feat: exportar CSV del rango visible.
- Reutiliza 100% datos reales de Contabilidad Interna del cliente (movimientos + presupuestos) — no es una maqueta ni un dato decorativo.
- Distinto del visor de "dashboards HTML subidos" (que sigue existiendo sin cambios) — este es el primer dashboard **nativo e interactivo** de la plataforma.
- Build verificado.

## 2026-07-15 — Fuentes de datos externas: Google Sheets (link público)

- feat: migración `bruck-migration-v22.sql` crea `public.data_sources` (organization_id, company_id, name, type, url) con RLS.
- feat: `lib/google-sheets.ts` — convierte un link normal de Google Sheets a su URL de exportación CSV y lo parsea (parser CSV propio, sin dependencias). No se guarda copia de las filas: se lee en vivo cada vez que se visualiza.
- feat: `GET/POST /api/admin/clients/[id]/data-sources` (conectar/listar), `GET/DELETE .../[sourceId]` (leer datos en vivo / eliminar). Equivalentes de solo lectura para el cliente en `/api/client/data-sources`.
- feat: sección "Fuentes de datos" en la ficha de cliente del admin (conectar por nombre + URL, ver como tabla, eliminar); vista "🔗 Fuentes de datos" en el sidebar del cliente (solo lectura).
- Si el Sheet no está compartido como "Cualquiera con el link puede ver", el sistema devuelve un error explícito en vez de fallar en silencio.
- Primer paso del "Centro de Datos" del documento funcional — hoy solo Google Sheets públicos; Excel/CSV/BD/ERP/API y sheets privados (OAuth) quedan documentados como pendientes.
- Build verificado.
