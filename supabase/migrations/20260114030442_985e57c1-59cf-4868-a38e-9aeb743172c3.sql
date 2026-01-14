-- Tabela para OABs monitoradas
CREATE TABLE public.oab_monitoradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_oab VARCHAR(20) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  nome_advogado VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(numero_oab, uf)
);

-- Tabela para processos sincronizados do DataJud
CREATE TABLE public.processos_sincronizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oab_id UUID REFERENCES public.oab_monitoradas(id) ON DELETE CASCADE,
  numero_processo VARCHAR(50) NOT NULL UNIQUE,
  classe_processual VARCHAR(255),
  assunto VARCHAR(500),
  tribunal VARCHAR(100),
  orgao_julgador VARCHAR(255),
  data_ajuizamento DATE,
  ultimo_movimento TEXT,
  data_ultimo_movimento TIMESTAMP WITH TIME ZONE,
  situacao VARCHAR(100),
  nivel_sigilo VARCHAR(50) DEFAULT 'publico',
  link_externo TEXT,
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para movimentações processuais
CREATE TABLE public.movimentacoes_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos_sincronizados(id) ON DELETE CASCADE,
  data_movimento TIMESTAMP WITH TIME ZONE NOT NULL,
  codigo_movimento INTEGER,
  descricao TEXT NOT NULL,
  complemento TEXT,
  decisao_teor TEXT,
  prazo_dias INTEGER,
  prazo_fatal DATE,
  urgente BOOLEAN DEFAULT false,
  lido BOOLEAN DEFAULT false,
  lido_por UUID REFERENCES auth.users(id),
  lido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para tarefas do Rafael
CREATE TABLE public.tarefas_rafael (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  enviado_por UUID REFERENCES auth.users(id) NOT NULL,
  cliente_id UUID REFERENCES public.clients(id),
  processo_id UUID REFERENCES public.processos(id),
  protocolo_id UUID REFERENCES public.protocolos(id),
  prazo DATE,
  resposta TEXT,
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para mensagens do chat interno
CREATE TABLE public.mensagens_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID REFERENCES auth.users(id) NOT NULL,
  destinatario_id UUID REFERENCES auth.users(id) NOT NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_processos_sincronizados_oab ON public.processos_sincronizados(oab_id);
CREATE INDEX idx_movimentacoes_processo ON public.movimentacoes_processo(processo_id);
CREATE INDEX idx_movimentacoes_urgente ON public.movimentacoes_processo(urgente, lido);
CREATE INDEX idx_tarefas_rafael_status ON public.tarefas_rafael(status);
CREATE INDEX idx_mensagens_chat_remetente ON public.mensagens_chat(remetente_id);
CREATE INDEX idx_mensagens_chat_destinatario ON public.mensagens_chat(destinatario_id);
CREATE INDEX idx_mensagens_chat_conversa ON public.mensagens_chat(remetente_id, destinatario_id);

-- Habilitar RLS
ALTER TABLE public.oab_monitoradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_sincronizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_rafael ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;

-- Políticas para oab_monitoradas (usuários autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver OABs" ON public.oab_monitoradas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin e gestor podem inserir OABs" ON public.oab_monitoradas
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin e gestor podem atualizar OABs" ON public.oab_monitoradas
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Apenas admin pode deletar OABs" ON public.oab_monitoradas
  FOR DELETE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para processos_sincronizados (usuários autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver processos" ON public.processos_sincronizados
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sistema pode inserir processos" ON public.processos_sincronizados
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar processos" ON public.processos_sincronizados
  FOR UPDATE TO authenticated USING (true);

-- Políticas para movimentacoes_processo
CREATE POLICY "Usuários autenticados podem ver movimentações" ON public.movimentacoes_processo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sistema pode inserir movimentações" ON public.movimentacoes_processo
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar movimentações" ON public.movimentacoes_processo
  FOR UPDATE TO authenticated USING (true);

-- Políticas para tarefas_rafael
CREATE POLICY "Usuários podem ver tarefas que enviaram" ON public.tarefas_rafael
  FOR SELECT TO authenticated 
  USING (enviado_por = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem criar tarefas" ON public.tarefas_rafael
  FOR INSERT TO authenticated 
  WITH CHECK (enviado_por = auth.uid());

CREATE POLICY "Admin pode atualizar tarefas" ON public.tarefas_rafael
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para mensagens_chat (APENAS remetente e destinatário podem ver)
CREATE POLICY "Apenas participantes podem ver mensagens" ON public.mensagens_chat
  FOR SELECT TO authenticated 
  USING (remetente_id = auth.uid() OR destinatario_id = auth.uid());

CREATE POLICY "Usuários podem enviar mensagens" ON public.mensagens_chat
  FOR INSERT TO authenticated 
  WITH CHECK (remetente_id = auth.uid());

CREATE POLICY "Destinatário pode marcar como lida" ON public.mensagens_chat
  FOR UPDATE TO authenticated 
  USING (destinatario_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_oab_monitoradas_updated_at
  BEFORE UPDATE ON public.oab_monitoradas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_processos_sincronizados_updated_at
  BEFORE UPDATE ON public.processos_sincronizados
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tarefas_rafael_updated_at
  BEFORE UPDATE ON public.tarefas_rafael
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar realtime para chat e tarefas
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_rafael;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimentacoes_processo;