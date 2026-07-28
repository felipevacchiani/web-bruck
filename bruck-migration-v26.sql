-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v26
-- RLS: políticas de INSERT/UPDATE/DELETE para clientes en bruck_*
-- Hasta ahora estas tablas solo tenían SELECT vía RLS para clientes
-- (ver docs/PENDIENTES.md); la escritura dependía únicamente del
-- enforcement a nivel de aplicación en lib/supabase/ci-client-auth.ts.
-- Esto agrega una red de seguridad a nivel de base de datos para el
-- caso en que una API route tuviera un bug de scoping. No reemplaza
-- ni interactúa con el chequeo de plantillas de permisos (crear/
-- editar/eliminar), que sigue viviendo en la capa de aplicación --
-- las rutas de API siempre escriben vía service_role (bypassa RLS).
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'bruck_rubros',
    'bruck_cuentas_bancarias',
    'bruck_cuentas_contables',
    'bruck_movimientos',
    'bruck_conciliaciones',
    'bruck_presupuestos'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Client insert own %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Client update own %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Client delete own %s" ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY "Client insert own %s" ON public.%I FOR INSERT WITH CHECK (client_id = auth.uid())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Client update own %s" ON public.%I FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Client delete own %s" ON public.%I FOR DELETE USING (client_id = auth.uid())',
      t, t
    );
  END LOOP;
END $$;

-- Verificación: listar todas las políticas resultantes por tabla
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'bruck_%'
ORDER BY tablename, cmd;
