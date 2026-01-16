-- Adicionar coluna partes na tabela processos_sincronizados
ALTER TABLE public.processos_sincronizados 
ADD COLUMN IF NOT EXISTS partes jsonb DEFAULT '[]'::jsonb;

-- Adicionar comentário
COMMENT ON COLUMN public.processos_sincronizados.partes IS 'Lista de partes do processo (autor, réu, advogados)';