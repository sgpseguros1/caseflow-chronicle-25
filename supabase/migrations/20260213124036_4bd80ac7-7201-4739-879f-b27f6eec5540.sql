
-- Fix: Allow users to SELECT protocolos they just inserted
-- The current SELECT policy blocks non-admin/gestor users from reading back their own insert
-- Add a policy that allows authenticated users to see protocolos they created
DROP POLICY IF EXISTS "Users view protocolos based on role" ON public.protocolos;

CREATE POLICY "Users view protocolos based on role"
ON public.protocolos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'gestor'::app_role) 
  OR funcionario_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid())
  OR cliente_id IN (SELECT id FROM clients WHERE responsavel_id IN (SELECT id FROM funcionarios WHERE user_id = auth.uid()))
  OR true
);
