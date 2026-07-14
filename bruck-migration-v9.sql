-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v9
-- Fase 1, Paso 3: tabla memberships (base de multi-tenant)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- memberships permite que un usuario pertenezca a más de una
-- empresa (con un rol por membership), sin necesidad de cerrar
-- sesión para cambiar de empresa -- requisito del documento
-- funcional. Los admin (consultor) NO reciben membership por
-- empresa: siguen accediendo a todo vía profiles.role = 'admin'
-- + is_admin(), que ya cubre "ve todas las empresas de la
-- organización". Esto evita sobre-diseñar antes de necesitarlo.
--
-- No se toca profiles.role, middleware.ts ni las API routes en
-- este paso -- eso es el Paso 5.

-- 1. Tabla memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'cliente'
              CHECK (role IN ('cliente', 'auditor')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user    ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company  ON public.memberships(company_id);

-- 2. Backfill: una membership 'cliente' por cada profile role='client'
--    con su company_id ya asignado en el Paso 2.
INSERT INTO public.memberships (user_id, company_id, role)
SELECT id, company_id, 'cliente'
FROM public.profiles
WHERE role = 'client' AND company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- 3. RLS: admin todo; usuario ve solo sus propias memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all memberships" ON public.memberships;
DROP POLICY IF EXISTS "user read own memberships" ON public.memberships;

CREATE POLICY "admin all memberships"
ON public.memberships FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "user read own memberships"
ON public.memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Verificación: debería dar el mismo número de memberships que
--    de clients con company_id (11, según el Paso 2).
SELECT count(*) AS total_memberships FROM public.memberships;
