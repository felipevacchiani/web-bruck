-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v18
-- Centro de notificaciones (Portal del Cliente, Capítulo 4)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'dashboard_published', 'document_approved', 'document_rejected',
                'new_task', 'task_updated', 'request_created', 'request_completed',
                'dashboard_updated', 'consultant_comment'
              )),
  title       text NOT NULL,
  message     text,
  link        text,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user own notifications" ON public.notifications;
DROP POLICY IF EXISTS "user update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "admin all notifications" ON public.notifications;

CREATE POLICY "user own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin all notifications"
ON public.notifications FOR ALL
TO authenticated
USING (is_admin());

-- Verificación
SELECT count(*) AS notificaciones_existentes FROM public.notifications;
