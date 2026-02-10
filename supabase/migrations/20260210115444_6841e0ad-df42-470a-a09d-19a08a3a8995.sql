
-- Fix: Allow ALL protocol types in the check constraint
ALTER TABLE public.protocolos DROP CONSTRAINT protocolos_tipo_check;
ALTER TABLE public.protocolos ADD CONSTRAINT protocolos_tipo_check CHECK (
  tipo = ANY (ARRAY[
    'AUXILIO_ACIDENTE'::text,
    'DPVAT'::text,
    'SEGURO_VIDA'::text,
    'SEGURO_VIDA_EMPRESARIAL'::text,
    'DANOS_ADMINISTRATIVO'::text,
    'JUDICIAL'::text,
    'PREVIDENCIARIO'::text,
    'JUDICIAL_CIVEL'::text,
    'ADMINISTRATIVO_SEGURADORA'::text,
    'RAFAEL_PROTOCOLAR'::text,
    'INSS'::text
  ])
);
