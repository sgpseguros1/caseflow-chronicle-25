-- =============================================
-- PAINEL DE TAREFAS DO USUÁRIO - Nova Estrutura
-- =============================================

-- Adicionar novas colunas à tabela tarefas_rafael
ALTER TABLE public.tarefas_rafael 
ADD COLUMN IF NOT EXISTS tipo_solicitacao VARCHAR(30) DEFAULT 'cliente' CHECK (tipo_solicitacao IN ('cliente', 'conversa_interna')),
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS iniciado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tempo_resolucao_segundos INTEGER,
ADD COLUMN IF NOT EXISTS atrasada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_exibido BOOLEAN DEFAULT false;

-- Tabela para mensagens internas da tarefa (chat dentro da tarefa)
CREATE TABLE IF NOT EXISTS public.tarefa_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES public.tarefas_rafael(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para métricas de usuário (calculadas mensalmente)
CREATE TABLE IF NOT EXISTS public.tarefas_metricas_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_recebidas INTEGER DEFAULT 0,
  total_concluidas INTEGER DEFAULT 0,
  total_pendentes INTEGER DEFAULT 0,
  total_urgentes INTEGER DEFAULT 0,
  tempo_medio_resolucao_segundos INTEGER DEFAULT 0,
  percentual_em_5_minutos DECIMAL(5,2) DEFAULT 0,
  feedback_gerado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id, ano, mes)
);

-- Tabela para histórico de ações nas tarefas (auditoria)
CREATE TABLE IF NOT EXISTS public.tarefas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES public.tarefas_rafael(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  acao VARCHAR(50) NOT NULL,
  descricao TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarefa_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_metricas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_historico ENABLE ROW LEVEL SECURITY;

-- Policies para tarefa_mensagens
CREATE POLICY "Authenticated users can view task messages" ON public.tarefa_mensagens
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert task messages" ON public.tarefa_mensagens
FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Policies para tarefas_metricas_usuario
CREATE POLICY "Users can view their own metrics" ON public.tarefas_metricas_usuario
FOR SELECT TO authenticated USING (
  auth.uid() = usuario_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "System can manage metrics" ON public.tarefas_metricas_usuario
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies para tarefas_historico
CREATE POLICY "Authenticated users can view task history" ON public.tarefas_historico
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert task history" ON public.tarefas_historico
FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger para atualizar updated_at em tarefas_metricas_usuario
CREATE TRIGGER update_tarefas_metricas_usuario_updated_at
BEFORE UPDATE ON public.tarefas_metricas_usuario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar histórico quando tarefa é modificada
CREATE OR REPLACE FUNCTION public.registrar_historico_tarefa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.tarefas_historico (tarefa_id, usuario_id, acao, descricao, dados_anteriores, dados_novos)
      VALUES (NEW.id, auth.uid(), 'alteracao_status', 
        'Status alterado de ' || OLD.status || ' para ' || NEW.status,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
    
    -- Calcular tempo de resolução quando concluída
    IF OLD.status != 'concluida' AND NEW.status = 'concluida' THEN
      NEW.concluido_em = now();
      IF NEW.iniciado_em IS NOT NULL THEN
        NEW.tempo_resolucao_segundos = EXTRACT(EPOCH FROM (NEW.concluido_em - NEW.iniciado_em))::INTEGER;
      ELSE
        NEW.tempo_resolucao_segundos = EXTRACT(EPOCH FROM (NEW.concluido_em - NEW.created_at))::INTEGER;
      END IF;
      
      -- Marcar como atrasada se passou de 5 minutos (300 segundos)
      IF NEW.tempo_resolucao_segundos > 300 THEN
        NEW.atrasada = true;
      END IF;
    END IF;
    
    -- Registrar início quando muda para em_andamento
    IF OLD.status != 'em_andamento' AND NEW.status = 'em_andamento' AND NEW.iniciado_em IS NULL THEN
      NEW.iniciado_em = now();
    END IF;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.tarefas_historico (tarefa_id, usuario_id, acao, descricao)
    VALUES (NEW.id, auth.uid(), 'criacao', 'Tarefa criada: ' || NEW.titulo);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_historico_tarefa ON public.tarefas_rafael;
CREATE TRIGGER trigger_historico_tarefa
BEFORE INSERT OR UPDATE ON public.tarefas_rafael
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico_tarefa();

-- Enable realtime para as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefa_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_historico;