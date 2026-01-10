-- Corrigir políticas permissivas - alertas INSERT
DROP POLICY IF EXISTS "System can insert alerts" ON public.alertas;
CREATE POLICY "Authorized users insert alerts" ON public.alertas
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- Corrigir políticas permissivas - processo_acessos INSERT
DROP POLICY IF EXISTS "System logs access" ON public.processo_acessos;
CREATE POLICY "Authorized users log access" ON public.processo_acessos
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );