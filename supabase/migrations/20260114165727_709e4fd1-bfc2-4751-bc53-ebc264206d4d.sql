-- Adicionar campos para rastrear pagamento da comissão
ALTER TABLE public.comissoes 
ADD COLUMN IF NOT EXISTS pago_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS pago_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS beneficiario_nome text;

-- Comentários explicativos
COMMENT ON COLUMN public.comissoes.pago_por IS 'ID do usuário que marcou a comissão como paga';
COMMENT ON COLUMN public.comissoes.pago_em IS 'Data e hora em que a comissão foi paga';
COMMENT ON COLUMN public.comissoes.beneficiario_nome IS 'Nome da pessoa que recebeu a comissão';