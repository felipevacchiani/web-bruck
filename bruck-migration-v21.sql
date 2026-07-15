-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v21
-- Perfil de la empresa (Portal del Cliente, Capítulo 4)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- Amplía companies (ya existe desde Fase 1) con datos fiscales,
-- de contacto, societarios y sucursales. "logo_url" es una URL de
-- texto (no se construye upload de imagen en este paso -- se puede
-- pegar un link ya alojado). "Bancos" e "Integraciones" no se
-- agregan: bancos ya existe como bruck_cuentas_bancarias, e
-- integraciones no tiene ningún caso de uso real todavía.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cuit             text,
  ADD COLUMN IF NOT EXISTS razon_social     text,
  ADD COLUMN IF NOT EXISTS direccion        text,
  ADD COLUMN IF NOT EXISTS telefono         text,
  ADD COLUMN IF NOT EXISTS email_contacto   text,
  ADD COLUMN IF NOT EXISTS logo_url         text,
  ADD COLUMN IF NOT EXISTS info_societaria  text,
  ADD COLUMN IF NOT EXISTS sucursales       jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS responsables     jsonb NOT NULL DEFAULT '[]';

-- Verificación
SELECT count(*) AS empresas_totales FROM public.companies;
