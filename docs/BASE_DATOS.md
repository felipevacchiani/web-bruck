# Modelo de Datos — BRUCK APP

_Última actualización: 2026-07-14_

No existe un esquema único consolidado: se reconstruye leyendo las migraciones incrementales aplicadas en orden (`migration.sql`, `bruck-migration-v2.sql` … `v6.sql`, `supabase-category-migration.sql`, `supabase-rls.sql`).

## Multi-tenant (Fase 1, en progreso)

### `organizations` (v7)
Un registro por consultor/tenant. Hoy solo existe una fila (`slug = 'bruck'`), sembrada por la migración. RLS: cualquier usuario autenticado puede leer, solo admin puede escribir.

Próximos pasos de esta fase (ver [ROADMAP.md](./ROADMAP.md)): `companies` (reemplaza `profiles.company` texto libre), `memberships` (usuario↔empresa↔rol), `permissions`/plantillas de rol. `profiles.role` se mantiene como fallback durante toda la transición — no se rompe nada de lo existente hasta que el middleware migre a chequear `memberships`.

## Tablas núcleo del portal

### `profiles`
Un registro por usuario autenticado (`id = auth.uid()`).
- `email`, `full_name`, `company`
- `role`: `'admin' | 'client'`
- `active`: boolean — si es `false`, el middleware bloquea el acceso.

RLS: cada usuario ve su propia fila; admin ve todas vía función `is_admin()`.

### `files`
Documentos subidos por cliente.
- `client_id` → `profiles.id`
- `category`: `'impuestos' | 'financiero' | 'legal' | 'laboral' | 'otro'`
- `tax_subcategory`: `'iva' | 'ganancias' | 'iibb_sicreb' | '931_sindicatos'`
- `storage_path`, `mime_type`, `file_size`
- `file_group_id`, `group_title`, `document_label` — agrupación/versionado simple (agregado en v2)
- `fiscal_month`, `fiscal_year`, `due_date`
- `doc_status`: `'pendiente' | 'visto' | 'aprobado'`

RLS: cliente ve solo `client_id = auth.uid()`; admin ve todo.

Storage: bucket `client-files` (privado), ampliado en `migration.sql` para aceptar cualquier mime type hasta 50MB (originalmente limitado a HTML).

### `audit_logs`
- `user_id`, `user_email`, `action`, `entity_type`, `entity_id`, `details` (jsonb), `created_at`.
- Solo inserción, vía `service_role`.

## Módulo Contabilidad Interna (prefijo `bruck_`)

### `bruck_rubros`
`client_id`, `nombre`, `categoria`: `'ingreso' | 'egreso' | 'neutro'`.

### `bruck_cuentas_bancarias`
`client_id`, `nombre`, `banco`, `numero_cuenta`, `tipo`: `'corriente' | 'ahorro' | 'caja_ahorro' | 'otro'`, `saldo_inicial`, `disponible` (agregado en v4).

### `bruck_cuentas_contables`
`client_id`, `nombre`, `tipo`: `'ingreso' | 'gasto' | 'neutro'`, `rubro_id` → `bruck_rubros`, `keywords` (usadas para auto-clasificación de movimientos importados).

### `bruck_movimientos`
`client_id`, `cuenta_bancaria_id` → `bruck_cuentas_bancarias`, `fecha`, `descripcion`, `debito`, `credito`, `mes`, `anio`, `estado`: `'pendiente' | 'conciliado' | 'revisado'`, `tipo_movimiento`: `'ingreso' | 'gasto' | 'transferencia'`, `cuenta_contable_id` → `bruck_cuentas_contables`, `rubro_id` → `bruck_rubros`, `clasificacion_origen`: `'manual' | 'automatico'`, `hash_dedup` (deduplicación de importaciones, v5), `comentario` (v5), `factura` boolean (v6).

### `bruck_conciliaciones`
`client_id`, `cuenta_bancaria_id`, `mes`, `anio`, `saldo_apertura`, `saldo_cierre`, `estado`, `fecha_cierre`, `observaciones`. Definida en el esquema pero sin UI/API completa de conciliación más allá del campo `estado` en movimientos.

## Brechas de seguridad conocidas

Las tablas `bruck_*` **no tienen RLS habilitado**. La protección de estos datos depende enteramente de `lib/supabase/ci-client-auth.ts`, que valida `client_id` a nivel de aplicación usando el cliente `service_role`. Si algún endpoint tiene un bug de scoping, no hay red de seguridad a nivel de base de datos. Ver [DECISIONES.md](./DECISIONES.md) para el registro de esta decisión pendiente.

## Multi-tenant

No existe tabla de organización/consultor intermedia. Todo está scopeado directamente por `client_id`, asumiendo un único consultor (BRUCK). Esto deberá revisarse si se avanza hacia el modelo multi-tenant del documento funcional.
