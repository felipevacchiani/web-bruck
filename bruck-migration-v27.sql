-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v27
-- audit_logs: agrega organization_id directo (antes el scoping por
-- organización se aproximaba en la app buscando los admins de la
-- org y filtrando user_id IN (...), lo cual se rompe si un admin
-- cambia de organización y no cubre acciones sin admin autor.
-- Ver docs/PENDIENTES.md.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Backfill de filas existentes a partir de la organización del
-- usuario que ejecutó la acción (aproximación igual a la que hacía
-- la app hasta ahora; filas con user_id null o sin organización
-- quedan en null).
UPDATE public.audit_logs al
SET organization_id = p.organization_id
FROM public.profiles p
WHERE al.user_id = p.id
  AND al.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON public.audit_logs(organization_id);

-- Verificación
SELECT count(*) AS total, count(organization_id) AS con_organizacion
FROM public.audit_logs;
