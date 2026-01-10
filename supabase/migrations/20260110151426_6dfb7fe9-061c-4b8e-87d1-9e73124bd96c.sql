-- Tabela principal de lançamentos financeiros (nasce do cliente/protocolo)
CREATE TABLE public.lancamentos_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  protocolo_id UUID REFERENCES public.protocolos(id) ON DELETE SET NULL,
  tipo_receita TEXT NOT NULL CHECK (tipo_receita IN ('seguro_vida', 'judicial', 'danos', 'dpvat', 'previdenciario', 'outros')),
  tipo_receita_justificativa TEXT, -- obrigatório quando tipo = 'outros'
  valor_bruto NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  valor_pendente NUMERIC GENERATED ALWAYS AS (valor_bruto - valor_pago) STORED,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'transferencia', 'dinheiro', 'cheque', 'cartao', 'boleto')),
  data_recebimento DATE,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('recebido', 'parcial', 'em_aberto', 'em_atraso', 'negociado', 'cancelado')),
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria financeira
CREATE TABLE public.auditoria_financeira (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id) ON DELETE SET NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criacao', 'edicao', 'exclusao', 'fechamento_mes')),
  usuario_id UUID REFERENCES auth.users(id),
  valor_anterior NUMERIC,
  valor_novo NUMERIC,
  dados_anteriores JSONB,
  dados_novos JSONB,
  descricao TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fechamentos mensais
CREATE TABLE public.fechamentos_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  total_recebido NUMERIC NOT NULL DEFAULT 0,
  total_a_receber NUMERIC NOT NULL DEFAULT 0,
  total_em_atraso NUMERIC NOT NULL DEFAULT 0,
  numero_lancamentos INTEGER NOT NULL DEFAULT 0,
  resumo_por_tipo JSONB,
  fechado_por UUID REFERENCES auth.users(id),
  fechado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ano, mes)
);

-- Índices para performance
CREATE INDEX idx_lancamentos_cliente ON public.lancamentos_financeiros(cliente_id);
CREATE INDEX idx_lancamentos_protocolo ON public.lancamentos_financeiros(protocolo_id);
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo_receita);
CREATE INDEX idx_lancamentos_status ON public.lancamentos_financeiros(status);
CREATE INDEX idx_lancamentos_data ON public.lancamentos_financeiros(data_recebimento);
CREATE INDEX idx_lancamentos_created ON public.lancamentos_financeiros(created_at);
CREATE INDEX idx_auditoria_lancamento ON public.auditoria_financeira(lancamento_id);
CREATE INDEX idx_auditoria_usuario ON public.auditoria_financeira(usuario_id);
CREATE INDEX idx_fechamentos_periodo ON public.fechamentos_mensais(ano, mes);

-- Trigger para updated_at
CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar status de atraso automaticamente
CREATE OR REPLACE FUNCTION public.check_lancamento_atraso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'em_aberto' AND NEW.data_vencimento < CURRENT_DATE AND NEW.valor_pendente > 0 THEN
    NEW.status = 'em_atraso';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_check_atraso
  BEFORE INSERT OR UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.check_lancamento_atraso();

-- Trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.audit_lancamento_financeiro()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.auditoria_financeira (lancamento_id, acao, usuario_id, valor_novo, dados_novos, descricao)
    VALUES (NEW.id, 'criacao', NEW.created_by, NEW.valor_bruto, row_to_json(NEW), 'Lançamento criado');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.auditoria_financeira (lancamento_id, acao, usuario_id, valor_anterior, valor_novo, dados_anteriores, dados_novos, descricao)
    VALUES (NEW.id, 'edicao', auth.uid(), OLD.valor_bruto, NEW.valor_bruto, row_to_json(OLD), row_to_json(NEW), 'Lançamento editado');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.auditoria_financeira (lancamento_id, acao, usuario_id, valor_anterior, dados_anteriores, descricao)
    VALUES (OLD.id, 'exclusao', auth.uid(), OLD.valor_bruto, row_to_json(OLD), 'Lançamento excluído');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_audit_lancamento
  AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lancamento_financeiro();

-- Enable RLS
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

-- RLS Policies para lancamentos_financeiros (SOMENTE ADMIN/GESTOR)
CREATE POLICY "Admin e gestor podem ver lancamentos"
  ON public.lancamentos_financeiros FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admin e gestor podem inserir lancamentos"
  ON public.lancamentos_financeiros FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admin e gestor podem atualizar lancamentos"
  ON public.lancamentos_financeiros FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Apenas admin pode excluir lancamentos"
  ON public.lancamentos_financeiros FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para auditoria (SOMENTE ADMIN)
CREATE POLICY "Apenas admin pode ver auditoria"
  ON public.auditoria_financeira FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema insere auditoria"
  ON public.auditoria_financeira FOR INSERT
  WITH CHECK (true);

-- RLS Policies para fechamentos
CREATE POLICY "Admin e gestor podem ver fechamentos"
  ON public.fechamentos_mensais FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admin e gestor podem inserir fechamentos"
  ON public.fechamentos_mensais FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Apenas admin pode atualizar fechamentos"
  ON public.fechamentos_mensais FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));