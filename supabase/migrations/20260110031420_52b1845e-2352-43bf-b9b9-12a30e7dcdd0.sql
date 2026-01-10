-- Criar tabela de alertas automáticos
CREATE TABLE public.alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- processo_parado, documento_pendente, acesso_sem_acao, processo_risco
  titulo TEXT NOT NULL,
  descricao TEXT,
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.funcionarios(id),
  usuario_alvo_id UUID, -- usuário que deve receber o alerta
  prioridade TEXT NOT NULL DEFAULT 'normal', -- baixa, normal, alta, critica
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, lido, resolvido
  lido_em TIMESTAMP WITH TIME ZONE,
  resolvido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para alertas
CREATE POLICY "Users view own alerts or admins view all" ON public.alertas
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    usuario_alvo_id = auth.uid() OR
    funcionario_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert alerts" ON public.alertas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own alerts" ON public.alertas
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    usuario_alvo_id = auth.uid() OR
    funcionario_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

-- Criar tabela de templates de comunicação
CREATE TABLE public.comunicacao_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  canal TEXT NOT NULL, -- whatsapp, email, sms, interno
  assunto TEXT,
  conteudo TEXT NOT NULL,
  variaveis TEXT[], -- {{nome}}, {{processo}}, etc
  ativo BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicacao_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view templates" ON public.comunicacao_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage templates" ON public.comunicacao_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

-- Criar tabela de histórico de comunicação
CREATE TABLE public.comunicacao_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL,
  destinatario TEXT NOT NULL, -- email, telefone, etc
  cliente_id UUID REFERENCES public.clients(id),
  processo_id UUID REFERENCES public.processos(id),
  template_id UUID REFERENCES public.comunicacao_templates(id),
  assunto TEXT,
  conteudo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado', -- enviado, entregue, lido, erro
  erro_detalhes TEXT,
  enviado_por UUID,
  enviado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view comunicacao based on role" ON public.comunicacao_historico
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

CREATE POLICY "Authorized users insert comunicacao" ON public.comunicacao_historico
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- Criar tabela de log de acesso a processos
CREATE TABLE public.processo_acessos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acao TEXT, -- visualizou, editou, anexou_documento, etc
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.processo_acessos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view process access logs" ON public.processo_acessos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

CREATE POLICY "System logs access" ON public.processo_acessos
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Adicionar campo ultima_movimentacao nos processos
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS ultima_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Trigger para atualizar ultima_movimentacao
CREATE OR REPLACE FUNCTION public.update_processo_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_movimentacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_processos_movimentacao
  BEFORE UPDATE ON public.processos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_processo_movimentacao();