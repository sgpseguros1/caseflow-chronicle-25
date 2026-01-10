-- ==========================================
-- TABELA: client_baus (Solicitações de BAU)
-- ==========================================
CREATE TABLE public.client_baus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Dados da solicitação
  hospital_nome TEXT NOT NULL,
  hospital_telefone TEXT,
  hospital_contato TEXT,
  tipo_solicitacao TEXT NOT NULL DEFAULT 'escritorio', -- 'escritorio', 'cliente_solicitou', 'cliente_ira_solicitar'
  
  -- Datas
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  previsao_entrega DATE,
  data_recebimento DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'solicitado', -- 'solicitado', 'em_andamento', 'recebido', 'incompleto', 'em_correcao', 'validado', 'cancelado'
  fase_cobranca TEXT DEFAULT 'normal', -- 'normal', 'pre_aviso', 'cobrar', 'escalonado', 'critico'
  
  -- Responsável
  responsavel_id UUID REFERENCES public.funcionarios(id),
  
  -- Qualidade
  qualidade_status TEXT DEFAULT 'pendente', -- 'pendente', 'recebido_validado', 'recebido_incompleto', 'em_correcao'
  motivo_incompleto TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: client_bau_contatos (Histórico de Contatos)
-- ==========================================
CREATE TABLE public.client_bau_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bau_id UUID NOT NULL REFERENCES public.client_baus(id) ON DELETE CASCADE,
  
  -- Contato
  tipo_contato TEXT NOT NULL DEFAULT 'telefone', -- 'telefone', 'email', 'presencial', 'whatsapp'
  descricao TEXT NOT NULL,
  resultado TEXT, -- 'sucesso', 'sem_resposta', 'agendar_retorno', 'problema'
  nova_previsao DATE,
  
  -- Responsável
  registrado_por UUID REFERENCES public.profiles(id),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX idx_client_baus_client_id ON public.client_baus(client_id);
CREATE INDEX idx_client_baus_status ON public.client_baus(status);
CREATE INDEX idx_client_baus_responsavel ON public.client_baus(responsavel_id);
CREATE INDEX idx_client_baus_hospital ON public.client_baus(hospital_nome);
CREATE INDEX idx_client_bau_contatos_bau_id ON public.client_bau_contatos(bau_id);

-- ==========================================
-- TRIGGER: updated_at automático
-- ==========================================
CREATE TRIGGER update_client_baus_updated_at
  BEFORE UPDATE ON public.client_baus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- RLS: client_baus
-- ==========================================
ALTER TABLE public.client_baus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view BAUs"
  ON public.client_baus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create BAUs"
  ON public.client_baus FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and gestors can update BAUs"
  ON public.client_baus FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Only admins can delete BAUs"
  ON public.client_baus FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ==========================================
-- RLS: client_bau_contatos
-- ==========================================
ALTER TABLE public.client_bau_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view BAU contacts"
  ON public.client_bau_contatos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create BAU contacts"
  ON public.client_bau_contatos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can delete BAU contacts"
  ON public.client_bau_contatos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));