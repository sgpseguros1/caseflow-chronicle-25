-- Create table for channel configuration
CREATE TABLE IF NOT EXISTS public.comunicacao_canais_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  configuracao JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comunicacao_canais_config ENABLE ROW LEVEL SECURITY;

-- Policies - authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view channel config"
  ON public.comunicacao_canais_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage channel config"
  ON public.comunicacao_canais_config
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default channels
INSERT INTO public.comunicacao_canais_config (canal, nome_exibicao, ativo) VALUES
  ('whatsapp', 'WhatsApp', false),
  ('email', 'E-mail', true),
  ('sms', 'SMS', false),
  ('interno', 'Chat Interno', true),
  ('telefone', 'Telefone', true),
  ('facebook', 'Facebook Messenger', false),
  ('instagram', 'Instagram Direct', false)
ON CONFLICT (canal) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_comunicacao_canais_config_updated_at
  BEFORE UPDATE ON public.comunicacao_canais_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();