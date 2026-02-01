-- Corrigir política de UPDATE para pericias (adicionar WITH CHECK)
DROP POLICY IF EXISTS "Pericias podem ser atualizadas por autenticados" ON public.pericias;

CREATE POLICY "Pericias podem ser atualizadas por autenticados"
ON public.pericias
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);