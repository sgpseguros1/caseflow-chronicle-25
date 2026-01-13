-- Remover política existente de INSERT restritiva
DROP POLICY IF EXISTS "Admins and gestores can insert protocolos" ON public.protocolos;

-- Criar nova política permitindo todos os usuários autenticados inserir protocolos
CREATE POLICY "Authenticated users can insert protocolos" 
ON public.protocolos 
FOR INSERT 
TO authenticated
WITH CHECK (true);