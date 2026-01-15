-- ================================================================
-- MÓDULO IA - Análises de clientes
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ia_analises_cliente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clients(id),
  usuario_id UUID,
  texto_observacao TEXT,
  resultado_ia TEXT,
  modelo_utilizado TEXT DEFAULT 'google/gemini-3-flash-preview',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ia_analises_cliente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view ia_analises" ON public.ia_analises_cliente FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert ia_analises" ON public.ia_analises_cliente FOR INSERT WITH CHECK (true);

-- ================================================================
-- Adicionar campo tipo junta_medica no campo tipo_pericia
-- ================================================================
-- Atualizar etiquetas para usar tipo ao invés de status para junta_medica
-- A tabela pericias já tem o campo tipo_pericia, precisamos adicionar 'junta_medica' como opção

-- ================================================================
-- COMISSÕES - Adicionar funcionalidade de reversão com log detalhado
-- ================================================================
-- Adicionar campo revertido_de e revertido_por para rastrear reversões
ALTER TABLE public.comissoes 
ADD COLUMN IF NOT EXISTS revertido_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revertido_por UUID,
ADD COLUMN IF NOT EXISTS revertido_motivo TEXT;

-- ================================================================
-- BAU - Melhorias na estrutura
-- ================================================================
-- Adicionar campos para melhor controle de hospitais
CREATE TABLE IF NOT EXISTS public.hospitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  rua TEXT NOT NULL,
  numero TEXT NOT NULL,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  cep TEXT NOT NULL,
  telefone1 TEXT NOT NULL,
  telefone2 TEXT,
  email TEXT,
  critico BOOLEAN DEFAULT false,
  motivo_critico TEXT,
  total_atrasos INTEGER DEFAULT 0,
  total_incompletos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view hospitais" ON public.hospitais FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert hospitais" ON public.hospitais FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update hospitais" ON public.hospitais FOR UPDATE USING (true);

-- Adicionar referência para hospital na tabela client_baus
ALTER TABLE public.client_baus 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id);

-- ================================================================
-- PROTOCOLOS - Adicionar tema e origem
-- ================================================================
ALTER TABLE public.protocolos 
ADD COLUMN IF NOT EXISTS tema TEXT,
ADD COLUMN IF NOT EXISTS origem TEXT;

-- ================================================================
-- WORKFLOW/TRIAGEM - Tabela para controle de fluxo obrigatório
-- ================================================================
CREATE TABLE IF NOT EXISTS public.client_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  -- Etapa 1: Cliente
  cliente_cadastrado BOOLEAN DEFAULT true,
  checklist_ia_status TEXT DEFAULT 'pendente', -- pendente, em_preenchimento, concluido
  -- Etapa 2: BAU
  bau_acionado BOOLEAN DEFAULT false,
  bau_status TEXT DEFAULT 'pendente', -- pendente, solicitado, recebido, incompleto
  bau_id UUID REFERENCES public.client_baus(id),
  -- Etapa 3: B.O.
  bo_status TEXT DEFAULT 'pendente', -- pendente, solicitado, recebido, incompleto, inexistente
  bo_numero TEXT,
  bo_data DATE,
  bo_orgao TEXT,
  -- Etapa 4: Laudo Médico
  laudo_status TEXT DEFAULT 'pendente', -- pendente, solicitado, recebido, incompleto, sem_laudo
  laudo_medico TEXT,
  laudo_crm TEXT,
  laudo_data DATE,
  laudo_cid TEXT,
  laudo_tipo_incapacidade TEXT, -- temporaria, permanente, em_avaliacao
  -- Etapa 5: Protocolo
  protocolo_status TEXT DEFAULT 'pendente', -- pendente, recebido, em_analise, distribuido, concluido
  protocolo_id UUID,
  -- Etapa 6: Setores finais
  pericia_liberada BOOLEAN DEFAULT false,
  financeiro_liberado BOOLEAN DEFAULT false,
  juridico_liberado BOOLEAN DEFAULT false,
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage client_workflow" ON public.client_workflow FOR ALL USING (true);

-- Log de alterações do workflow
CREATE TABLE IF NOT EXISTS public.client_workflow_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.client_workflow(id),
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_workflow_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view workflow_log" ON public.client_workflow_log FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert workflow_log" ON public.client_workflow_log FOR INSERT WITH CHECK (true);

-- ================================================================
-- CLIENTES - Campos adicionais para checklist IA e seguradoras
-- ================================================================
CREATE TABLE IF NOT EXISTS public.client_seguradoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nome_seguradora TEXT NOT NULL,
  tipo_produto TEXT, -- vida, ap, auto, prestamista, empresarial, cartao, outro
  numero_apolice TEXT,
  numero_certificado TEXT,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  status TEXT DEFAULT 'ativo', -- ativo, encerrado, nao_sabe
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_seguradoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage client_seguradoras" ON public.client_seguradoras FOR ALL USING (true);

-- Checklist IA completo
CREATE TABLE IF NOT EXISTS public.client_checklist_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  -- Identificação do caso
  tipo_ocorrencia TEXT, -- transito, trabalho, pessoal, outro
  data_evento DATE,
  cidade_uf_evento TEXT,
  bo_status TEXT, -- sim_anexado, sim_nao_anexado, nao, nao_sabe
  atendimento_medico BOOLEAN,
  internacao BOOLEAN,
  -- Bloco Trânsito
  perfil_vitima TEXT, -- motorista, passageiro, pedestre, ciclista, motoqueiro, etc
  usava_equipamento_seguranca TEXT, -- sim, nao, nao_sabe
  veiculos_envolvidos INTEGER,
  terceiro_identificado TEXT, -- sim, nao, nao_sabe
  placa_terceiro TEXT,
  terceiro_tem_seguro TEXT, -- sim, nao, nao_sabe
  veiculo_cliente TEXT, -- proprio, emprestado, alugado, empresa
  veiculo_financiado TEXT, -- quitado, financiado, consorcio, nao_sabe
  culpa_cliente TEXT, -- certo, errado, parcial, nao_sabe
  provas_disponiveis TEXT[], -- video, foto, testemunha, bo, laudos, orcamentos
  -- Danos
  lesao_corporal BOOLEAN,
  sequelas TEXT, -- sim, nao, em_avaliacao
  obito BOOLEAN,
  danos_materiais TEXT[], -- veiculo, celular, oculos, roupa, outros
  afastamento BOOLEAN,
  -- Bloco Trabalho
  trabalhava BOOLEAN,
  regime_trabalho TEXT, -- clt, mei, autonomo, informal, servidor
  empresa_cnpj TEXT,
  funcao_cargo TEXT,
  havia_epi BOOLEAN,
  havia_treinamento BOOLEAN,
  houve_cat BOOLEAN,
  tipo_acidente_trabalho TEXT, -- dentro, trajeto, fora
  -- Bloco INSS
  contribuia_inss BOOLEAN,
  afastamento_15_dias BOOLEAN,
  recebeu_beneficio BOOLEAN,
  beneficio_recebido TEXT,
  incapacidade_atual TEXT, -- sim, nao, em_avaliacao
  sequela_permanente TEXT, -- sim, nao
  -- Bloco Seguros (caça-seguro)
  tem_conta_banco BOOLEAN,
  tem_cartao_credito BOOLEAN,
  fez_financiamento BOOLEAN,
  tem_emprestimo BOOLEAN,
  usa_fintech BOOLEAN,
  e_clt BOOLEAN,
  e_motorista_app BOOLEAN,
  veiculo_segurado BOOLEAN,
  -- Bloco Responsabilidade Civil
  dano_material_comprovavel BOOLEAN,
  tipos_gastos TEXT[], -- medico, remedios, fisioterapia, transporte, reparos, outros
  impacto_moral TEXT[], -- dor, humilhacao, abalo, limitacao
  perda_renda BOOLEAN,
  -- Status do checklist
  status TEXT DEFAULT 'pendente', -- pendente, em_preenchimento, concluido
  concluido_em TIMESTAMP WITH TIME ZONE,
  concluido_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_checklist_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage client_checklist_ia" ON public.client_checklist_ia FOR ALL USING (true);

-- ================================================================
-- Enable realtime
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ia_analises_cliente;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitais;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_workflow;

-- ================================================================
-- Trigger para log automático do workflow
-- ================================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_workflow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.checklist_ia_status IS DISTINCT FROM NEW.checklist_ia_status THEN
      INSERT INTO public.client_workflow_log (workflow_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'checklist_ia_status', OLD.checklist_ia_status, NEW.checklist_ia_status, auth.uid());
    END IF;
    IF OLD.bau_status IS DISTINCT FROM NEW.bau_status THEN
      INSERT INTO public.client_workflow_log (workflow_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'bau_status', OLD.bau_status, NEW.bau_status, auth.uid());
    END IF;
    IF OLD.bo_status IS DISTINCT FROM NEW.bo_status THEN
      INSERT INTO public.client_workflow_log (workflow_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'bo_status', OLD.bo_status, NEW.bo_status, auth.uid());
    END IF;
    IF OLD.laudo_status IS DISTINCT FROM NEW.laudo_status THEN
      INSERT INTO public.client_workflow_log (workflow_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'laudo_status', OLD.laudo_status, NEW.laudo_status, auth.uid());
    END IF;
    IF OLD.protocolo_status IS DISTINCT FROM NEW.protocolo_status THEN
      INSERT INTO public.client_workflow_log (workflow_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'protocolo_status', OLD.protocolo_status, NEW.protocolo_status, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_workflow_historico ON public.client_workflow;
CREATE TRIGGER trigger_workflow_historico
AFTER UPDATE ON public.client_workflow
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_workflow();

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_client_workflow_updated_at ON public.client_workflow;
CREATE TRIGGER update_client_workflow_updated_at
BEFORE UPDATE ON public.client_workflow
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospitais_updated_at ON public.hospitais;
CREATE TRIGGER update_hospitais_updated_at
BEFORE UPDATE ON public.hospitais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_checklist_ia_updated_at ON public.client_checklist_ia;
CREATE TRIGGER update_client_checklist_ia_updated_at
BEFORE UPDATE ON public.client_checklist_ia
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();