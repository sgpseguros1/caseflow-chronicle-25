-- ============================================
-- CORREÇÃO DO VALOR_PENDENTE (COLUNA GERADA)
-- A coluna valor_pendente é GENERATED e não pode receber valores no INSERT
-- Não é necessário alteração - apenas remover do INSERT no código
-- ============================================

-- ============================================
-- TABELA: pericias (Perícias Agendadas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pericias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clients(id),
  tipo_pericia TEXT NOT NULL CHECK (tipo_pericia IN (
    'inss', 'auxilio_doenca', 'auxilio_acidente', 'dpvat', 
    'seguro_vida', 'judicial', 'acidente_trabalho', 'danos', 'outros'
  )),
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN (
    'agendada', 'realizada_aguardando_pagamento', 'cliente_faltou', 'junta_medica'
  )),
  data_pericia DATE NOT NULL,
  hora_pericia TIME,
  medico_responsavel TEXT,
  crm_medico TEXT,
  clinica_nome TEXT,
  clinica_endereco TEXT,
  clinica_numero TEXT,
  clinica_bairro TEXT,
  clinica_cidade TEXT,
  clinica_cep TEXT,
  clinica_telefone TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_pericias_updated_at
  BEFORE UPDATE ON public.pericias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABELA: juntas_medicas
-- ============================================
CREATE TABLE IF NOT EXISTS public.juntas_medicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pericia_id UUID NOT NULL REFERENCES public.pericias(id) ON DELETE CASCADE,
  local_junta TEXT NOT NULL,
  endereco_junta TEXT,
  data_junta DATE NOT NULL,
  hora_junta TIME,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: junta_medicos (3 médicos por junta)
-- ============================================
CREATE TABLE IF NOT EXISTS public.junta_medicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  junta_id UUID NOT NULL REFERENCES public.juntas_medicas(id) ON DELETE CASCADE,
  nome_medico TEXT NOT NULL,
  crm TEXT NOT NULL,
  especialidade TEXT,
  endereco_profissional TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: pericia_logs (Histórico/Auditoria)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pericia_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pericia_id UUID NOT NULL REFERENCES public.pericias(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ADICIONAR pericia_id NA TABELA lancamentos_financeiros
-- Para vincular indenização à perícia
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lancamentos_financeiros' 
    AND column_name = 'pericia_id'
  ) THEN
    ALTER TABLE public.lancamentos_financeiros 
    ADD COLUMN pericia_id UUID REFERENCES public.pericias(id);
  END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Pericias
ALTER TABLE public.pericias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pericias visíveis para todos autenticados"
  ON public.pericias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pericias podem ser criadas por autenticados"
  ON public.pericias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pericias podem ser atualizadas por autenticados"
  ON public.pericias FOR UPDATE
  TO authenticated
  USING (true);

-- SEM política de DELETE - ninguém pode excluir

-- Juntas Médicas
ALTER TABLE public.juntas_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Juntas visíveis para todos autenticados"
  ON public.juntas_medicas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Juntas podem ser criadas por autenticados"
  ON public.juntas_medicas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Juntas podem ser atualizadas por autenticados"
  ON public.juntas_medicas FOR UPDATE
  TO authenticated
  USING (true);

-- Junta Medicos
ALTER TABLE public.junta_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Junta medicos visíveis para todos autenticados"
  ON public.junta_medicos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Junta medicos podem ser criados por autenticados"
  ON public.junta_medicos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Junta medicos podem ser atualizados por autenticados"
  ON public.junta_medicos FOR UPDATE
  TO authenticated
  USING (true);

-- Pericia Logs
ALTER TABLE public.pericia_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs visíveis para todos autenticados"
  ON public.pericia_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Logs podem ser criados por autenticados"
  ON public.pericia_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- TRIGGER PARA LOG AUTOMÁTICO DE ALTERAÇÃO DE STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.registrar_log_pericia()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pericia_logs (pericia_id, usuario_id, acao, status_novo, dados_novos)
    VALUES (NEW.id, auth.uid(), 'criacao', NEW.status, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.pericia_logs (pericia_id, usuario_id, acao, status_anterior, status_novo, dados_anteriores, dados_novos)
      VALUES (NEW.id, auth.uid(), 'alteracao_status', OLD.status, NEW.status, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSE
      INSERT INTO public.pericia_logs (pericia_id, usuario_id, acao, dados_anteriores, dados_novos)
      VALUES (NEW.id, auth.uid(), 'edicao', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_pericia
  AFTER INSERT OR UPDATE ON public.pericias
  FOR EACH ROW EXECUTE FUNCTION public.registrar_log_pericia();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.pericias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pericia_logs;