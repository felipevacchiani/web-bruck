-- ================================================
-- BRUCK PORTAL - Políticas RLS para tabla profiles
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- 1. Asegurarse que la función is_admin existe
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid()
$$;

-- 2. Eliminar políticas anteriores que puedan conflictuar
DROP POLICY IF EXISTS "admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "own profile select" ON profiles;
DROP POLICY IF EXISTS "own profile update" ON profiles;
DROP POLICY IF EXISTS "admin all profiles" ON profiles;

-- 3. Activar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Política: cada usuario puede leer su propio perfil
CREATE POLICY "own profile select"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. Política: cada usuario puede actualizar su propio perfil
CREATE POLICY "own profile update"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 6. Política: admin puede hacer todo
CREATE POLICY "admin all profiles"
ON profiles FOR ALL
TO authenticated
USING (is_admin());

-- ================================================
-- RLS para tabla files
-- ================================================
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client view own files" ON files;
DROP POLICY IF EXISTS "admin all files" ON files;

-- Cliente solo ve sus propios archivos
CREATE POLICY "client view own files"
ON files FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Admin puede hacer todo
CREATE POLICY "admin all files"
ON files FOR ALL
TO authenticated
USING (is_admin());
