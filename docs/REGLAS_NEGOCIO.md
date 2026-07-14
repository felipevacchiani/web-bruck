# Reglas de Negocio — BRUCK APP

_Última actualización: 2026-07-14_

## Alcance del producto

- BRUCK APP **no es** un ERP, sistema contable, CRM ni gestor documental de reemplazo. Centraliza información que otros sistemas ya generan.
- El único sistema a evolucionar es el portal (`portal.somosbruck.com`). La landing institucional (`somosbruck.com`) está **fuera de alcance**.
- No se desarrollan funcionalidades de IA salvo que el documento funcional las marque explícitamente como "evolución futura".

## Roles (estado actual)

- `admin`: equipo BRUCK. Gestiona clientes, sube documentos, administra Contabilidad Interna de cualquier cliente, ve auditoría y alertas.
- `client`: usuario de una empresa cliente. Ve solo sus propios archivos y su propia Contabilidad Interna.
- `profiles.active = false` bloquea el acceso completo, independientemente del rol.

No hay roles intermedios, equipos ni permisos por acción — cualquier admin puede todo, cualquier client solo lo suyo.

## Gestión documental

- Categorías fijas: `impuestos`, `financiero`, `legal`, `laboral`, `otro` (con subcategoría fiscal para impuestos: IVA, Ganancias, IIBB/SICREB, cargas 931).
- Estado de documento: `pendiente → visto → aprobado`.
- Los documentos pueden agruparse (`file_group_id`) para versionado simple, pero no hay versionado inmutable formal como describe el documento funcional.

## Contabilidad Interna

- Cada movimiento bancario importado se clasifica en una cuenta contable y un rubro, de forma manual o automática (`clasificacion_origen`), usando keywords configuradas en `bruck_cuentas_contables`.
- Deduplicación de importaciones vía `hash_dedup` — un movimiento no puede importarse dos veces con el mismo hash.
- Estados de movimiento: `pendiente → conciliado → revisado`.
- Este módulo es interno y de gestión — **no reemplaza** el sistema contable/impositivo real de la empresa cliente.

## Auditoría

- Toda acción relevante debe quedar registrada en `audit_logs` (usuario, acción, entidad, detalle, timestamp). Es de solo escritura desde la aplicación (vía `service_role`) y de solo lectura desde el panel admin.

## Seguridad

- El `service_role` de Supabase nunca se expone al browser — todo su uso es server-side (`lib/supabase/admin.ts`).
- Row Level Security activo en `profiles`, `files`, `audit_logs`. **Pendiente** en tablas `bruck_*` (ver [BASE_DATOS.md](./BASE_DATOS.md)).
