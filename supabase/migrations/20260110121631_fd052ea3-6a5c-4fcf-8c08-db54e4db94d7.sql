-- Adicionar novos campos ampliados na tabela clients
ALTER TABLE public.clients
  -- Dados de emprego
  ADD COLUMN IF NOT EXISTS is_clt boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name text,
  
  -- Dados do acidente
  ADD COLUMN IF NOT EXISTS accident_date date,
  ADD COLUMN IF NOT EXISTS accident_type text,
  ADD COLUMN IF NOT EXISTS accident_location text,
  ADD COLUMN IF NOT EXISTS has_police_report boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS police_report_number text,
  
  -- Dados médicos
  ADD COLUMN IF NOT EXISTS injuries text,
  ADD COLUMN IF NOT EXISTS cid_code text,
  ADD COLUMN IF NOT EXISTS body_part_affected text,
  ADD COLUMN IF NOT EXISTS injury_severity text,
  ADD COLUMN IF NOT EXISTS has_sequelae boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS disability_percentage numeric,
  
  -- Atendimento médico
  ADD COLUMN IF NOT EXISTS admission_hospital text,
  ADD COLUMN IF NOT EXISTS admission_date date,
  ADD COLUMN IF NOT EXISTS transfer_hospital text,
  ADD COLUMN IF NOT EXISTS transfer_date date,
  ADD COLUMN IF NOT EXISTS had_surgery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS was_hospitalized boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hospitalization_days integer,
  
  -- Origem / Indicação
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_type text,
  ADD COLUMN IF NOT EXISTS referrer_name text,
  
  -- Vínculos e status
  ADD COLUMN IF NOT EXISTS advogado_id uuid REFERENCES public.advogados(id),
  ADD COLUMN IF NOT EXISTS seguradora_id uuid REFERENCES public.seguradoras(id),
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.funcionarios(id),
  ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS last_contact_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Criar tabela para documentos do cliente
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  description text,
  document_category text,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on client_documents
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_documents (todos autenticados podem ver)
CREATE POLICY "Authenticated users can view client documents"
  ON public.client_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Somente admin e gestor podem inserir/atualizar/deletar documentos
CREATE POLICY "Admin and gestor can manage client documents"
  ON public.client_documents
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

-- Atualizar políticas RLS para clients
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

-- Todos os usuários autenticados podem visualizar clientes
CREATE POLICY "All authenticated users can view clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Todos podem criar clientes
CREATE POLICY "All authenticated users can create clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Somente admin e gestor podem atualizar clientes
CREATE POLICY "Only admin and gestor can update clients"
  ON public.clients
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

-- Somente admin e gestor podem excluir clientes (soft delete)
CREATE POLICY "Only admin and gestor can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

-- Criar bucket para documentos de clientes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para documentos
CREATE POLICY "Authenticated users can view client documents storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'client-documents');

CREATE POLICY "Admin and gestor can upload client documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents' AND 
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
  );

CREATE POLICY "Admin and gestor can delete client documents storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND 
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
  );

-- Criar tabela para alertas de cliente
CREATE TABLE IF NOT EXISTS public.client_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prioridade text DEFAULT 'media',
  status text DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- Enable RLS on client_alerts
ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;

-- Todos podem ver alertas
CREATE POLICY "All authenticated can view client alerts"
  ON public.client_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin e gestor podem gerenciar alertas
CREATE POLICY "Admin and gestor can manage client alerts"
  ON public.client_alerts
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(client_status);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON public.clients(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_alerts_client_id ON public.client_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_alerts_status ON public.client_alerts(status);