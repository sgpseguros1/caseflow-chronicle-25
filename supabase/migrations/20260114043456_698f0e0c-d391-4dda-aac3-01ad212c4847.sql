-- =====================================================
-- SISTEMA JURÍDICO COMPLETO - HISTÓRICO E COMUNICAÇÃO
-- =====================================================

-- 1. TABELA DE HISTÓRICO DE BAU (AUDITORIA COMPLETA)
CREATE TABLE IF NOT EXISTS public.bau_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bau_id UUID NOT NULL REFERENCES public.client_baus(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para histórico de BAU
ALTER TABLE public.bau_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver histórico BAU"
  ON public.bau_historico FOR SELECT USING (true);

CREATE POLICY "Sistema pode inserir histórico BAU"
  ON public.bau_historico FOR INSERT WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bau_historico_bau_id ON public.bau_historico(bau_id);
CREATE INDEX IF NOT EXISTS idx_bau_historico_created_at ON public.bau_historico(created_at);

-- 2. TABELA DE COMUNICAÇÃO CENTRALIZADA
CREATE TABLE IF NOT EXISTS public.comunicacao_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'sms', 'interno', 'telefone')),
  direcao TEXT NOT NULL DEFAULT 'saida' CHECK (direcao IN ('entrada', 'saida')),
  remetente_id UUID,
  destinatario_id UUID,
  cliente_id UUID REFERENCES public.clients(id),
  processo_id UUID REFERENCES public.processos_judiciais(id),
  protocolo_id UUID REFERENCES public.protocolos(id),
  bau_id UUID REFERENCES public.client_baus(id),
  assunto TEXT,
  conteudo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('rascunho', 'enviado', 'entregue', 'lido', 'falha')),
  data_leitura TIMESTAMPTZ,
  metadados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para comunicação
ALTER TABLE public.comunicacao_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e gestores podem ver todas comunicações"
  ON public.comunicacao_registros FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Usuários podem ver comunicações próprias"
  ON public.comunicacao_registros FOR SELECT
  USING (remetente_id = auth.uid() OR destinatario_id = auth.uid());

CREATE POLICY "Usuários autenticados podem inserir comunicações"
  ON public.comunicacao_registros FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Não é permitido excluir comunicações"
  ON public.comunicacao_registros FOR DELETE
  USING (false);

-- Índices para comunicação
CREATE INDEX IF NOT EXISTS idx_comunicacao_cliente_id ON public.comunicacao_registros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_processo_id ON public.comunicacao_registros(processo_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_bau_id ON public.comunicacao_registros(bau_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_created_at ON public.comunicacao_registros(created_at);

-- 3. TABELA DE DOCUMENTOS FALTANTES DO BAU
CREATE TABLE IF NOT EXISTS public.bau_documentos_faltantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bau_id UUID NOT NULL REFERENCES public.client_baus(id) ON DELETE CASCADE,
  documento_nome TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'faltando' CHECK (status IN ('faltando', 'recebido', 'dispensado')),
  data_recebimento TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.bau_documentos_faltantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver documentos faltantes"
  ON public.bau_documentos_faltantes FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar documentos faltantes"
  ON public.bau_documentos_faltantes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. TABELA DE ETIQUETAS DO BAU
CREATE TABLE IF NOT EXISTS public.bau_etiquetas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bau_id UUID NOT NULL REFERENCES public.client_baus(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3b82f6',
  tipo TEXT DEFAULT 'manual' CHECK (tipo IN ('manual', 'automatica')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.bau_etiquetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver etiquetas BAU"
  ON public.bau_etiquetas FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar etiquetas BAU"
  ON public.bau_etiquetas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar etiquetas BAU"
  ON public.bau_etiquetas FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 5. TRIGGER PARA HISTÓRICO AUTOMÁTICO DE BAU
CREATE OR REPLACE FUNCTION public.registrar_historico_bau()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    
    -- Fase cobranca change
    IF OLD.fase_cobranca IS DISTINCT FROM NEW.fase_cobranca THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'fase_cobranca', OLD.fase_cobranca, NEW.fase_cobranca, auth.uid());
    END IF;
    
    -- Responsavel change
    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'responsavel_id', OLD.responsavel_id::TEXT, NEW.responsavel_id::TEXT, auth.uid());
    END IF;
    
    -- Qualidade status change
    IF OLD.qualidade_status IS DISTINCT FROM NEW.qualidade_status THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'qualidade_status', OLD.qualidade_status, NEW.qualidade_status, auth.uid());
    END IF;
    
    -- Previsao entrega change
    IF OLD.previsao_entrega IS DISTINCT FROM NEW.previsao_entrega THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'previsao_entrega', OLD.previsao_entrega::TEXT, NEW.previsao_entrega::TEXT, auth.uid());
    END IF;
    
    -- Data recebimento change  
    IF OLD.data_recebimento IS DISTINCT FROM NEW.data_recebimento THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'data_recebimento', OLD.data_recebimento::TEXT, NEW.data_recebimento::TEXT, auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_bau_historico ON public.client_baus;
CREATE TRIGGER trigger_bau_historico
  AFTER UPDATE ON public.client_baus
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_bau();

-- 6. TRIGGER PARA HISTÓRICO AUTOMÁTICO DE PROCESSOS JUDICIAIS
CREATE OR REPLACE FUNCTION public.registrar_historico_processo_judicial()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.historico_processo (processo_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'alteracao_status', 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    
    IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
      INSERT INTO public.historico_processo (processo_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'alteracao_prioridade', 'prioridade', OLD.prioridade, NEW.prioridade, auth.uid());
    END IF;
    
    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO public.historico_processo (processo_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'alteracao_responsavel', 'responsavel_id', OLD.responsavel_id::TEXT, NEW.responsavel_id::TEXT, auth.uid());
    END IF;
    
    IF OLD.prazo_processual IS DISTINCT FROM NEW.prazo_processual THEN
      INSERT INTO public.historico_processo (processo_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'alteracao_prazo', 'prazo_processual', OLD.prazo_processual::TEXT, NEW.prazo_processual::TEXT, auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_processo_judicial_historico ON public.processos_judiciais;
CREATE TRIGGER trigger_processo_judicial_historico
  AFTER UPDATE ON public.processos_judiciais
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_processo_judicial();

-- 7. REMOVER POLICY DE DELETE DE PROCESSOS E ALERTAS (SOFT DELETE ONLY)
DO $$
BEGIN
  -- Garantir que alertas não podem ser excluídos, apenas resolvidos
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem deletar alertas' AND tablename = 'alertas') THEN
    DROP POLICY "Usuários podem deletar alertas" ON public.alertas;
  END IF;
  
  -- Garantir que alertas_prazo não podem ser excluídos
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem deletar alertas_prazo' AND tablename = 'alertas_prazo') THEN
    DROP POLICY "Usuários podem deletar alertas_prazo" ON public.alertas_prazo;
  END IF;
END $$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicacao_registros;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bau_historico;