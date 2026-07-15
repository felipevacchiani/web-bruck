-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v17
-- Perfiles predefinidos (Director, Gerencia Administrativa,
-- Tesorería, Administración, Recursos Humanos)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Complementa "Cliente Estándar" y "Auditor" (v10) con los perfiles
-- que describe el documento funcional, aproximados a la granularidad
-- actual del sistema de permisos (módulo archivos/contabilidad ×
-- acción ver/crear/editar/eliminar). Diferenciar por categoría
-- dentro de un módulo (ej. "RRHH solo ve laboral") requeriría un
-- modelo de permisos más fino que no existe todavía -- queda como
-- limitación conocida, documentada en docs/PENDIENTES.md.
--
-- Se siembra para TODAS las organizaciones existentes.

DO $$
DECLARE
  org RECORD;
  tpl_id uuid;
  m text;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP

    -- Director: solo lectura
    INSERT INTO public.permission_templates (organization_id, name, description)
    VALUES (org.id, 'Director', 'Acceso de solo lectura a información estratégica: dashboards, reportes, documentación y contabilidad')
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO tpl_id;
    IF tpl_id IS NOT NULL THEN
      FOREACH m IN ARRAY ARRAY['archivos', 'contabilidad'] LOOP
        INSERT INTO public.permission_template_actions (template_id, module, action) VALUES (tpl_id, m, 'ver')
        ON CONFLICT (template_id, module, action) DO NOTHING;
      END LOOP;
    END IF;
    tpl_id := NULL;

    -- Gerencia Administrativa: acceso completo
    INSERT INTO public.permission_templates (organization_id, name, description)
    VALUES (org.id, 'Gerencia Administrativa', 'Acceso prácticamente completo: documentación, contabilidad, bancos')
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO tpl_id;
    IF tpl_id IS NOT NULL THEN
      FOREACH m IN ARRAY ARRAY['archivos', 'contabilidad'] LOOP
        INSERT INTO public.permission_template_actions (template_id, module, action)
        SELECT tpl_id, m, a FROM unnest(ARRAY['ver','crear','editar','eliminar']) a
        ON CONFLICT (template_id, module, action) DO NOTHING;
      END LOOP;
    END IF;
    tpl_id := NULL;

    -- Tesorería: contabilidad operativa sin eliminar, archivos solo lectura
    INSERT INTO public.permission_templates (organization_id, name, description)
    VALUES (org.id, 'Tesorería', 'Orientado al manejo financiero: registrar movimientos, conciliar cuentas, consultar bancos')
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO tpl_id;
    IF tpl_id IS NOT NULL THEN
      INSERT INTO public.permission_template_actions (template_id, module, action) VALUES (tpl_id, 'archivos', 'ver')
      ON CONFLICT (template_id, module, action) DO NOTHING;
      INSERT INTO public.permission_template_actions (template_id, module, action)
      SELECT tpl_id, 'contabilidad', a FROM unnest(ARRAY['ver','crear','editar']) a
      ON CONFLICT (template_id, module, action) DO NOTHING;
    END IF;
    tpl_id := NULL;

    -- Administración: operativo sin eliminar
    INSERT INTO public.permission_templates (organization_id, name, description)
    VALUES (org.id, 'Administración', 'Acceso operativo: cargar documentación, gestionar vencimientos, registrar movimientos')
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO tpl_id;
    IF tpl_id IS NOT NULL THEN
      FOREACH m IN ARRAY ARRAY['archivos', 'contabilidad'] LOOP
        INSERT INTO public.permission_template_actions (template_id, module, action)
        SELECT tpl_id, m, a FROM unnest(ARRAY['ver','crear','editar']) a
        ON CONFLICT (template_id, module, action) DO NOTHING;
      END LOOP;
    END IF;
    tpl_id := NULL;

    -- Recursos Humanos: solo archivos, sin contabilidad
    INSERT INTO public.permission_templates (organization_id, name, description)
    VALUES (org.id, 'Recursos Humanos', 'Acceso únicamente a información laboral; sin acceso a datos financieros')
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO tpl_id;
    IF tpl_id IS NOT NULL THEN
      INSERT INTO public.permission_template_actions (template_id, module, action) VALUES (tpl_id, 'archivos', 'ver')
      ON CONFLICT (template_id, module, action) DO NOTHING;
    END IF;
    tpl_id := NULL;

  END LOOP;
END $$;

-- Verificación
SELECT o.name AS organizacion, t.name AS plantilla, count(a.id) AS acciones
FROM public.organizations o
JOIN public.permission_templates t ON t.organization_id = o.id
LEFT JOIN public.permission_template_actions a ON a.template_id = t.id
GROUP BY o.name, t.name
ORDER BY o.name, t.name;
