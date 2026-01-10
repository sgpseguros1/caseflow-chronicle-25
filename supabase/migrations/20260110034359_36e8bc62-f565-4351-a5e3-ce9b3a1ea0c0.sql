-- Fix 1: Advogados - Require authentication for access
DROP POLICY IF EXISTS "Authorized users view advogados" ON public.advogados;
CREATE POLICY "Authenticated users can view advogados" 
  ON public.advogados 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Fix 2: Clients - Restrict access to clients based on assigned processos/leads
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;

-- New restrictive policy: Users can only see clients from their assigned processos or leads
CREATE POLICY "Users can view assigned clients" 
  ON public.clients 
  FOR SELECT 
  TO authenticated
  USING (
    -- Admins and gestores can see all clients
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
    OR
    -- Funcionarios can only see clients from their assigned processos
    EXISTS (
      SELECT 1 FROM public.processos p
      INNER JOIN public.funcionarios f ON f.id = p.responsavel_id
      WHERE p.cliente_id = clients.id 
      AND f.user_id = auth.uid()
    )
    OR
    -- Funcionarios can only see clients from their assigned leads
    EXISTS (
      SELECT 1 FROM public.leads l
      INNER JOIN public.funcionarios f ON f.id = l.responsavel_id
      WHERE l.cliente_id = clients.id 
      AND f.user_id = auth.uid()
    )
    OR
    -- Users can see clients they created
    created_by = auth.uid()
  );

-- Fix 3: Profiles - Prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile except role" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Allow update only if role is not being changed (new role equals old role)
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR
      -- Or if user is admin
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );