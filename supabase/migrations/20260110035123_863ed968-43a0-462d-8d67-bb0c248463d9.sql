-- Fix: comunicacao_historico - Restrict access to own communications or admin only
DROP POLICY IF EXISTS "Users view comunicacao based on role" ON public.comunicacao_historico;

-- Only admins/gestores can see all communication history
-- Funcionarios can only see communications they sent
CREATE POLICY "Users view own or admin communications" 
  ON public.comunicacao_historico 
  FOR SELECT 
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gestor')
    OR enviado_por = auth.uid()
  );