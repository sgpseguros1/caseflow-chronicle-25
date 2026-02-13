
-- Tabela central de histórico do cliente
CREATE TABLE public.client_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  descricao TEXT NOT NULL,
  tabela_origem TEXT,
  registro_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_client_historico_client_id ON public.client_historico(client_id);
CREATE INDEX idx_client_historico_created_at ON public.client_historico(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_historico ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view history
CREATE POLICY "Authenticated users can view client history"
ON public.client_historico FOR SELECT TO authenticated USING (true);

-- All authenticated users can insert history (triggers will do this)
CREATE POLICY "Authenticated users can insert client history"
ON public.client_historico FOR INSERT TO authenticated WITH CHECK (true);

-- System/triggers can insert (security definer functions)
CREATE POLICY "Service role can manage client history"
ON public.client_historico FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- TRIGGER: Alterações na tabela clients
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
  _campos_alterados TEXT[];
  _col TEXT;
  _old_val TEXT;
  _new_val TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    -- Check each important column
    FOREACH _col IN ARRAY ARRAY['name','cpf','rg','phone1','phone2','email','address','city','uf','cep','neighborhood','number','complement',
      'birth_date','civil_status','profession','company_name','is_clt','accident_date','accident_type','accident_location',
      'has_police_report','police_report_number','injuries','cid_code','body_part_affected','injury_severity','has_sequelae',
      'disability_percentage','admission_hospital','admission_date','transfer_hospital','transfer_date','had_surgery',
      'was_hospitalized','hospitalization_days','bank_name','bank_agency','bank_account','bank_account_type',
      'notes','client_status','referral_type','referral_source','referrer_name','advogado_id','seguradora_id','responsavel_id']
    LOOP
      EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', _col, _col) INTO _old_val, _new_val USING OLD, NEW;
      IF _old_val IS DISTINCT FROM _new_val THEN
        INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
        VALUES (NEW.id, auth.uid(), _usuario_nome, 'alteracao', 'dados_cliente',
          'Campo "' || _col || '" alterado',
          'clients', NEW.id::TEXT,
          jsonb_build_object(_col, _old_val),
          jsonb_build_object(_col, _new_val));
      END IF;
    END LOOP;
    
    -- Soft delete
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
      VALUES (NEW.id, auth.uid(), _usuario_nome, 'exclusao', 'dados_cliente',
        'Cliente excluído. Motivo: ' || COALESCE(NEW.deletion_reason, 'Não informado'),
        'clients', NEW.id::TEXT, jsonb_build_object('motivo', NEW.deletion_reason));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_cliente
AFTER UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_cliente();

-- =====================================================
-- TRIGGER: Documentos do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_documento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
    VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'criacao', 'documento',
      'Documento adicionado: ' || NEW.file_name,
      'client_documents', NEW.id::TEXT,
      jsonb_build_object('file_name', NEW.file_name, 'category', NEW.document_category));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores)
    VALUES (OLD.client_id, auth.uid(), _usuario_nome, 'exclusao', 'documento',
      'Documento removido: ' || OLD.file_name,
      'client_documents', OLD.id::TEXT,
      jsonb_build_object('file_name', OLD.file_name, 'category', OLD.document_category));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_historico_documento
AFTER INSERT OR DELETE ON public.client_documents
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_documento();

-- =====================================================
-- TRIGGER: Protocolos do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_protocolo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
    VALUES (NEW.cliente_id, auth.uid(), _usuario_nome, 'criacao', 'protocolo',
      'Protocolo criado: ' || NEW.tipo || ' - ' || COALESCE(NEW.natureza, ''),
      'protocolos', NEW.id::TEXT,
      jsonb_build_object('tipo', NEW.tipo, 'status', NEW.status, 'natureza', NEW.natureza));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
      VALUES (NEW.cliente_id, auth.uid(), _usuario_nome, 'alteracao', 'protocolo',
        'Status do protocolo alterado de "' || COALESCE(OLD.status,'') || '" para "' || COALESCE(NEW.status,'') || '"',
        'protocolos', NEW.id::TEXT,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_protocolo
AFTER INSERT OR UPDATE ON public.protocolos
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_protocolo();

-- =====================================================
-- TRIGGER: Alertas do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_alerta_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
    VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'criacao', 'alerta',
      'Alerta criado: ' || NEW.titulo,
      'client_alerts', NEW.id::TEXT,
      jsonb_build_object('titulo', NEW.titulo, 'tipo', NEW.tipo, 'prioridade', NEW.prioridade));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
      VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'alteracao', 'alerta',
        'Alerta "' || NEW.titulo || '" - status alterado para "' || NEW.status || '"',
        'client_alerts', NEW.id::TEXT,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_alerta_cliente
AFTER INSERT OR UPDATE ON public.client_alerts
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alerta_cliente();

-- =====================================================
-- TRIGGER: Workflow do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_workflow_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
  _col TEXT;
  _old_val TEXT;
  _new_val TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    FOREACH _col IN ARRAY ARRAY['checklist_ia_status','bau_status','bo_status','laudo_status','protocolo_status',
      'bau_acionado','pericia_liberada','financeiro_liberado','juridico_liberado','cliente_cadastrado',
      'bo_numero','bo_data','bo_orgao','laudo_medico','laudo_crm','laudo_cid','laudo_data','laudo_tipo_incapacidade']
    LOOP
      EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', _col, _col) INTO _old_val, _new_val USING OLD, NEW;
      IF _old_val IS DISTINCT FROM _new_val THEN
        INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
        VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'alteracao', 'workflow',
          'Workflow: campo "' || _col || '" alterado',
          'client_workflow', NEW.id::TEXT,
          jsonb_build_object(_col, _old_val),
          jsonb_build_object(_col, _new_val));
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_workflow_cliente
AFTER UPDATE ON public.client_workflow
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_workflow_cliente();

-- =====================================================
-- TRIGGER: BAU do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_bau_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
    VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'criacao', 'bau',
      'BAU criado: ' || NEW.hospital_nome || ' (' || NEW.tipo_solicitacao || ')',
      'client_baus', NEW.id::TEXT,
      jsonb_build_object('hospital', NEW.hospital_nome, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
      VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'alteracao', 'bau',
        'BAU "' || NEW.hospital_nome || '" - status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
        'client_baus', NEW.id::TEXT,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_bau_cliente
AFTER INSERT OR UPDATE ON public.client_baus
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_bau_cliente();

-- =====================================================
-- TRIGGER: Checklist IA
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_checklist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id)
    VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'criacao', 'checklist_ia',
      'Checklist IA iniciado',
      'client_checklist_ia', NEW.id::TEXT);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_anteriores, dados_novos)
      VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'alteracao', 'checklist_ia',
        'Checklist IA status alterado para "' || COALESCE(NEW.status, '') || '"',
        'client_checklist_ia', NEW.id::TEXT,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_checklist
AFTER INSERT OR UPDATE ON public.client_checklist_ia
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_checklist();

-- =====================================================
-- TRIGGER: Seguradoras do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_historico_seguradora_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _usuario_nome TEXT;
BEGIN
  SELECT name INTO _usuario_nome FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_historico (client_id, usuario_id, usuario_nome, acao, categoria, descricao, tabela_origem, registro_id, dados_novos)
    VALUES (NEW.client_id, auth.uid(), _usuario_nome, 'criacao', 'seguradora',
      'Seguradora vinculada: ' || NEW.nome_seguradora,
      'client_seguradoras', NEW.id::TEXT,
      jsonb_build_object('nome', NEW.nome_seguradora, 'apolice', NEW.numero_apolice));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historico_seguradora_cliente
AFTER INSERT ON public.client_seguradoras
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_seguradora_cliente();
