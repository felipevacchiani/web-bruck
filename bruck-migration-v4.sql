-- Migración v4: campo disponible en cuentas bancarias
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Agregar columna "disponible" a cuentas bancarias
ALTER TABLE public.bruck_cuentas_bancarias
  ADD COLUMN IF NOT EXISTS disponible numeric(14,2) NOT NULL DEFAULT 0;

-- Verificar
SELECT 'bruck_cuentas_bancarias columns' as info,
  column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bruck_cuentas_bancarias'
ORDER BY ordinal_position;
