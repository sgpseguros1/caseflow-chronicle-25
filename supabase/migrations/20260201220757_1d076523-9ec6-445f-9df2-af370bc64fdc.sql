-- MÓDULO PRAZO ZERO - Sistema de Gestão de E-mails, Tarefas e Prazos

-- Enum para tipos de categoria de e-mail
CREATE TYPE public.email_categoria AS ENUM (
  'prazo_processual',
  'intimacao',
  'audiencia',
  'pagamento',
  'cobranca',
  'cliente_retorno',
  'documentacao_pendente',
  'ignorar',
  'nao_classificado'
);

-- Enum para prioridade
CREATE TYPE public.prazo_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Enum para status de tarefa
CREATE TYPE public.tarefa_status_pz AS ENUM ('pendente', 'em_andamento', 'aguardando', 'concluida', 'cancelada');

-- Tabela de caixas de e-mail conectadas
CREATE TABLE public.pz_caixas_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  provedor VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'imap'
  tokens_encrypted TEXT, -- tokens OAuth criptografados
  config_imap JSONB, -- config para IMAP (host, port, etc)
  ativo BOOLEAN DEFAULT true,
  ultima_sincronizacao TIMESTAMPTZ,
  criado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de e-mails sincronizados
CREATE TABLE public.pz_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID REFERENCES pz_caixas_email(id) ON DELETE CASCADE,
  message_id VARCHAR(500) UNIQUE, -- ID único do e-mail no provedor
  remetente VARCHAR(255),
  remetente_nome VARCHAR(255),
  destinatarios TEXT[],
  assunto TEXT,
  corpo_texto TEXT,
  corpo_html TEXT,
  data_recebimento TIMESTAMPTZ,
  tem_anexos BOOLEAN DEFAULT false,
  anexos JSONB, -- [{nome, tipo, tamanho, path}]
  -- Classificação IA
  categoria email_categoria DEFAULT 'nao_classificado',
  confianca_ia DECIMAL(3,2), -- 0.00 a 1.00
  classificado_manualmente BOOLEAN DEFAULT false,
  -- Dados extraídos pela IA
  dados_extraidos JSONB, -- {valor, data_prazo, processo, tribunal, cliente}
  -- Status
  processado BOOLEAN DEFAULT false,
  triagem_pendente BOOLEAN DEFAULT true,
  lido BOOLEAN DEFAULT false,
  lido_por UUID REFERENCES profiles(id),
  lido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tarefas do PRAZO ZERO
CREATE TABLE public.pz_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  -- Relacionamentos
  email_origem_id UUID REFERENCES pz_emails(id),
  cliente_id UUID REFERENCES clients(id),
  processo_id UUID REFERENCES processos(id),
  protocolo_id UUID REFERENCES protocolos(id),
  -- Configurações
  categoria email_categoria,
  prioridade prazo_prioridade DEFAULT 'media',
  status tarefa_status_pz DEFAULT 'pendente',
  -- Prazos
  data_prazo TIMESTAMPTZ,
  data_prazo_alerta_7d BOOLEAN DEFAULT false,
  data_prazo_alerta_3d BOOLEAN DEFAULT false,
  data_prazo_alerta_1d BOOLEAN DEFAULT false,
  data_prazo_alerta_12h BOOLEAN DEFAULT false,
  data_prazo_alerta_2h BOOLEAN DEFAULT false,
  -- Valores (para pagamentos)
  valor DECIMAL(15,2),
  -- Responsáveis
  criado_por UUID REFERENCES profiles(id),
  responsavel_id UUID REFERENCES profiles(id),
  delegado_por UUID REFERENCES profiles(id),
  delegado_em TIMESTAMPTZ,
  -- Conclusão
  concluido_por UUID REFERENCES profiles(id),
  concluido_em TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de checklist das tarefas
CREATE TABLE public.pz_tarefa_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES pz_tarefas(id) ON DELETE CASCADE,
  texto VARCHAR(500) NOT NULL,
  concluido BOOLEAN DEFAULT false,
  concluido_por UUID REFERENCES profiles(id),
  concluido_em TIMESTAMPTZ,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de comentários nas tarefas
CREATE TABLE public.pz_tarefa_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES pz_tarefas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de anexos das tarefas
CREATE TABLE public.pz_tarefa_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES pz_tarefas(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho BIGINT,
  path_storage TEXT NOT NULL,
  origem VARCHAR(50), -- 'email', 'upload'
  enviado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de eventos da agenda
CREATE TABLE public.pz_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL, -- 'prazo', 'audiencia', 'pagamento', 'reuniao', 'outro'
  -- Datas
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  dia_inteiro BOOLEAN DEFAULT false,
  -- Relacionamentos
  tarefa_id UUID REFERENCES pz_tarefas(id),
  cliente_id UUID REFERENCES clients(id),
  processo_id UUID REFERENCES processos(id),
  -- Responsável
  responsavel_id UUID REFERENCES profiles(id),
  criado_por UUID REFERENCES profiles(id),
  -- Status
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de regras automáticas
CREATE TABLE public.pz_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  -- Condições (JSON para flexibilidade)
  condicoes JSONB NOT NULL, -- {palavras: [], remetentes: [], categoria: ''}
  -- Ações
  acao_categoria email_categoria,
  acao_responsavel_id UUID REFERENCES profiles(id),
  acao_prioridade prazo_prioridade,
  acao_criar_tarefa BOOLEAN DEFAULT true,
  acao_checklist_padrao JSONB, -- [{texto: ''}]
  -- Metadata
  criado_por UUID REFERENCES profiles(id),
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de logs de auditoria do PRAZO ZERO
CREATE TABLE public.pz_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'email_lido', 'tarefa_criada', 'anexo_baixado', etc
  entidade VARCHAR(50), -- 'email', 'tarefa', 'anexo'
  entidade_id UUID,
  usuario_id UUID REFERENCES profiles(id),
  detalhes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para templates de checklist por categoria
CREATE TABLE public.pz_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria email_categoria NOT NULL,
  nome VARCHAR(255) NOT NULL,
  itens JSONB NOT NULL, -- [{texto: '', ordem: 0}]
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão de checklist
INSERT INTO public.pz_checklist_templates (categoria, nome, itens) VALUES
('intimacao', 'Checklist Intimação', '[{"texto": "Ler publicação completa", "ordem": 1}, {"texto": "Baixar PDF do DJE", "ordem": 2}, {"texto": "Lançar prazo no sistema", "ordem": 3}, {"texto": "Avisar cliente", "ordem": 4}, {"texto": "Preparar peça/resposta", "ordem": 5}]'),
('audiencia', 'Checklist Audiência', '[{"texto": "Confirmar data e horário", "ordem": 1}, {"texto": "Preparar documentos", "ordem": 2}, {"texto": "Confirmar presença do cliente", "ordem": 3}, {"texto": "Revisar autos", "ordem": 4}, {"texto": "Preparar perguntas/alegações", "ordem": 5}]'),
('pagamento', 'Checklist Pagamento', '[{"texto": "Verificar valor e vencimento", "ordem": 1}, {"texto": "Confirmar dados bancários", "ordem": 2}, {"texto": "Aprovar com gestor", "ordem": 3}, {"texto": "Efetuar pagamento", "ordem": 4}, {"texto": "Guardar comprovante", "ordem": 5}]'),
('prazo_processual', 'Checklist Prazo Processual', '[{"texto": "Identificar prazo exato", "ordem": 1}, {"texto": "Verificar dias úteis/corridos", "ordem": 2}, {"texto": "Lançar na agenda", "ordem": 3}, {"texto": "Atribuir responsável", "ordem": 4}, {"texto": "Preparar resposta", "ordem": 5}]');

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pz_caixas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_tarefa_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_tarefa_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_tarefa_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pz_checklist_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Caixas de email (apenas admin/master)
CREATE POLICY "Admins podem gerenciar caixas de email" ON public.pz_caixas_email
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS - Emails (todos autenticados podem ver)
CREATE POLICY "Usuarios autenticados podem ver emails" ON public.pz_emails
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem gerenciar emails" ON public.pz_emails
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS - Tarefas (usuários veem as atribuídas ou criadas)
CREATE POLICY "Usuarios veem suas tarefas" ON public.pz_tarefas
FOR SELECT TO authenticated USING (
  responsavel_id = auth.uid() OR 
  criado_por = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Usuarios podem criar tarefas" ON public.pz_tarefas
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios podem editar suas tarefas" ON public.pz_tarefas
FOR UPDATE TO authenticated USING (
  responsavel_id = auth.uid() OR 
  criado_por = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Apenas admins podem excluir tarefas" ON public.pz_tarefas
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para subtabelas de tarefas
CREATE POLICY "Usuarios veem checklist de suas tarefas" ON public.pz_tarefa_checklist
FOR ALL TO authenticated USING (true);

CREATE POLICY "Usuarios veem comentarios de suas tarefas" ON public.pz_tarefa_comentarios
FOR ALL TO authenticated USING (true);

CREATE POLICY "Usuarios veem anexos de suas tarefas" ON public.pz_tarefa_anexos
FOR ALL TO authenticated USING (true);

-- Políticas RLS - Agenda
CREATE POLICY "Usuarios veem agenda" ON public.pz_agenda
FOR SELECT TO authenticated USING (
  responsavel_id = auth.uid() OR 
  criado_por = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Usuarios podem criar eventos" ON public.pz_agenda
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios podem editar seus eventos" ON public.pz_agenda
FOR UPDATE TO authenticated USING (
  responsavel_id = auth.uid() OR 
  criado_por = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Políticas RLS - Regras (apenas admin)
CREATE POLICY "Admins gerenciam regras" ON public.pz_regras
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS - Logs (admins veem todos, usuarios veem seus)
CREATE POLICY "Usuarios veem seus logs" ON public.pz_logs
FOR SELECT TO authenticated USING (
  usuario_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sistema pode criar logs" ON public.pz_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas RLS - Templates (todos podem ver)
CREATE POLICY "Todos podem ver templates" ON public.pz_checklist_templates
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam templates" ON public.pz_checklist_templates
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_pz_caixas_email_updated_at BEFORE UPDATE ON public.pz_caixas_email
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pz_tarefas_updated_at BEFORE UPDATE ON public.pz_tarefas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pz_agenda_updated_at BEFORE UPDATE ON public.pz_agenda
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pz_regras_updated_at BEFORE UPDATE ON public.pz_regras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para tarefas e emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.pz_tarefas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pz_emails;