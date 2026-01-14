
-- Tabela principal de processos judiciais do escritório
CREATE TABLE public.processos_judiciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_processo VARCHAR NOT NULL UNIQUE,
  
  -- Dados do tribunal (preenchidos automaticamente)
  tribunal VARCHAR,
  grau VARCHAR,
  vara VARCHAR,
  comarca VARCHAR,
  juiz_responsavel VARCHAR,
  classe_processual VARCHAR,
  assunto_principal VARCHAR,
  assuntos_secundarios TEXT[],
  
  -- Partes do processo
  autor_nome VARCHAR,
  autor_documento VARCHAR,
  autor_tipo VARCHAR DEFAULT 'pessoa_fisica',
  reu_nome VARCHAR,
  reu_documento VARCHAR,
  reu_tipo VARCHAR DEFAULT 'pessoa_juridica',
  
  -- Dados financeiros
  valor_causa NUMERIC DEFAULT 0,
  valor_atualizado NUMERIC DEFAULT 0,
  custas_iniciais NUMERIC DEFAULT 0,
  indenizacao_pleiteada NUMERIC DEFAULT 0,
  indenizacao_paga NUMERIC DEFAULT 0,
  diferenca_valores NUMERIC GENERATED ALWAYS AS (indenizacao_pleiteada - indenizacao_paga) STORED,
  
  -- Status (atualizado automaticamente)
  status VARCHAR DEFAULT 'em_andamento',
  status_detalhado VARCHAR,
  ultima_movimentacao TEXT,
  data_ultima_movimentacao TIMESTAMP WITH TIME ZONE,
  
  -- Controle interno
  proxima_acao TEXT,
  prazo_processual DATE,
  alerta_prazo_dias INTEGER DEFAULT 5,
  responsavel_id UUID REFERENCES public.funcionarios(id),
  cadastrado_por UUID,
  prioridade VARCHAR DEFAULT 'media',
  observacoes_estrategicas TEXT,
  etiquetas TEXT[],
  
  -- Datas importantes
  data_fato DATE,
  data_distribuicao DATE,
  data_citacao DATE,
  data_audiencia DATE,
  data_pericia DATE,
  data_sentenca DATE,
  data_pagamento DATE,
  
  -- Metadados
  dados_completos JSONB,
  link_externo TEXT,
  sincronizado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de andamentos processuais
CREATE TABLE public.andamentos_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  data_andamento TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo VARCHAR,
  descricao TEXT NOT NULL,
  complemento TEXT,
  codigo_movimento INTEGER,
  destaque BOOLEAN DEFAULT false,
  lido BOOLEAN DEFAULT false,
  lido_por UUID,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de documentos do processo
CREATE TABLE public.documentos_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  tipo_documento VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type VARCHAR,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico/auditoria do processo
CREATE TABLE public.historico_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  usuario_id UUID,
  acao VARCHAR NOT NULL,
  campo_alterado VARCHAR,
  valor_anterior TEXT,
  valor_novo TEXT,
  ip_address VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de alertas de prazo
CREATE TABLE public.alertas_prazo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  tipo VARCHAR NOT NULL,
  titulo VARCHAR NOT NULL,
  descricao TEXT,
  data_prazo DATE NOT NULL,
  dias_restantes INTEGER,
  status VARCHAR DEFAULT 'pendente',
  usuario_alvo_id UUID,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_processos_judiciais_numero ON public.processos_judiciais(numero_processo);
CREATE INDEX idx_processos_judiciais_status ON public.processos_judiciais(status);
CREATE INDEX idx_processos_judiciais_responsavel ON public.processos_judiciais(responsavel_id);
CREATE INDEX idx_processos_judiciais_prazo ON public.processos_judiciais(prazo_processual);
CREATE INDEX idx_andamentos_processo_id ON public.andamentos_processo(processo_id);
CREATE INDEX idx_andamentos_data ON public.andamentos_processo(data_andamento DESC);

-- Trigger para updated_at
CREATE TRIGGER update_processos_judiciais_updated_at
  BEFORE UPDATE ON public.processos_judiciais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.processos_judiciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andamentos_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_prazo ENABLE ROW LEVEL SECURITY;

-- Políticas para processos_judiciais
CREATE POLICY "Admins e gestores podem ver todos os processos judiciais"
  ON public.processos_judiciais FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Funcionários podem ver processos atribuídos"
  ON public.processos_judiciais FOR SELECT
  USING (responsavel_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid()));

CREATE POLICY "Admins e gestores podem inserir processos judiciais"
  ON public.processos_judiciais FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins e gestores podem atualizar processos judiciais"
  ON public.processos_judiciais FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Funcionários podem atualizar processos atribuídos"
  ON public.processos_judiciais FOR UPDATE
  USING (responsavel_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid()));

CREATE POLICY "Apenas admin pode deletar processos judiciais"
  ON public.processos_judiciais FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para andamentos
CREATE POLICY "Usuários autenticados podem ver andamentos"
  ON public.andamentos_processo FOR SELECT USING (true);

CREATE POLICY "Sistema pode inserir andamentos"
  ON public.andamentos_processo FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar andamentos"
  ON public.andamentos_processo FOR UPDATE USING (true);

-- Políticas para documentos
CREATE POLICY "Usuários autenticados podem ver documentos"
  ON public.documentos_processo FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem inserir documentos"
  ON public.documentos_processo FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem deletar documentos"
  ON public.documentos_processo FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para histórico
CREATE POLICY "Admins e gestores podem ver histórico"
  ON public.historico_processo FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Sistema pode inserir histórico"
  ON public.historico_processo FOR INSERT WITH CHECK (true);

-- Políticas para alertas de prazo
CREATE POLICY "Usuários podem ver alertas de prazo"
  ON public.alertas_prazo FOR SELECT USING (true);

CREATE POLICY "Sistema pode gerenciar alertas"
  ON public.alertas_prazo FOR ALL USING (true);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.processos_judiciais;
ALTER PUBLICATION supabase_realtime ADD TABLE public.andamentos_processo;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_prazo;
