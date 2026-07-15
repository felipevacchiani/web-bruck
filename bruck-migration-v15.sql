-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v15
-- Versionado inmutable de archivos (Gestión Documental)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Subir una "nueva versión" de un documento crea una fila NUEVA
-- (nunca se sobreescribe ni se borra la anterior). La fila vieja
-- queda con is_current = false y sigue siendo descargable desde
-- el historial. El listado principal muestra solo is_current = true.

ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS previous_version_id uuid REFERENCES public.files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_files_is_current ON public.files(is_current);

-- Verificación
SELECT count(*) AS archivos_totales, count(*) FILTER (WHERE is_current) AS vigentes
FROM public.files;
