-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins e gestores podem ver comissões" ON public.comissoes;
DROP POLICY IF EXISTS "Admins e gestores podem criar comissões" ON public.comissoes;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar comissões" ON public.comissoes;
DROP POLICY IF EXISTS "Apenas admins podem excluir comissões" ON public.comissoes;

-- Todos usuários autenticados podem ver comissões
CREATE POLICY "Usuarios autenticados podem ver comissoes"
ON public.comissoes
FOR SELECT
TO authenticated
USING (true);

-- Todos usuários autenticados podem criar comissões
CREATE POLICY "Usuarios autenticados podem criar comissoes"
ON public.comissoes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Todos usuários autenticados podem atualizar comissões (pagar, bloquear, etc)
CREATE POLICY "Usuarios autenticados podem atualizar comissoes"
ON public.comissoes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- APENAS admin pode excluir (soft delete)
CREATE POLICY "Apenas admin pode excluir comissoes"
ON public.comissoes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));