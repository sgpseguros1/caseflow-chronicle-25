-- Tabela para armazenar conexões de e-mail (caixas configuradas)
CREATE TABLE public.pz_email_conexoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('gmail', 'outlook', 'imap')),
  email VARCHAR(255) NOT NULL,
  -- IMAP credentials (encrypted at rest)
  imap_host VARCHAR(255),
  imap_port INTEGER DEFAULT 993,
  imap_user VARCHAR(255),
  imap_password TEXT, -- Will be encrypted
  -- OAuth tokens (for future Gmail/Outlook)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  -- Status
  ativo BOOLEAN DEFAULT true,
  ultimo_sync TIMESTAMP WITH TIME ZONE,
  erro_ultimo_sync TEXT,
  -- Audit
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pz_email_conexoes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email connections
CREATE POLICY "Admins can manage email connections" 
ON public.pz_email_conexoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_pz_email_conexoes_updated_at
BEFORE UPDATE ON public.pz_email_conexoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.pz_email_conexoes IS 'Armazena as conexões de e-mail configuradas para o módulo Prazo Zero';