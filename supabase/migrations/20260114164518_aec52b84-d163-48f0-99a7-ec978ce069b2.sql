
-- Criar tabela de comissões
CREATE TABLE public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clients(id),
  tipo_indenizacao TEXT NOT NULL,
  data_acidente DATE NOT NULL,
  valor NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'bloqueada')),
  observacoes TEXT,
  motivo_bloqueio TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Criar índice único para evitar duplicidades (mesmo cliente + mesma data + mesmo tipo)
CREATE UNIQUE INDEX idx_comissoes_unique_lancamento 
ON public.comissoes (cliente_id, data_acidente, tipo_indenizacao) 
WHERE deleted_at IS NULL;

-- Criar tabela de histórico de comissões
CREATE TABLE public.comissoes_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comissao_id UUID NOT NULL REFERENCES public.comissoes(id),
  acao TEXT NOT NULL,
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para comissoes (apenas admin e gestor)
CREATE POLICY "Admins e Gestores podem ver comissões"
ON public.comissoes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'gestor')
  )
);

CREATE POLICY "Admins e Gestores podem criar comissões"
ON public.comissoes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'gestor')
  )
);

CREATE POLICY "Admins e Gestores podem atualizar comissões"
ON public.comissoes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'gestor')
  )
);

-- Políticas para histórico
CREATE POLICY "Admins e Gestores podem ver histórico de comissões"
ON public.comissoes_historico FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'gestor')
  )
);

CREATE POLICY "Sistema pode inserir histórico de comissões"
ON public.comissoes_historico FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION public.registrar_historico_comissao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.comissoes_historico (comissao_id, acao, usuario_id, valor_novo)
    VALUES (NEW.id, 'criacao', auth.uid(), 
      json_build_object('cliente_id', NEW.cliente_id, 'tipo', NEW.tipo_indenizacao, 'status', NEW.status)::text);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.comissoes_historico (comissao_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id)
      VALUES (NEW.id, 'alteracao', 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO public.comissoes_historico (comissao_id, acao, valor_novo, usuario_id)
      VALUES (NEW.id, 'exclusao', NEW.deletion_reason, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_historico_comissao
AFTER INSERT OR UPDATE ON public.comissoes
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_comissao();

-- Índices para performance
CREATE INDEX idx_comissoes_cliente ON public.comissoes(cliente_id);
CREATE INDEX idx_comissoes_status ON public.comissoes(status);
CREATE INDEX idx_comissoes_created_at ON public.comissoes(created_at);
CREATE INDEX idx_comissoes_deleted_at ON public.comissoes(deleted_at);
