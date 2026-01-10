-- 1. FIX: Processos - Restringir acesso baseado em função e responsável
DROP POLICY IF EXISTS "Auth can insert processos" ON public.processos;
DROP POLICY IF EXISTS "Auth can update processos" ON public.processos;
DROP POLICY IF EXISTS "Authenticated can view processos" ON public.processos;

-- Admins e gestores podem ver todos, funcionários veem apenas os seus
CREATE POLICY "Users view processos based on role" ON public.processos
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

-- Apenas admins e gestores podem criar processos
CREATE POLICY "Admins and gestores can insert processos" ON public.processos
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor')
  );

-- Admins/gestores podem atualizar todos, funcionários apenas os seus
CREATE POLICY "Users update processos based on role" ON public.processos
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

-- 2. FIX: Profiles - Restringir visualização apenas ao próprio perfil (admins veem todos)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users view own profile or admins view all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor')
  );

-- 3. FIX: Leads - Restringir acesso
DROP POLICY IF EXISTS "Authenticated can view leads" ON public.leads;
DROP POLICY IF EXISTS "Auth can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Auth can update leads" ON public.leads;

CREATE POLICY "Users view leads based on role" ON public.leads
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

CREATE POLICY "Users update leads based on role" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

-- 4. FIX: Agenda - Restringir acesso
DROP POLICY IF EXISTS "Authenticated can view agenda" ON public.agenda;
DROP POLICY IF EXISTS "Auth can insert agenda" ON public.agenda;
DROP POLICY IF EXISTS "Auth can update agenda" ON public.agenda;
DROP POLICY IF EXISTS "Auth can delete agenda" ON public.agenda;

CREATE POLICY "Users view agenda based on role" ON public.agenda
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert agenda" ON public.agenda
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    has_role(auth.uid(), 'funcionario')
  );

CREATE POLICY "Users update own agenda or admins" ON public.agenda
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    responsavel_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete agenda" ON public.agenda
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor')
  );

-- 5. FIX: Métricas - Funcionários veem apenas suas próprias
DROP POLICY IF EXISTS "Authenticated can view metricas" ON public.metricas_diarias;
DROP POLICY IF EXISTS "Auth can insert metricas" ON public.metricas_diarias;
DROP POLICY IF EXISTS "Auth can update metricas" ON public.metricas_diarias;

CREATE POLICY "Users view metricas based on role" ON public.metricas_diarias
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    funcionario_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own metricas" ON public.metricas_diarias
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    funcionario_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own metricas" ON public.metricas_diarias
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor') OR
    funcionario_id IN (SELECT id FROM public.funcionarios WHERE user_id = auth.uid())
  );