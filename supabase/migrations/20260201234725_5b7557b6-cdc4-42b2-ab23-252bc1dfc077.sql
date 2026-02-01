-- Criar tabela para armazenar tokens do Gmail OAuth
CREATE TABLE IF NOT EXISTS public.pz_gmail_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Habilitar RLS
ALTER TABLE public.pz_gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios tokens"
ON public.pz_gmail_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios tokens"
ON public.pz_gmail_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios tokens"
ON public.pz_gmail_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios tokens"
ON public.pz_gmail_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_pz_gmail_tokens_updated_at
BEFORE UPDATE ON public.pz_gmail_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();