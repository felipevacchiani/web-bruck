-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v2
-- Ejecutar en Supabase SQL Editor
-- Agrega: audit_logs, índices y nuevas columnas
-- ============================================================

-- 1. Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  text,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  details     jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- 2. Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- 3. RLS en audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo el service role puede insertar (vía admin client en el servidor)

-- 4. Verificación
SELECT count(*) AS audit_logs_count FROM public.audit_logs;
