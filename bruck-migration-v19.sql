-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v19
-- Centro de solicitudes (Portal del Cliente, Capítulo 4)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- El consultor pide un documento puntual a una empresa; el cliente
-- lo sube directamente desde la solicitud (que precarga categoría/
-- período fiscal) y queda marcada como completada automáticamente.

CREATE TABLE IF NOT EXISTS public.requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  category         text,
  tax_subcategory  text,
  fiscal_month     integer,
  fiscal_year      integer,
  due_date         date,
  status           text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completada')),
  file_id          uuid REFERENCES public.files(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  completed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_requests_company ON public.requests(company_id);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON public.requests(status);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all requests" ON public.requests;
DROP POLICY IF EXISTS "client read own company requests" ON public.requests;

CREATE POLICY "admin all requests"
ON public.requests FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "client read own company requests"
ON public.requests FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Verificación
SELECT count(*) AS solicitudes_existentes FROM public.requests;
