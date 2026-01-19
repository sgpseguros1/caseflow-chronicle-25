-- Tabela para registrar atribuições automáticas de responsável
CREATE TABLE IF NOT EXISTS public.atribuicao_automatica_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo_id UUID REFERENCES public.protocolos(id),
  responsavel_anterior_id UUID REFERENCES public.funcionarios(id),
  responsavel_novo_id UUID REFERENCES public.funcionarios(id),
  motivo TEXT NOT NULL,
  usuario_ultima_interacao UUID REFERENCES public.profiles(id),
  historico_id UUID,
  alerta_id UUID REFERENCES public.alertas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_atribuicao_log_protocolo ON public.atribuicao_automatica_log(protocolo_id);
CREATE INDEX idx_atribuicao_log_responsavel ON public.atribuicao_automatica_log(responsavel_novo_id);
CREATE INDEX idx_atribuicao_log_created ON public.atribuicao_automatica_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.atribuicao_automatica_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view atribuicao logs" 
ON public.atribuicao_automatica_log 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "System can insert atribuicao logs" 
ON public.atribuicao_automatica_log 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Adicionar campo para rastrear alertas críticos de responsável
ALTER TABLE public.alertas 
ADD COLUMN IF NOT EXISTS protocolo_id UUID REFERENCES public.protocolos(id),
ADD COLUMN IF NOT EXISTS atribuicao_automatica BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS responsavel_atribuido_id UUID REFERENCES public.funcionarios(id);

-- Índice para busca de alertas por protocolo
CREATE INDEX IF NOT EXISTS idx_alertas_protocolo ON public.alertas(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_alertas_responsavel_atribuido ON public.alertas(responsavel_atribuido_id);

-- Enable realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;