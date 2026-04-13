-- Migración: agregar columna category a la tabla files
-- Ejecutar en Supabase SQL Editor

-- 1. Crear el tipo ENUM para categorías
DO $$ BEGIN
  CREATE TYPE file_category AS ENUM ('financiero', 'tributario', 'laboral', 'otro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Agregar columna category a la tabla files
ALTER TABLE files
  ADD COLUMN IF NOT EXISTS category file_category DEFAULT 'financiero';

-- 3. Los archivos existentes quedan con category = 'financiero' por default
-- Si preferís null para archivos sin categoría:
-- ALTER TABLE files ALTER COLUMN category DROP DEFAULT;

-- Verificar:
-- SELECT id, name, category FROM files LIMIT 5;
