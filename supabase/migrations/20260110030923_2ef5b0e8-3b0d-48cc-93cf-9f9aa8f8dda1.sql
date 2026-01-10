-- FIX: Clients - Restringir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

-- Apenas admins, gestores e funcionários autorizados podem inserir clientes
CREATE POLICY "Authorized users can insert clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- Apenas admins, gestores e funcionários autorizados podem atualizar clientes
CREATE POLICY "Authorized users can update clients" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );