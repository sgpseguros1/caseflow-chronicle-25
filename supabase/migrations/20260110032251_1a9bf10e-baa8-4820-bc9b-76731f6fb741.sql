-- 1. CORRIGIR: Clientes - Restringir acesso baseado em casos atribuídos
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;

-- Admins/gestores veem todos, funcionários veem apenas clientes dos seus processos/leads
CREATE POLICY "Users view clients based on role and assignment" ON public.clients
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    -- Funcionários veem clientes de processos atribuídos
    id IN (
      SELECT cliente_id FROM public.processos
      WHERE responsavel_id IN (
        SELECT id FROM public.funcionarios WHERE user_id = auth.uid()
      )
    ) OR
    -- Funcionários veem clientes de leads atribuídos
    id IN (
      SELECT cliente_id FROM public.leads
      WHERE responsavel_id IN (
        SELECT id FROM public.funcionarios WHERE user_id = auth.uid()
      )
    )
  );

-- 2. CORRIGIR: Advogados - Restringir acesso por role
DROP POLICY IF EXISTS "Authenticated users can view advogados" ON public.advogados;
DROP POLICY IF EXISTS "Users can view advogados" ON public.advogados;

CREATE POLICY "Authorized users view advogados" ON public.advogados
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- 3. CORRIGIR: Comunicacao historico - Adicionar políticas de UPDATE e DELETE
-- Apenas admins podem modificar registros (append-only para outros)
CREATE POLICY "Only admins can update comunicacao_historico" ON public.comunicacao_historico
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete comunicacao_historico" ON public.comunicacao_historico
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 4. CORRIGIR: Seguradoras - Restringir acesso
DROP POLICY IF EXISTS "Authenticated users can view seguradoras" ON public.seguradoras;

CREATE POLICY "Authorized users view seguradoras" ON public.seguradoras
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- 5. CORRIGIR: Peritos - Restringir acesso
DROP POLICY IF EXISTS "Authenticated users can view peritos" ON public.peritos;

CREATE POLICY "Authorized users view peritos" ON public.peritos
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

-- 6. CORRIGIR: Funcionarios - Restringir acesso
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;

CREATE POLICY "Authorized users view funcionarios" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    user_id = auth.uid()
  );