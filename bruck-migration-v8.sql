-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v8
-- Fase 1, Paso 2: tabla companies (base de multi-tenant)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Este paso crea la entidad "empresa" real (hoy cada cliente ES
-- implícitamente una empresa, representada solo por profiles.company
-- como texto libre). Se agrega company_id a profiles, files y bruck_*
-- como columna NULLABLE con backfill — no se toca profiles.company
-- (queda deprecado pero funcionando) ni el código de la app todavía.
-- Middleware y API routes migran a company_id recién en el Paso 5.

-- 1. Tabla companies
CREATE TABLE IF NOT EXISTS public.companies (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_org ON public.companies(organization_id);

-- 2. company_id en profiles (nullable: los admin no pertenecen a
--    una empresa, pertenecen a la organización)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- 3. Backfill: una company por cada profile con role = 'client',
--    usando profiles.company (texto) como nombre, o el email si
--    está vacío. Todas cuelgan de la organización BRUCK.
DO $$
DECLARE
  org_bruck_id uuid;
  p RECORD;
  new_company_id uuid;
BEGIN
  SELECT id INTO org_bruck_id FROM public.organizations WHERE slug = 'bruck';

  FOR p IN
    SELECT id, email, full_name, company
    FROM public.profiles
    WHERE role = 'client' AND company_id IS NULL
  LOOP
    INSERT INTO public.companies (organization_id, name)
    VALUES (org_bruck_id, COALESCE(NULLIF(p.company, ''), p.full_name, p.email))
    RETURNING id INTO new_company_id;

    UPDATE public.profiles SET company_id = new_company_id WHERE id = p.id;
  END LOOP;
END $$;

-- 4. company_id en files y bruck_* (nullable, backfill desde el
--    company_id ya asignado al profile del cliente dueño del dato)
ALTER TABLE public.files                     ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bruck_rubros              ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bruck_cuentas_bancarias   ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bruck_cuentas_contables   ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bruck_movimientos         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bruck_conciliaciones      ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

UPDATE public.files                   f SET company_id = p.company_id FROM public.profiles p WHERE f.client_id = p.id AND f.company_id IS NULL;
UPDATE public.bruck_rubros            t SET company_id = p.company_id FROM public.profiles p WHERE t.client_id = p.id AND t.company_id IS NULL;
UPDATE public.bruck_cuentas_bancarias t SET company_id = p.company_id FROM public.profiles p WHERE t.client_id = p.id AND t.company_id IS NULL;
UPDATE public.bruck_cuentas_contables t SET company_id = p.company_id FROM public.profiles p WHERE t.client_id = p.id AND t.company_id IS NULL;
UPDATE public.bruck_movimientos       t SET company_id = p.company_id FROM public.profiles p WHERE t.client_id = p.id AND t.company_id IS NULL;
UPDATE public.bruck_conciliaciones    t SET company_id = p.company_id FROM public.profiles p WHERE t.client_id = p.id AND t.company_id IS NULL;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_files_company        ON public.files(company_id);
CREATE INDEX IF NOT EXISTS idx_bruck_rubros_company  ON public.bruck_rubros(company_id);
CREATE INDEX IF NOT EXISTS idx_bruck_cb_company      ON public.bruck_cuentas_bancarias(company_id);
CREATE INDEX IF NOT EXISTS idx_bruck_cc_company      ON public.bruck_cuentas_contables(company_id);
CREATE INDEX IF NOT EXISTS idx_bruck_mov_company      ON public.bruck_movimientos(company_id);
CREATE INDEX IF NOT EXISTS idx_bruck_conc_company     ON public.bruck_conciliaciones(company_id);

-- 6. RLS en companies (admin todo; cliente lee solo su propia empresa)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all companies" ON public.companies;
DROP POLICY IF EXISTS "client read own company" ON public.companies;

CREATE POLICY "admin all companies"
ON public.companies FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "client read own company"
ON public.companies FOR SELECT
TO authenticated
USING (id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Verificación: cuántos profiles client quedaron sin company_id
--    (debería ser 0) y cuántas companies se crearon.
SELECT
  (SELECT count(*) FROM public.profiles WHERE role = 'client' AND company_id IS NULL) AS clients_sin_company,
  (SELECT count(*) FROM public.companies) AS total_companies;
