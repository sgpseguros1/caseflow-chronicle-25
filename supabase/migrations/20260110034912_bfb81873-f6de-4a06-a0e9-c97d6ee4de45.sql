-- Fix 1: Profiles - Restrict access to own profile only (admins/gestores can see all)
DROP POLICY IF EXISTS "Users view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users view own profile or admins view all" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id 
    OR has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gestor')
  );

-- Fix 2: Funcionarios - More restrictive access (hide CPF from non-admins)
-- First, let's update the SELECT policy to be more restrictive
DROP POLICY IF EXISTS "Authorized users view funcionarios" ON public.funcionarios;

-- Admins and gestores can see all funcionarios
CREATE POLICY "Admins and gestores view all funcionarios" 
  ON public.funcionarios 
  FOR SELECT 
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gestor')
  );

-- Funcionarios can only see their own record
CREATE POLICY "Funcionarios view own record" 
  ON public.funcionarios 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());