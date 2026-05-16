-- Migration v6: campo factura en movimientos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.bruck_movimientos
  ADD COLUMN IF NOT EXISTS factura boolean NOT NULL DEFAULT false;
