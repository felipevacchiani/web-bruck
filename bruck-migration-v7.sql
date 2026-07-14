-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v7
-- Fase 1, Paso 1: tabla organizations (base de multi-tenant)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Este paso solo CREA la tabla y sembra la organización "BRUCK".
-- No modifica profiles, files ni bruck_* todavía — no rompe nada
-- de lo existente. Los siguientes pasos (companies, memberships,
-- permissions) vincularán las tablas actuales a esta.

-- 1. Tabla organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. Seed: organización BRUCK (el único consultor actual)
INSERT INTO public.organizations (name, slug)
VALUES ('BRUCK', 'bruck')
ON CONFLICT (slug) DO NOTHING;

-- 3. RLS: solo admin puede gestionar organizaciones;
--    cualquier usuario autenticado puede leerlas (necesario
--    para resolver a qué organización pertenece su empresa).
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read organizations" ON public.organizations;
DROP POLICY IF EXISTS "admin all organizations" ON public.organizations;

CREATE POLICY "authenticated read organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin all organizations"
ON public.organizations FOR ALL
TO authenticated
USING (is_admin());

-- 4. Verificación
SELECT * FROM public.organizations;
