-- Fix RLS so Admin/Gestor can manage profiles and funcionarios as per app rules

-- PROFILES: Drop existing policy and recreate with proper permissions
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;

-- Users can update only their own profile (for self-service)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Gestors can update profiles except admins
DROP POLICY IF EXISTS "Gestors can update non-admin profiles" ON public.profiles;
CREATE POLICY "Gestors can update non-admin profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor'::public.app_role)
  AND NOT public.has_role(id, 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'gestor'::public.app_role)
  AND NOT public.has_role(id, 'admin'::public.app_role)
);


-- FUNCIONARIOS: Update permissions for Gestors
DROP POLICY IF EXISTS "Admins can update funcionarios" ON public.funcionarios;

-- Admins can update any funcionario
CREATE POLICY "Admins can update funcionarios"
ON public.funcionarios
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Gestors can update funcionarios except those linked to an admin user
DROP POLICY IF EXISTS "Gestors can update non-admin funcionarios" ON public.funcionarios;
CREATE POLICY "Gestors can update non-admin funcionarios"
ON public.funcionarios
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor'::public.app_role)
  AND (
    user_id IS NULL
    OR NOT public.has_role(user_id, 'admin'::public.app_role)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'gestor'::public.app_role)
  AND (
    user_id IS NULL
    OR NOT public.has_role(user_id, 'admin'::public.app_role)
  )
);

-- USER_ROLES: Allow Gestors to view all roles (for UI display)
DROP POLICY IF EXISTS "Users view own roles or admins view all" ON public.user_roles;
CREATE POLICY "Users view own roles or admins gestors view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gestor'::public.app_role)
);