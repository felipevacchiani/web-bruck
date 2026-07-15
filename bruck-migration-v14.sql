-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v14
-- Etiquetas libres en archivos (Gestión Documental)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Complementa (no reemplaza) la categoría fija existente (files.category).
-- Permite etiquetar libremente cada documento para búsqueda/filtro propio
-- del cliente, sin tocar el modelo de categorías fijas.

ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN (tags);

-- Verificación
SELECT count(*) AS archivos_totales, count(*) FILTER (WHERE array_length(tags,1) > 0) AS con_etiquetas
FROM public.files;
