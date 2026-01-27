-- Política de DELETE apenas para admin (Rafael)
CREATE POLICY "Apenas admins podem excluir pericias"
ON public.pericias
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);