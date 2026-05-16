-- ============================================================
-- BRUCK PORTAL — MIGRACIÓN v3
-- Módulo: Contabilidad Interna por cliente
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Rubros contables
CREATE TABLE IF NOT EXISTS public.bruck_rubros (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  categoria   text NOT NULL DEFAULT 'egreso'
              CHECK (categoria IN ('ingreso', 'egreso', 'neutro')),
  estado      text NOT NULL DEFAULT 'activo'
              CHECK (estado IN ('activo', 'inactivo')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. Cuentas bancarias
CREATE TABLE IF NOT EXISTS public.bruck_cuentas_bancarias (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  banco          text,
  numero_cuenta  text,
  tipo           text NOT NULL DEFAULT 'corriente'
                 CHECK (tipo IN ('corriente', 'ahorro', 'caja_ahorro', 'otro')),
  saldo_inicial  numeric(15,2) DEFAULT 0,
  estado         text NOT NULL DEFAULT 'activa'
                 CHECK (estado IN ('activa', 'inactiva')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- 3. Cuentas contables (vinculadas a rubros, con keywords para auto-clasificación)
CREATE TABLE IF NOT EXISTS public.bruck_cuentas_contables (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  tipo        text NOT NULL DEFAULT 'gasto'
              CHECK (tipo IN ('ingreso', 'gasto', 'neutro')),
  rubro_id    uuid REFERENCES public.bruck_rubros(id) ON DELETE SET NULL,
  keywords    text DEFAULT '[]',
  estado      text NOT NULL DEFAULT 'activa'
              CHECK (estado IN ('activa', 'inactiva')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 4. Movimientos bancarios
CREATE TABLE IF NOT EXISTS public.bruck_movimientos (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuenta_bancaria_id    uuid REFERENCES public.bruck_cuentas_bancarias(id) ON DELETE SET NULL,
  fecha                 date NOT NULL,
  descripcion           text NOT NULL,
  debito                numeric(15,2) DEFAULT 0,
  credito               numeric(15,2) DEFAULT 0,
  mes                   integer,
  anio                  integer,
  estado                text NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'conciliado', 'revisado')),
  tipo_movimiento       text DEFAULT 'gasto'
                        CHECK (tipo_movimiento IN ('ingreso', 'gasto', 'transferencia')),
  cuenta_contable_id    uuid REFERENCES public.bruck_cuentas_contables(id) ON DELETE SET NULL,
  rubro_id              uuid REFERENCES public.bruck_rubros(id) ON DELETE SET NULL,
  clasificacion_origen  text DEFAULT 'manual'
                        CHECK (clasificacion_origen IN ('manual', 'automatico')),
  hash_dedup            text UNIQUE,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- 5. Conciliaciones cerradas
CREATE TABLE IF NOT EXISTS public.bruck_conciliaciones (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuenta_bancaria_id uuid REFERENCES public.bruck_cuentas_bancarias(id) ON DELETE SET NULL,
  mes                integer NOT NULL,
  anio               integer NOT NULL,
  saldo_apertura     numeric(15,2) DEFAULT 0,
  saldo_cierre       numeric(15,2) DEFAULT 0,
  estado             text NOT NULL DEFAULT 'abierto'
                     CHECK (estado IN ('abierto', 'cerrado')),
  fecha_cierre       date,
  observaciones      text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_bruck_rubros_client          ON public.bruck_rubros(client_id);
CREATE INDEX IF NOT EXISTS idx_bruck_cb_client              ON public.bruck_cuentas_bancarias(client_id);
CREATE INDEX IF NOT EXISTS idx_bruck_cc_client              ON public.bruck_cuentas_contables(client_id);
CREATE INDEX IF NOT EXISTS idx_bruck_mov_client             ON public.bruck_movimientos(client_id);
CREATE INDEX IF NOT EXISTS idx_bruck_mov_fecha              ON public.bruck_movimientos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bruck_mov_estado             ON public.bruck_movimientos(estado);
CREATE INDEX IF NOT EXISTS idx_bruck_conc_client            ON public.bruck_conciliaciones(client_id);

-- 7. RLS (admins ven todo, clientes solo su propio data)
ALTER TABLE public.bruck_rubros           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bruck_cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bruck_cuentas_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bruck_movimientos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bruck_conciliaciones    ENABLE ROW LEVEL SECURITY;

-- Admins ven todo
CREATE POLICY "Admins full access rubros"    ON public.bruck_rubros
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access cb"        ON public.bruck_cuentas_bancarias
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access cc"        ON public.bruck_cuentas_contables
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access movs"      ON public.bruck_movimientos
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access concil"    ON public.bruck_conciliaciones
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Clientes ven solo su propia data
CREATE POLICY "Client own rubros"    ON public.bruck_rubros            FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client own cb"        ON public.bruck_cuentas_bancarias  FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client own cc"        ON public.bruck_cuentas_contables  FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client own movs"      ON public.bruck_movimientos         FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client own concil"    ON public.bruck_conciliaciones      FOR SELECT USING (client_id = auth.uid());

-- 8. Verificación
SELECT
  (SELECT count(*) FROM public.bruck_rubros)            AS rubros,
  (SELECT count(*) FROM public.bruck_cuentas_bancarias) AS cuentas_bancarias,
  (SELECT count(*) FROM public.bruck_cuentas_contables) AS cuentas_contables,
  (SELECT count(*) FROM public.bruck_movimientos)        AS movimientos,
  (SELECT count(*) FROM public.bruck_conciliaciones)     AS conciliaciones;
