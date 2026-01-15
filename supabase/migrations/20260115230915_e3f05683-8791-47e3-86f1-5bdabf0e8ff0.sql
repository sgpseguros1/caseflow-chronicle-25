-- Adicionar campos de IA na tabela processos_judiciais
ALTER TABLE public.processos_judiciais 
ADD COLUMN IF NOT EXISTS ia_resumo_processo TEXT,
ADD COLUMN IF NOT EXISTS ia_entendimento TEXT,
ADD COLUMN IF NOT EXISTS ia_acao_necessaria TEXT,
ADD COLUMN IF NOT EXISTS ia_proxima_acao_sugerida TEXT,
ADD COLUMN IF NOT EXISTS ia_risco_processual VARCHAR DEFAULT 'nao_avaliado',
ADD COLUMN IF NOT EXISTS ia_impacto_financeiro VARCHAR DEFAULT 'nao_avaliado',
ADD COLUMN IF NOT EXISTS ia_depende_bau BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ia_depende_cliente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ia_depende_pericia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ia_analisado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processo_parado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dias_parado INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processo_critico BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prazo_aberto BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipo_prazo VARCHAR,
ADD COLUMN IF NOT EXISTS prazo_acao_quem VARCHAR,
ADD COLUMN IF NOT EXISTS prazo_data_final DATE,
ADD COLUMN IF NOT EXISTS prazo_dias_restantes INTEGER,
ADD COLUMN IF NOT EXISTS honorarios_estimados NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS custas_totais NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clients(id),
ADD COLUMN IF NOT EXISTS advogado_auxiliar_id UUID REFERENCES public.advogados(id),
ADD COLUMN IF NOT EXISTS bau_vinculado_id UUID REFERENCES public.client_baus(id);

-- Criar tabela para análises de IA dos andamentos
CREATE TABLE IF NOT EXISTS public.andamentos_ia_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  andamento_id UUID NOT NULL REFERENCES public.andamentos_processo(id) ON DELETE CASCADE,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  texto_original TEXT NOT NULL,
  
  -- Análise da IA
  gera_prazo BOOLEAN DEFAULT FALSE,
  quem_deve_agir VARCHAR,
  acao_exigida TEXT,
  tipo_peca_provavel VARCHAR,
  categoria_andamento VARCHAR,
  
  -- Prazo calculado
  prazo_dias_uteis INTEGER,
  prazo_data_final DATE,
  
  -- Alertas gerados
  alerta_10_dias BOOLEAN DEFAULT FALSE,
  alerta_5_dias BOOLEAN DEFAULT FALSE,
  alerta_1_dia BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  modelo_utilizado VARCHAR,
  analisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para histórico completo de análises
CREATE TABLE IF NOT EXISTS public.processo_ia_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_judiciais(id) ON DELETE CASCADE,
  tipo_analise VARCHAR NOT NULL,
  resultado_analise JSONB,
  modelo_utilizado VARCHAR,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_andamentos_ia_processo ON public.andamentos_ia_analise(processo_id);
CREATE INDEX IF NOT EXISTS idx_andamentos_ia_gera_prazo ON public.andamentos_ia_analise(gera_prazo) WHERE gera_prazo = true;
CREATE INDEX IF NOT EXISTS idx_processo_ia_historico_processo ON public.processo_ia_historico(processo_id);
CREATE INDEX IF NOT EXISTS idx_processos_parados ON public.processos_judiciais(processo_parado) WHERE processo_parado = true;
CREATE INDEX IF NOT EXISTS idx_processos_criticos ON public.processos_judiciais(processo_critico) WHERE processo_critico = true;
CREATE INDEX IF NOT EXISTS idx_processos_prazo_aberto ON public.processos_judiciais(prazo_aberto) WHERE prazo_aberto = true;

-- Enable RLS
ALTER TABLE public.andamentos_ia_analise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_ia_historico ENABLE ROW LEVEL SECURITY;

-- Policies para andamentos_ia_analise
CREATE POLICY "Authenticated users can view andamentos_ia_analise"
ON public.andamentos_ia_analise FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert andamentos_ia_analise"
ON public.andamentos_ia_analise FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update andamentos_ia_analise"
ON public.andamentos_ia_analise FOR UPDATE TO authenticated USING (true);

-- Policies para processo_ia_historico
CREATE POLICY "Authenticated users can view processo_ia_historico"
ON public.processo_ia_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert processo_ia_historico"
ON public.processo_ia_historico FOR INSERT TO authenticated WITH CHECK (true);

-- Função para calcular dias parado e marcar como crítico
CREATE OR REPLACE FUNCTION public.atualizar_status_processo_parado()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular dias desde última movimentação
  IF NEW.data_ultima_movimentacao IS NOT NULL THEN
    NEW.dias_parado = EXTRACT(DAY FROM (now() - NEW.data_ultima_movimentacao));
    NEW.processo_parado = NEW.dias_parado > 15;
    NEW.processo_critico = NEW.dias_parado > 45;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar status de processo parado
DROP TRIGGER IF EXISTS trigger_atualizar_status_parado ON public.processos_judiciais;
CREATE TRIGGER trigger_atualizar_status_parado
BEFORE INSERT OR UPDATE ON public.processos_judiciais
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_status_processo_parado();