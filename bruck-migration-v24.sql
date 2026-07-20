-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v24
-- Informes personalizados (Google Sheets / Word -> HTML con diseño BRUCK)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Módulo nuevo y separado de "Fuentes de datos" (data_sources, que
-- sigue existiendo para lectura en vivo de Sheets como tabla/gráfico).
-- Acá el resultado es un informe HTML generado una vez a partir de un
-- Google Sheet o un documento Word, con borrador/publicado y vista
-- previa antes de mostrarlo al cliente.

CREATE TABLE IF NOT EXISTS public.custom_reports (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id           uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title                text NOT NULL,
  client_display_name  text,
  source_type          text NOT NULL CHECK (source_type IN ('google_sheet','word_docx')),
  source_ref           text,
  html_content         text NOT NULL,
  status               text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador','publicado')),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  published_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_company ON public.custom_reports(company_id);

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all custom_reports" ON public.custom_reports;
DROP POLICY IF EXISTS "client read published custom_reports" ON public.custom_reports;

CREATE POLICY "admin all custom_reports"
ON public.custom_reports FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "client read published custom_reports"
ON public.custom_reports FOR SELECT
TO authenticated
USING (
  status = 'publicado'
  AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Verificación
SELECT count(*) AS informes_existentes FROM public.custom_reports;
