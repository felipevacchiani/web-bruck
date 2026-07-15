# Reglas de Negocio — BRUCK APP

_Última actualización: 2026-07-14_

## Alcance del producto

- BRUCK APP **no es** un ERP, sistema contable, CRM ni gestor documental de reemplazo. Centraliza información que otros sistemas ya generan.
- El único sistema a evolucionar es el portal (`portal.somosbruck.com`). La landing institucional (`somosbruck.com`) está **fuera de alcance**.
- No se desarrollan funcionalidades de IA salvo que el documento funcional las marque explícitamente como "evolución futura".

## Roles (estado actual, desde Fase 4)

- `super_admin`: equipo BRUCK/dueño de la plataforma. Ve y administra **todas** las organizaciones (consultores). Crea organizaciones nuevas desde `/admin/organizaciones`. Hoy solo `felipevacchiani@gmail.com`.
- `admin` (consultor/líder): gestiona clientes, sube documentos, administra Contabilidad Interna — pero **solo de las empresas de su propia organización**. No ve ni puede tocar datos de otro consultor.
- `client`: usuario de una empresa cliente. Ve solo sus propios archivos y su propia Contabilidad Interna, según la plantilla de permisos de su `membership`.
- `profiles.active = false` bloquea el acceso completo, independientemente del rol.

Modelo de 4 niveles: BRUCK APP → Super Admin → Consultor (organización) → Empresas → Usuarios. Dentro de una organización no hay roles intermedios ni equipos todavía — cualquier `admin` de esa organización puede todo dentro de ella, cualquier `client` solo lo suyo (matizado por permisos granulares, ver Fase 1).

## Gestión documental

- Categorías fijas: `impuestos`, `financiero`, `legal`, `laboral`, `otro` (con subcategoría fiscal para impuestos: IVA, Ganancias, IIBB/SICREB, cargas 931).
- Estado de documento: `pendiente → visto → aprobado`.
- Los documentos pueden agruparse (`file_group_id`, agrupación de varios archivos subidos juntos) y además tienen versionado inmutable formal (`version`/`is_current`/`previous_version_id`, Fase 3): subir una nueva versión nunca borra ni sobreescribe la anterior.
- Etiquetas libres (`tags`) complementan la categoría fija para búsqueda/filtro propio del cliente.

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
