-- Corrigir políticas RLS para client_documents - separar por operação
DROP POLICY IF EXISTS "Admin and gestor can manage client documents" ON public.client_documents;

-- Políticas separadas para INSERT, UPDATE, DELETE
CREATE POLICY "Admin and gestor can insert client documents"
  ON public.client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admin and gestor can update client documents"
  ON public.client_documents
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admin and gestor can delete client documents"
  ON public.client_documents
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

-- Corrigir políticas para client_alerts
DROP POLICY IF EXISTS "Admin and gestor can manage client alerts" ON public.client_alerts;

CREATE POLICY "Admin and gestor can insert client alerts"
  ON public.client_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admin and gestor can update client alerts"
  ON public.client_alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admin and gestor can delete client alerts"
  ON public.client_alerts
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

-- Corrigir política INSERT de clients para ser mais restritiva
DROP POLICY IF EXISTS "All authenticated users can create clients" ON public.clients;

CREATE POLICY "Authenticated users can create clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'funcionario')
  );