-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v12
-- Conciliaciones bancarias formales (Contabilidad Interna)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
--
-- bruck_conciliaciones existe desde v3 pero nunca tuvo backend ni
-- UI -- lo único que existía era el flag suelto `estado` por
-- movimiento. Esta migración solo agrega la restricción que evita
-- cerrar dos veces el mismo período para la misma cuenta. La tabla
-- está vacía (nunca se usó), no hay riesgo de conflicto con datos
-- existentes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_conciliacion_periodo'
  ) THEN
    ALTER TABLE public.bruck_conciliaciones
      ADD CONSTRAINT uq_conciliacion_periodo UNIQUE (cuenta_bancaria_id, mes, anio);
  END IF;
END $$;

-- Verificación
SELECT count(*) AS conciliaciones_existentes FROM public.bruck_conciliaciones;
