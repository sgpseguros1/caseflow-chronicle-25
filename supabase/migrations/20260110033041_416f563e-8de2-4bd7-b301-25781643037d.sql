-- Remover política permissiva que expõe roles para todos
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Criar política restritiva: admins veem todos, usuários veem apenas seus próprios
CREATE POLICY "Users view own roles or admins view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);