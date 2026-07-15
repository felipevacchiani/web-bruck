-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v22
-- Fuentes de datos externas (Google Sheets público)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Primer paso del "Centro de Datos" del documento funcional: conectar
-- un Google Sheet compartido públicamente ("cualquiera con el link")
-- como fuente de datos. No se guarda copia de las filas -- se lee en
-- vivo cada vez que se visualiza, siempre actualizado.

CREATE TABLE IF NOT EXISTS public.data_sources (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name             text NOT NULL,
  type             text NOT NULL DEFAULT 'google_sheet' CHECK (type IN ('google_sheet')),
  url              text NOT NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_company ON public.data_sources(company_id);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all data_sources" ON public.data_sources;
DROP POLICY IF EXISTS "client read own company data_sources" ON public.data_sources;

CREATE POLICY "admin all data_sources"
ON public.data_sources FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "client read own company data_sources"
ON public.data_sources FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Verificación
SELECT count(*) AS fuentes_existentes FROM public.data_sources;
