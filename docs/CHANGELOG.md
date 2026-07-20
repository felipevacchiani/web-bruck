# Changelog — BRUCK APP

## 2026-07-20 — Informes personalizados: editor visual (WYSIWYG) en vez de HTML crudo

- fix: "Editar contenido" mostraba el HTML crudo en un textarea monoespaciado — poco intuitivo para uso no técnico. Ahora es un editor visual (`contentEditable`) que se ve con el mismo diseño del informe final (`bodyContentCss()` factorizado en `lib/report-template.ts`, compartido entre la plantilla real y el editor).
- feat: barra de formato básica (Negrita, Título de sección, Párrafo, Lista) además de las herramientas existentes (convertir selección en tabla, insertar gráfico, detectar títulos), todo operando directo sobre el documento visual en vez de sobre texto con etiquetas.
- fix: al alternar entre "Vista previa" y "Editar contenido" ya no se pierden los cambios sin guardar — el editor queda montado siempre (oculto con `display:none` en vez de desmontarse).
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-20 — Informes personalizados: detección de títulos + gráficos insertables

- fix: `lib/report-format.ts` (`promoteBoldNumberedHeadings`) — muchos Word no usan los estilos "Heading" de Word sino texto en negrita con numeración manual ("1. Objetivo", "2) Alcance"); antes esto quedaba como una sola masa de párrafos sin jerarquía. Ahora se detecta ese patrón (regex sobre el HTML, determinístico) y se separa en un `<h2>` real + el resto del párrafo. Se aplica automáticamente al parsear un Word nuevo, y hay un botón "🔧 Detectar títulos" en "Editar contenido" para aplicarlo a informes ya creados.
- feat: `lib/report-charts.ts` — genera un `<svg>` estático (barras/línea/torta) a partir de filas "etiqueta, valor" pegadas a mano. Botón "📊 Insertar gráfico" en el modo "Editar contenido": elegís tipo, pegás los datos, se inserta en la posición del cursor.
- Verificado generando un informe de muestra con `tsx` (títulos detectados + gráfico de barras) y revisado como Artifact antes de aplicar el cambio.
- Sin migración: usa las columnas `body_html`/`accent_color` ya agregadas en la v25.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-20 — Informes personalizados: paleta de color, contenido editable y nombre de organización real

- feat: migración `bruck-migration-v25.sql` agrega `body_html` (contenido crudo, sin la plantilla envolvente — permite editar y re-generar sin perder el original) y `accent_color` a `custom_reports`.
- feat: `lib/report-colors.ts` — paleta de 8 colores (`REPORT_PALETTE`) y `deriveReportTheme()` que calcula tonos claro/oscuro del color elegido para el degradado del header, bordes y tintes de tabla.
- feat: selector de color (círculos de paleta) al crear un informe y también dentro de la vista previa, para cambiarlo sin tener que recrear el informe.
- feat: modo "Editar contenido" en la vista previa — textarea con el HTML crudo y un botón "Convertir selección en tabla": tomás líneas separadas por coma/punto y coma/tab (primera línea = encabezados) y las convierte en una tabla HTML real, insertada en el lugar de la selección.
- fix: el header y el pie del informe decían "BRUCK" fijo — ahora usan el nombre real de la organización dueña del cliente (`organizations.name`), importante porque el portal es multi-tenant y otras consultoras usan el mismo sistema.
- Verificado generando informes de muestra con `tsx` (color azul + nombre de organización distinto) y revisándolos como Artifact antes de aplicar el cambio.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-20 — Informes personalizados: plantilla HTML mucho más "pro"

- feat: `lib/report-template.ts` rediseñado — página "papel" blanca centrada con sombra sobre fondo gris cálido (efecto documento), header con degradado verde oscuro + glow radial + logo BRUCK, tablas presentadas como tarjetas con encabezado degradado y filas alternadas, imágenes con sombra, footer con marca.
- feat: índice de contenidos automático — se generan anchors (`id`) sobre los `<h1>`/`<h2>` reales del documento y se arma un menú "Contenido" con links, solo cuando hay 2 o más secciones (no se inventa texto, se reutiliza el de los propios títulos).
- Verificado generando un informe de muestra con `tsx` y revisándolo como Artifact antes de aplicar el cambio.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-20 — Informes personalizados (Google Sheets / Word → HTML con diseño BRUCK)

- feat: migración `bruck-migration-v24.sql` crea `custom_reports` (organization_id, company_id, created_by, title, client_display_name, source_type, source_ref, html_content, status borrador/publicado, published_at). RLS: admin todo vía `is_admin()`, cliente solo lee sus publicados.
- feat: `lib/word-to-html.ts` — parsea un `.docx` a HTML semántico con `mammoth` (títulos, párrafos, listas, tablas, imágenes embebidas como data URI), sin IA, mapeo determinístico de estilos de Word.
- feat: `lib/report-template.ts` — envuelve el contenido parseado (de Word o de un Google Sheet) en una plantilla HTML con la identidad visual BRUCK (header con degradado verde oscuro, tipografía, tablas, responsive).
- feat: `POST /api/admin/clients/[id]/custom-reports` (crear, acepta Sheet o archivo .docx), `PATCH .../[reportId]` (editar título/nombre de cliente, regenerar desde el Sheet origen, publicar/despublicar), `GET/DELETE` correspondientes. Lado cliente: `GET /api/client/custom-reports` y `[reportId]` (solo lectura, solo publicados).
- feat: sección "Informes personalizados" en la ficha de cliente del admin (crear informe eligiendo Sheet o Word, vista previa en iframe, editar título/cliente, regenerar, publicar/despronunciar, eliminar) y en el portal del cliente, dentro del grupo "Informes" del sidebar (solo lectura, lista de informes publicados).
- Decisión de arquitectura: módulo nuevo y separado de "Fuentes de datos" (que sigue existiendo tal cual, para lectura en vivo de Sheets como tabla/gráfico) — confirmado con el usuario en vez de evolucionar `data_sources`, porque la funcionalidad (Word, HTML generado una vez, borrador/publicado, vista previa) es sustancialmente distinta.
- fix (de paso): varias tarjetas de `client-detail.tsx` y el header standalone de `contabilidad-panel.tsx` tenían un fondo oscuro semitransparente (`rgba(18,23,20,0.5)`) que había quedado mal convertido en la Fase C del rediseño — corregido a fondo blanco con sombra leve, consistente con el resto del panel.
- Build y typecheck verificados, sin errores nuevos.
- Pendiente de que el usuario corra `bruck-migration-v24.sql` en Supabase antes de probar.

## 2026-07-17 — Rediseño de identidad BRUCK: Fase D (resto de páginas admin) — cierre del rediseño

- feat: migrados a la paleta clara los últimos 7 archivos con estilos hardcodeados: `app/admin/page.tsx` (dashboard principal), `app/admin/organizaciones/organizaciones-panel.tsx`, `app/admin/auditoria/page.tsx`, `app/admin/alertas/page.tsx`, `app/admin/reportes/page.tsx`, `app/admin/clients/new/page.tsx` (alta de cliente) y `app/view/[id]/file-viewer.tsx` (visor de documentos).
- Mismo mapeo de tokens y mismo ajuste de contraste (tarjetas a fondo blanco sólido + sombra leve, bordes más definidos) aplicado en las fases B y C.
- **Con esto se cierra el rediseño de identidad BRUCK**: todas las pantallas del portal (cliente y admin) usan ahora la combinación clara de la guía de marca (fondo crema, tarjetas blancas, texto oscuro, verde `#31AE79` como acento) y tipografía Geist. Quedan fuera de alcance, sin pedido explícito: dark mode real (alternable), y refinamientos puntuales de espaciado/tipografía a escala completa de la guía (tamaños de título de portada, hero, etc. — no aplican a un panel interno de gestión).
- Build y typecheck verificados en las 4 fases, sin errores nuevos (solo baseline preexistente documentado en `PENDIENTES.md`).

## 2026-07-17 — Login: layout split-screen con foto real de oficina BRUCK

- feat: `app/login/page.tsx` rediseñado como split-screen (mockup provisto por el usuario): panel izquierdo con foto real de la oficina BRUCK (`public/login-hero.png`) + overlay oscuro + titular "Optimizamos tu trabajo." y tagline; panel derecho con el formulario de login sobre fondo crema, sin tarjeta flotante. En mobile (`max-width:860px`) el panel de la foto se oculta y solo queda el formulario.
- Imagen agregada a `public/` (nuevo directorio del proyecto) para que Next.js la sirva como asset estático.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-17 — Rediseño de identidad BRUCK: Fase C (Panel del Admin)

- feat: `app/admin/clients/[id]/contabilidad/contabilidad-panel.tsx` (205 colores, compartido entre la ficha de cliente del admin y la pestaña "Contabilidad" del portal del cliente) y `app/admin/clients/[id]/client-detail.tsx` (ficha de cliente completa: archivos, solicitudes, tareas, usuarios, perfil de empresa, fuentes de datos) migrados a la paleta clara de la guía, mismo mapeo de tokens que la Fase B.
- fix: al migrar `contabilidad-panel.tsx` se resuelve también el gap que había quedado abierto en la Fase B — las pestañas de Contabilidad Interna dentro del portal del cliente ("Movimientos", "Bancos", etc.) ahora se ven en tema claro porque reutilizan este mismo componente.
- Constantes compartidas `INP`/`SEL`/`LBL`/`BTN_P`/`BTN_S` actualizadas en ambos archivos: inputs blancos con borde sutil, botón primario verde con texto oscuro y bordes pill (era `borderRadius:9`), botón secundario con fondo gris clarísimo.
- Tarjetas con fondo casi transparente (pensadas para resaltar sobre fondo negro) pasaron a fondo blanco sólido + sombra leve + borde más definido, mismo ajuste de contraste aplicado en la Fase B tras el feedback del usuario.
- Build y typecheck verificados, sin errores nuevos (solo los preexistentes de baseline: `Set<T>` iteration en `client-detail.tsx` y un error de tipos en `contabilidad-panel.tsx` no relacionado con este cambio).
- Pendiente: Fase D (resto de páginas admin — dashboard principal, organizaciones, auditoría, alertas, reportes, alta de cliente, visor de archivos).

## 2026-07-17 — Rediseño de identidad BRUCK: Fase B (Login + Portal del Cliente)

- feat: `app/login/page.tsx` y `app/reset-password/page.tsx` reescritos con la combinación clara de la guía (fondo crema `#F3EFE5`, tarjeta blanca, texto oscuro `#121714`, botón verde con texto oscuro y bordes pill en vez de 12px).
- feat: `app/dashboard/client-dashboard.tsx` (portal del cliente completo: home, informes, solicitudes, tareas, actividad, mi empresa, fuentes de datos) migrado a la misma paleta clara — sidebar pasó de negro sólido a blanco cálido `#F8F7F2` con borde sutil, texto/bordes remapeados de la escala oscura (`rgba(255,255,255,X)`, grises claros) a la escala clara (`rgba(18,23,20,X)`, grises oscuros de la guía).
- Mapeo de colores aplicado (ver `lib/ui/theme.ts` para los tokens): `#71717a`→`#4E5651`, `#52525b`→`#858C87`, `#a1a1aa`→`#4E5651`, `#d4d4d8`→`#121714`, `#3f3f46`→`#858C87`, fondos/bordes `rgba(255,255,255,*)`→`rgba(18,23,20,*)` equivalentes, `#0d0d0d`/`#080808`→blanco/crema. El verde `#31AE79` y los colores de estado (amarillo/rojo/azul/verde de acento) se mantuvieron sin cambios.
- **Gap conocido, no resuelto en esta fase:** las pestañas de "Contabilidad Interna" dentro del portal del cliente (Dashboard, Movimientos, Bancos, etc.) siguen renderizando con la paleta oscura anterior — reutilizan `contabilidad-panel.tsx`, que es un componente **compartido con la ficha de cliente del admin** (Fase C). Reskinearlo ahora hubiera mezclado el alcance de las dos fases; queda para la Fase C, momento en que se actualiza una sola vez y beneficia a ambos lados.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-17 — Rediseño de identidad BRUCK: Fase A (tokens + tipografía base)

- feat: instalada tipografía Geist Sans/Geist Mono (paquete `geist`) vía `app/layout.tsx`.
- feat: `lib/ui/theme.ts` — objeto TS con toda la paleta de la guía de marca (verdes, fondos, cremas, textos, bordes, error/warning, radios).
- feat: `app/globals.css` — variables CSS (`:root`) con la misma paleta; fondo/texto base del `body` ahora usan `var(--background-primary)` (`#090B0A`) y `var(--text-primary)` (`#F5F5F2`) en vez del negro/blanco puro anteriores; inputs y scrollbar actualizados a los nuevos tokens.
- feat: `tailwind.config.js` extendido con la paleta completa y `fontFamily` (queda preparado pero inerte: el proyecto no tiene `postcss.config.js`, así que Tailwind nunca se compiló — ver `docs/DECISIONES.md`).
- Alcance: esta fase es solo la base (fuente + tokens + fondo global). El resto de las pantallas (login, portal del cliente, panel admin) todavía usan sus colores hardcodeados anteriores — se van a migrar en las próximas fases (B/C/D), cada una verificada en el navegador antes de seguir.
- Build y typecheck verificados, sin errores nuevos.

## 2026-07-17 — Configuración de gráfico: tipo (barras/línea/torta) y columnas elegibles por el admin

- feat: migración `bruck-migration-v23.sql` agrega `chart_type`, `chart_label_col`, `chart_value_col` a `data_sources` (nullable — si quedan vacíos se mantiene la detección automática anterior).
- feat: `PATCH /api/admin/clients/[id]/data-sources/[sourceId]` guarda la configuración.
- feat: botón "⚙ Configurar" dentro de la vista "Gráfico" (solo admin) — permite elegir tipo de gráfico (Barras/Línea/Torta) y qué columna usar como etiqueta y como valor, en vez de depender de la detección automática de la primera columna numérica.
- feat: nuevo tipo de gráfico Torta (SVG con arcos calculados a mano) y Línea (path + puntos), reutilizando el mismo patrón sin librerías externas. `ChartRender` centraliza el renderizado de los 3 tipos, usado tanto en la ficha de cliente del admin como en el portal del cliente (que solo lee la configuración guardada, no la edita).
- Build y typecheck verificados, sin errores nuevos.
- Pendiente: usuario debe correr `bruck-migration-v23.sql` en Supabase antes de que la configuración persista (sin la migración, el PATCH falla con error de columna inexistente).

## 2026-07-17 — Fix: campo "Hoja" ahora acepta el nombre de la pestaña, no el gid

- fix: el campo "Hoja" pedía el número de gid (poco usable, requería mirar la URL de cada pestaña); ahora acepta directamente el nombre de la hoja tal como aparece en Google Sheets (ej. "Hoja 2"). Internamente usa el endpoint público `gviz/tq?tqx=out:csv&sheet=NOMBRE` de Google en vez de `export?format=csv&gid=N` cuando se especifica un nombre.
- `lib/google-sheets.ts`: `parseSheetUrl` reconoce un marcador `bruckSheet=` en la URL guardada; `fetchGoogleSheetData` elige el endpoint según haya nombre de hoja o gid numérico.
- Nota: la fuente "prueba 2" creada antes de este fix quedó con un gid inválido (el nombre "Hoja 2" no matcheaba el patrón numérico) — hay que borrarla y volver a conectarla.
- Build y typecheck verificados, sin errores nuevos.

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
