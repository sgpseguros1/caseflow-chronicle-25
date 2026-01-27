-- Corrigir constraints inconsistentes em public.pericias
-- (tipo_pericia deve aceitar 'junta_medica'; status NÃO deve aceitar 'junta_medica')

ALTER TABLE public.pericias
  DROP CONSTRAINT IF EXISTS pericias_tipo_pericia_check;

ALTER TABLE public.pericias
  ADD CONSTRAINT pericias_tipo_pericia_check
  CHECK (
    tipo_pericia = ANY (
      ARRAY[
        'inss'::text,
        'auxilio_doenca'::text,
        'auxilio_acidente'::text,
        'dpvat'::text,
        'seguro_vida'::text,
        'judicial'::text,
        'acidente_trabalho'::text,
        'danos'::text,
        'junta_medica'::text,
        'outros'::text
      ]
    )
  );

ALTER TABLE public.pericias
  DROP CONSTRAINT IF EXISTS pericias_status_check;

ALTER TABLE public.pericias
  ADD CONSTRAINT pericias_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'agendada'::text,
        'realizada_aguardando_pagamento'::text,
        'cliente_faltou'::text
      ]
    )
  );
