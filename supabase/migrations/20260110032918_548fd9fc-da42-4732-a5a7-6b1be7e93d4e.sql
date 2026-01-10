-- Remover políticas permissivas duplicadas que expõem dados
-- Mantendo apenas as políticas restritivas baseadas em roles

-- Advogados: remover política permissiva
DROP POLICY IF EXISTS "Authenticated can view advogados" ON public.advogados;

-- Seguradoras: remover política permissiva
DROP POLICY IF EXISTS "Authenticated can view seguradoras" ON public.seguradoras;

-- Peritos: remover política permissiva
DROP POLICY IF EXISTS "Authenticated can view peritos" ON public.peritos;

-- Funcionarios: remover política permissiva
DROP POLICY IF EXISTS "Authenticated can view funcionarios" ON public.funcionarios;