-- Permitir que todos os usuários autenticados façam upload de documentos de cliente
DROP POLICY IF EXISTS "Admin and gestor can upload client documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

-- Manter a política de delete apenas para admin e gestor (já existe)
-- A política de view já permite authenticated

-- Também precisamos permitir UPDATE para todos os authenticated
CREATE POLICY "Authenticated users can update client documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents')
WITH CHECK (bucket_id = 'client-documents');