-- Adicionar novos status e campos para arquivamento/conclusão de BAU
-- Status 'arquivado' e 'concluido' além do já existente 'cancelado'
-- Adicionar campos para justificativa obrigatória e auditoria

-- Adicionar colunas para arquivamento/conclusão
ALTER TABLE public.client_baus 
ADD COLUMN IF NOT EXISTS justificativa_conclusao TEXT,
ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS concluido_por UUID;

-- Atualizar trigger de histórico para incluir novos campos
CREATE OR REPLACE FUNCTION public.registrar_historico_bau()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    
    -- Fase cobranca change
    IF OLD.fase_cobranca IS DISTINCT FROM NEW.fase_cobranca THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'fase_cobranca', OLD.fase_cobranca, NEW.fase_cobranca, auth.uid());
    END IF;
    
    -- Responsavel change
    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'responsavel_id', OLD.responsavel_id::TEXT, NEW.responsavel_id::TEXT, auth.uid());
    END IF;
    
    -- Qualidade status change
    IF OLD.qualidade_status IS DISTINCT FROM NEW.qualidade_status THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'qualidade_status', OLD.qualidade_status, NEW.qualidade_status, auth.uid());
    END IF;
    
    -- Previsao entrega change
    IF OLD.previsao_entrega IS DISTINCT FROM NEW.previsao_entrega THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'previsao_entrega', OLD.previsao_entrega::TEXT, NEW.previsao_entrega::TEXT, auth.uid());
    END IF;
    
    -- Data recebimento change  
    IF OLD.data_recebimento IS DISTINCT FROM NEW.data_recebimento THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'data_recebimento', OLD.data_recebimento::TEXT, NEW.data_recebimento::TEXT, auth.uid());
    END IF;
    
    -- Justificativa conclusão (novo)
    IF OLD.justificativa_conclusao IS DISTINCT FROM NEW.justificativa_conclusao THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'justificativa_conclusao', OLD.justificativa_conclusao, NEW.justificativa_conclusao, auth.uid());
    END IF;
    
    -- Registrar conclusão/arquivamento
    IF OLD.concluido_em IS NULL AND NEW.concluido_em IS NOT NULL THEN
      INSERT INTO public.bau_historico (bau_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'conclusao', 'ativo', NEW.status || ': ' || COALESCE(NEW.justificativa_conclusao, 'Sem justificativa'), auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_historico_bau ON public.client_baus;
CREATE TRIGGER trigger_historico_bau
  BEFORE UPDATE ON public.client_baus
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_bau();