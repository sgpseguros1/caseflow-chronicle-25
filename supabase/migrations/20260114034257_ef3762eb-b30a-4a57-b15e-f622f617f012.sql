-- Criar função de atualização de timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de solicitações entre usuários/funcionários
CREATE TABLE IF NOT EXISTS public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  processo_id UUID REFERENCES public.processos(id) ON DELETE SET NULL,
  protocolo_id UUID REFERENCES public.protocolos(id) ON DELETE SET NULL,
  prazo TIMESTAMPTZ,
  resposta TEXT,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários podem ver solicitações que enviaram ou receberam
CREATE POLICY "Usuários podem ver suas solicitações enviadas" ON public.solicitacoes
  FOR SELECT USING (auth.uid() = remetente_id);

CREATE POLICY "Usuários podem ver solicitações recebidas" ON public.solicitacoes
  FOR SELECT USING (auth.uid() = destinatario_id);

CREATE POLICY "Usuários podem criar solicitações" ON public.solicitacoes
  FOR INSERT WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Remetentes podem atualizar suas solicitações" ON public.solicitacoes
  FOR UPDATE USING (auth.uid() = remetente_id);

CREATE POLICY "Destinatários podem responder solicitações" ON public.solicitacoes
  FOR UPDATE USING (auth.uid() = destinatario_id);

-- Trigger para updated_at
CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes;