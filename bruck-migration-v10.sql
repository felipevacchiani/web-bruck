-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v10
-- Fase 1, Paso 4: catálogo de permisos y plantillas de rol
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Este paso SOLO crea el catálogo de permisos granulares por
-- módulo/acción y dos plantillas reutilizables de ejemplo. No se
-- aplica todavía en middleware.ts ni en ninguna API route -- eso
-- es el Paso 5, cuando se decide cómo asignar una plantilla a
-- cada membership y hacerla cumplir.

-- 1. Plantillas de permisos (reutilizables dentro de una organización)
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (organization_id, name)
);

-- 2. Permisos granulares por plantilla: un módulo + una acción =
--    una fila = permiso concedido. Módulos y acciones acotados a
--    lo que hoy existe en la app (se amplía cuando se agreguen
--    módulos nuevos).
CREATE TABLE IF NOT EXISTS public.permission_template_actions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id  uuid NOT NULL REFERENCES public.permission_templates(id) ON DELETE CASCADE,
  module       text NOT NULL CHECK (module IN ('archivos', 'contabilidad')),
  action       text NOT NULL CHECK (action IN ('ver', 'crear', 'editar', 'eliminar')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (template_id, module, action)
);

CREATE INDEX IF NOT EXISTS idx_pta_template ON public.permission_template_actions(template_id);

-- 3. Seed: dos plantillas equivalentes al comportamiento actual
--    del rol 'client', para no cambiar nada de lo que ya funciona
--    cuando esto se empiece a aplicar en el Paso 5.
DO $$
DECLARE
  org_bruck_id uuid;
  tpl_estandar_id uuid;
  tpl_auditor_id uuid;
  m text;
BEGIN
  SELECT id INTO org_bruck_id FROM public.organizations WHERE slug = 'bruck';

  INSERT INTO public.permission_templates (organization_id, name, description)
  VALUES (org_bruck_id, 'Cliente Estándar', 'Acceso completo a sus propios archivos y contabilidad interna (equivalente al rol client actual)')
  ON CONFLICT (organization_id, name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO tpl_estandar_id;

  INSERT INTO public.permission_templates (organization_id, name, description)
  VALUES (org_bruck_id, 'Auditor', 'Solo lectura de archivos y contabilidad interna, sin capacidad de modificar datos')
  ON CONFLICT (organization_id, name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO tpl_auditor_id;

  FOREACH m IN ARRAY ARRAY['archivos', 'contabilidad'] LOOP
    INSERT INTO public.permission_template_actions (template_id, module, action)
    VALUES
      (tpl_estandar_id, m, 'ver'),
      (tpl_estandar_id, m, 'crear'),
      (tpl_estandar_id, m, 'editar'),
      (tpl_estandar_id, m, 'eliminar'),
      (tpl_auditor_id,  m, 'ver')
    ON CONFLICT (template_id, module, action) DO NOTHING;
  END LOOP;
END $$;

-- 4. RLS: solo admin gestiona plantillas y permisos (aún no se
--    leen desde el rol client en ningún lado)
ALTER TABLE public.permission_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_template_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all permission_templates" ON public.permission_templates;
DROP POLICY IF EXISTS "admin all permission_template_actions" ON public.permission_template_actions;

CREATE POLICY "admin all permission_templates"
ON public.permission_templates FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "admin all permission_template_actions"
ON public.permission_template_actions FOR ALL
TO authenticated
USING (is_admin());

-- 5. Verificación
SELECT t.name, count(a.id) AS acciones
FROM public.permission_templates t
LEFT JOIN public.permission_template_actions a ON a.template_id = t.id
GROUP BY t.name
ORDER BY t.name;
