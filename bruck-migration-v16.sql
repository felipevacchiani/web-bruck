-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v16
-- Fase 4, Paso 1: base de multi-consultor real
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Agrega organization_id a profiles (backfill a "BRUCK") y permite
-- el rol 'super_admin' además de 'admin'/'client'. No cambia ningún
-- comportamiento todavía: nadie es super_admin aún, y ninguna ruta
-- filtra por organization_id -- eso son los próximos pasos.

-- 1. organization_id en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.profiles
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'bruck')
WHERE organization_id IS NULL;

-- 2. Permitir 'super_admin' en profiles.role. Se busca dinámicamente
--    el constraint existente (si lo hay) para no romper si el nombre
--    real difiere del esperado.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'profiles' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%role%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'client', 'super_admin'));
END $$;

-- 3. is_admin() se usa en casi todas las políticas RLS ("admin ve
--    todo"). Se amplía para incluir super_admin, así todas esas
--    políticas heredan el acceso automáticamente sin tocarlas una
--    por una.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role IN ('admin', 'super_admin') FROM profiles WHERE id = auth.uid()
$$;

-- 4. Promover la cuenta fundadora a super_admin (ve y administra
--    TODAS las organizaciones/consultores, no solo BRUCK).
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'felipevacchiani@gmail.com';

-- Verificación
SELECT role, count(*), count(*) FILTER (WHERE organization_id IS NOT NULL) AS con_org
FROM public.profiles GROUP BY role;
