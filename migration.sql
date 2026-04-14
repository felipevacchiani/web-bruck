-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN COMPLETA
-- Ejecutar en Supabase SQL Editor ANTES de deployar el código
-- ============================================================

-- 1. Nuevas columnas en tabla files
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS tax_subcategory text
    CHECK (tax_subcategory IN ('iva', 'ganancias', 'iibb_sicreb', '931_sindicatos')),
  ADD COLUMN IF NOT EXISTS file_group_id uuid,
  ADD COLUMN IF NOT EXISTS group_title text,
  ADD COLUMN IF NOT EXISTS document_label text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size bigint;

-- 2. Actualizar constraint de categoría
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_category_check;
ALTER TABLE public.files ADD CONSTRAINT files_category_check
  CHECK (category IN ('impuestos', 'financiero', 'legal', 'laboral', 'otro'));

-- 3. Rellenar file_group_id y group_title en filas existentes
UPDATE public.files SET file_group_id = id::uuid WHERE file_group_id IS NULL;
UPDATE public.files SET group_title = name WHERE group_title IS NULL;
UPDATE public.files SET document_label = name WHERE document_label IS NULL;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_files_group_id ON public.files(file_group_id);
CREATE INDEX IF NOT EXISTS idx_files_client_id ON public.files(client_id);

-- 5. Bucket: aceptar cualquier tipo de archivo y subir a 50MB
UPDATE storage.buckets
  SET allowed_mime_types = NULL,
      file_size_limit = 52428800
  WHERE id = 'client-files';

-- 6. Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'files'
ORDER BY ordinal_position;
