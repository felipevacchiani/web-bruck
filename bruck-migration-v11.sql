-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v11
-- Fase 1, Paso 5a: asignar plantilla de permisos a memberships
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Agrega permission_template_id a memberships (nullable) y
-- backfillea todas las memberships existentes con "Cliente
-- Estándar" -- el equivalente exacto al comportamiento actual,
-- para que nada cambie hasta que el admin decida reasignar
-- alguna a "Auditor" desde la nueva UI.
--
-- Esto todavía NO se aplica en middleware.ts ni en las API routes
-- de Contabilidad Interna / archivos -- solo se hace visible y
-- editable desde la ficha de cliente en el admin.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS permission_template_id uuid REFERENCES public.permission_templates(id) ON DELETE SET NULL;

UPDATE public.memberships m
SET permission_template_id = pt.id
FROM public.companies c
JOIN public.permission_templates pt ON pt.organization_id = c.organization_id AND pt.name = 'Cliente Estándar'
WHERE m.company_id = c.id AND m.permission_template_id IS NULL;

-- Verificación: debería dar 0 memberships sin plantilla
SELECT count(*) AS memberships_sin_plantilla FROM public.memberships WHERE permission_template_id IS NULL;
