-- Migration v5: campo comentario en movimientos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.bruck_movimientos
  ADD COLUMN IF NOT EXISTS comentario text;
