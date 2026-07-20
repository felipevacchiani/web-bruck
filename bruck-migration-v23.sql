-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v23
-- Configuración de gráfico por fuente de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Permite al admin elegir el tipo de gráfico (barras/línea/torta) y
-- qué columnas usar como etiqueta y valor, en vez de la detección
-- automática. Si quedan en null, se mantiene el comportamiento
-- anterior (detección automática de la primera columna numérica).

ALTER TABLE public.data_sources
  ADD COLUMN IF NOT EXISTS chart_type text CHECK (chart_type IN ('barras','linea','torta')),
  ADD COLUMN IF NOT EXISTS chart_label_col integer,
  ADD COLUMN IF NOT EXISTS chart_value_col integer;

-- Verificación
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'data_sources'
  AND column_name IN ('chart_type','chart_label_col','chart_value_col');
