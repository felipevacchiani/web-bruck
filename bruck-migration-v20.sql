-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v20
-- Centro de tareas (Portal del Cliente, Capítulo 4)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  source           text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'document_due', 'request', 'automation')),
  status           text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizada', 'no_aplica')),
  due_date         date,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company  ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON public.tasks(status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all tasks" ON public.tasks;
DROP POLICY IF EXISTS "user own tasks" ON public.tasks;

CREATE POLICY "admin all tasks"
ON public.tasks FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "user own tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Verificación
SELECT count(*) AS tareas_existentes FROM public.tasks;
