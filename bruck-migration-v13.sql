-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v13
-- Presupuestos por rubro/mes/año (Contabilidad Interna)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bruck_presupuestos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  rubro_id    uuid NOT NULL REFERENCES public.bruck_rubros(id) ON DELETE CASCADE,
  mes         integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio        integer NOT NULL,
  monto       numeric(15,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (rubro_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_client  ON public.bruck_presupuestos(client_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_periodo  ON public.bruck_presupuestos(mes, anio);

-- RLS: mismo patrón que el resto de bruck_* (admin todo, cliente SELECT propio)
ALTER TABLE public.bruck_presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access presupuestos" ON public.bruck_presupuestos;
DROP POLICY IF EXISTS "Client own presupuestos" ON public.bruck_presupuestos;

CREATE POLICY "Admins full access presupuestos" ON public.bruck_presupuestos
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Client own presupuestos" ON public.bruck_presupuestos
  FOR SELECT USING (client_id = auth.uid());

-- Verificación
SELECT count(*) AS presupuestos_existentes FROM public.bruck_presupuestos;
