-- ==========================================
-- CAMADA 1: ENTIDADE PROTOCOLO (NÚCLEO)
-- ==========================================

CREATE TABLE public.protocolos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo SERIAL,
  cliente_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Tipo e Natureza
  tipo TEXT NOT NULL CHECK (tipo IN ('AUXILIO_ACIDENTE', 'DPVAT', 'SEGURO_VIDA', 'PREVIDENCIARIO', 'JUDICIAL_CIVEL', 'ADMINISTRATIVO_SEGURADORA')),
  natureza TEXT NOT NULL CHECK (natureza IN ('ADMINISTRATIVO', 'JUDICIAL')),
  subtipo TEXT,
  
  -- Órgãos e Responsáveis
  orgao_responsavel TEXT,
  seguradora_id UUID REFERENCES public.seguradoras(id),
  advogado_id UUID REFERENCES public.advogados(id),
  funcionario_id UUID REFERENCES public.funcionarios(id),
  
  -- Status e Controle
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo', 'em_analise', 'aguardando_documentos', 'documentacao_completa',
    'em_andamento', 'aguardando_pericia', 'pericia_realizada', 'aguardando_decisao',
    'deferido', 'indeferido', 'recurso', 'judicializado', 'aguardando_pagamento',
    'pago', 'encerrado_sucesso', 'encerrado_prejuizo', 'arquivado'
  )),
  
  -- Datas
  data_protocolo DATE NOT NULL DEFAULT CURRENT_DATE,
  data_ultima_movimentacao TIMESTAMPTZ DEFAULT now(),
  prazo_estimado DATE,
  
  -- SLA (em dias)
  sla_dias INTEGER DEFAULT 30,
  
  -- Prioridade
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  
  -- Observações
  observacoes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 9: MÓDULO AUXÍLIO-ACIDENTE (INSS)
-- ==========================================

CREATE TABLE public.protocolo_auxilio_acidente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE UNIQUE,
  
  -- Dados do acidente
  data_acidente DATE,
  data_requerimento DATE,
  numero_protocolo_inss TEXT,
  
  -- Benefício
  tipo_beneficio TEXT CHECK (tipo_beneficio IN ('B91', 'B92', 'B93', 'B94', 'OUTRO')),
  situacao_atual TEXT,
  
  -- Perícia
  pericia_realizada BOOLEAN DEFAULT false,
  data_pericia DATE,
  resultado_pericia TEXT,
  
  -- Judicialização
  judicializado BOOLEAN DEFAULT false,
  numero_processo_judicial TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 6: HISTÓRICO / AUDITORIA
-- ==========================================

CREATE TABLE public.protocolo_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  
  -- Mudança
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  
  -- Responsável
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Observação obrigatória
  observacao TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 5: RESPONSABILIDADE POR FASE
-- ==========================================

CREATE TABLE public.protocolo_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  
  -- Período
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  
  -- Ativo
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 7: DOCUMENTOS COM STATUS
-- ==========================================

CREATE TABLE public.protocolo_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  
  -- Documento
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'nao_solicitado' CHECK (status IN (
    'nao_solicitado', 'solicitado', 'recebido', 'incompleto', 'validado'
  )),
  
  -- Arquivo
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Responsável
  uploaded_by UUID REFERENCES auth.users(id),
  validado_por UUID REFERENCES auth.users(id),
  validado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 8: FINANCEIRO POR PROTOCOLO
-- ==========================================

CREATE TABLE public.protocolo_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE UNIQUE,
  
  -- Valores
  valor_estimado NUMERIC DEFAULT 0,
  valor_recebido NUMERIC DEFAULT 0,
  valor_a_receber NUMERIC GENERATED ALWAYS AS (valor_estimado - valor_recebido) STORED,
  
  -- Honorários
  tipo_honorario TEXT CHECK (tipo_honorario IN ('percentual', 'fixo', 'hibrido')),
  percentual_honorario NUMERIC,
  valor_fixo_honorario NUMERIC,
  honorarios_calculados NUMERIC DEFAULT 0,
  
  -- Comissão interna
  comissao_interna NUMERIC DEFAULT 0,
  
  -- Prejuízo
  prejuizo_registrado NUMERIC DEFAULT 0,
  motivo_prejuizo TEXT,
  
  -- Pagamento
  data_pagamento DATE,
  comprovante_path TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 2: ETIQUETAS INTELIGENTES
-- ==========================================

CREATE TABLE public.protocolo_etiquetas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  
  -- Etiqueta
  tipo TEXT NOT NULL CHECK (tipo IN ('tempo', 'risco', 'resultado', 'prioridade', 'sistema')),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL,
  
  -- Geração automática
  gerado_automaticamente BOOLEAN DEFAULT true,
  regra_aplicada TEXT,
  
  -- Ativo
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(protocolo_id, codigo)
);

-- ==========================================
-- CAMADA 4: ALERTAS DE ESCALONAMENTO
-- ==========================================

CREATE TABLE public.protocolo_alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  
  -- Tipo e Nível
  tipo TEXT NOT NULL CHECK (tipo IN ('tempo_parado', 'documento_pendente', 'sla_excedido', 'risco', 'financeiro', 'sem_responsavel')),
  nivel TEXT NOT NULL CHECK (nivel IN ('info', 'aviso', 'critico', 'urgente')),
  
  -- Conteúdo
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Escalonamento
  escalonado_para UUID REFERENCES auth.users(id),
  escalonamento_nivel INTEGER DEFAULT 1,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'lido', 'resolvido', 'ignorado')),
  
  -- Resolução
  resolvido_por UUID REFERENCES auth.users(id),
  resolvido_em TIMESTAMPTZ,
  resolucao_observacao TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CAMADA 14: CHECKLIST DE ENCERRAMENTO
-- ==========================================

CREATE TABLE public.protocolo_checklist_encerramento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE UNIQUE,
  
  -- Itens obrigatórios
  status_final_definido BOOLEAN DEFAULT false,
  financeiro_preenchido BOOLEAN DEFAULT false,
  honorarios_calculados BOOLEAN DEFAULT false,
  documento_final_anexado BOOLEAN DEFAULT false,
  observacao_final_registrada BOOLEAN DEFAULT false,
  
  -- Aprovação
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

CREATE INDEX idx_protocolos_cliente ON public.protocolos(cliente_id);
CREATE INDEX idx_protocolos_tipo ON public.protocolos(tipo);
CREATE INDEX idx_protocolos_status ON public.protocolos(status);
CREATE INDEX idx_protocolos_funcionario ON public.protocolos(funcionario_id);
CREATE INDEX idx_protocolos_data_movimentacao ON public.protocolos(data_ultima_movimentacao);
CREATE INDEX idx_protocolo_historico_protocolo ON public.protocolo_historico(protocolo_id);
CREATE INDEX idx_protocolo_documentos_protocolo ON public.protocolo_documentos(protocolo_id);
CREATE INDEX idx_protocolo_alertas_status ON public.protocolo_alertas(status);
CREATE INDEX idx_protocolo_etiquetas_protocolo ON public.protocolo_etiquetas(protocolo_id);

-- ==========================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================

CREATE TRIGGER update_protocolos_updated_at
  BEFORE UPDATE ON public.protocolos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_protocolo_auxilio_updated_at
  BEFORE UPDATE ON public.protocolo_auxilio_acidente
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_protocolo_documentos_updated_at
  BEFORE UPDATE ON public.protocolo_documentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_protocolo_financeiro_updated_at
  BEFORE UPDATE ON public.protocolo_financeiro
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_protocolo_checklist_updated_at
  BEFORE UPDATE ON public.protocolo_checklist_encerramento
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_protocolo_etiquetas_updated_at
  BEFORE UPDATE ON public.protocolo_etiquetas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- TRIGGER PARA ATUALIZAR DATA_ULTIMA_MOVIMENTACAO
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_protocolo_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_ultima_movimentacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_protocolo_movimentacao_trigger
  BEFORE UPDATE ON public.protocolos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_protocolo_movimentacao();

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_auxilio_acidente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_checklist_encerramento ENABLE ROW LEVEL SECURITY;

-- Protocolos: visualização baseada em role
CREATE POLICY "Users view protocolos based on role"
  ON public.protocolos FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'gestor'::app_role) OR
    funcionario_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and gestores can insert protocolos"
  ON public.protocolos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Users update protocolos based on role"
  ON public.protocolos FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'gestor'::app_role) OR
    funcionario_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete protocolos"
  ON public.protocolos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auxílio Acidente
CREATE POLICY "View auxilio acidente" ON public.protocolo_auxilio_acidente FOR SELECT USING (true);
CREATE POLICY "Manage auxilio acidente" ON public.protocolo_auxilio_acidente FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

-- Histórico (somente leitura para todos, insert permitido)
CREATE POLICY "View historico" ON public.protocolo_historico FOR SELECT USING (true);
CREATE POLICY "Insert historico" ON public.protocolo_historico FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

-- Responsáveis
CREATE POLICY "View responsaveis" ON public.protocolo_responsaveis FOR SELECT USING (true);
CREATE POLICY "Manage responsaveis" ON public.protocolo_responsaveis FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Documentos
CREATE POLICY "View documentos" ON public.protocolo_documentos FOR SELECT USING (true);
CREATE POLICY "Manage documentos" ON public.protocolo_documentos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

-- Financeiro
CREATE POLICY "View financeiro" ON public.protocolo_financeiro FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Manage financeiro" ON public.protocolo_financeiro FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Etiquetas
CREATE POLICY "View etiquetas" ON public.protocolo_etiquetas FOR SELECT USING (true);
CREATE POLICY "Manage etiquetas" ON public.protocolo_etiquetas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

-- Alertas
CREATE POLICY "View alertas protocolo" ON public.protocolo_alertas FOR SELECT USING (true);
CREATE POLICY "Manage alertas protocolo" ON public.protocolo_alertas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

-- Checklist
CREATE POLICY "View checklist" ON public.protocolo_checklist_encerramento FOR SELECT USING (true);
CREATE POLICY "Manage checklist" ON public.protocolo_checklist_encerramento FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));