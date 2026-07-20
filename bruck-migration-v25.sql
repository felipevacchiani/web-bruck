-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v25
-- Informes personalizados: color elegible + contenido editable
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- body_html guarda el contenido "crudo" (sin la plantilla envolvente)
-- para poder editarlo y re-generar el HTML final sin perder el
-- original. accent_color permite elegir la paleta del informe en vez
-- de usar siempre el verde de BRUCK a secas (útil porque el portal es
-- multi-tenant: cada organización/consultora puede preferir otro tono).

ALTER TABLE public.custom_reports
  ADD COLUMN IF NOT EXISTS body_html text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#31AE79';

-- Verificación
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'custom_reports'
  AND column_name IN ('body_html','accent_color');
