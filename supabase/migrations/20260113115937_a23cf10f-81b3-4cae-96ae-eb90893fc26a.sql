-- =====================================================
-- REGRAS DE EXCLUSÃO - SOMENTE ADMIN PODE EXCLUIR
-- =====================================================

-- CLIENTS: Somente admin pode excluir (soft delete já é usado, mas garante proteção)
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

CREATE POLICY "Only admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- PROTOCOLOS: Somente admin pode excluir
DROP POLICY IF EXISTS "Admins can delete protocolos" ON public.protocolos;
DROP POLICY IF EXISTS "Users can delete protocolos" ON public.protocolos;

CREATE POLICY "Only admins can delete protocolos"
ON public.protocolos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- PROCESSOS: Somente admin pode excluir
DROP POLICY IF EXISTS "Admins can delete processos" ON public.processos;
DROP POLICY IF EXISTS "Users can delete processos" ON public.processos;

CREATE POLICY "Only admins can delete processos"
ON public.processos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- CLIENT_DOCUMENTS: NINGUÉM pode excluir documentos
DROP POLICY IF EXISTS "Users can delete own documents" ON public.client_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.client_documents;
-- Não criar policy de DELETE = ninguém consegue deletar

-- SEGURADORAS: NINGUÉM pode excluir seguradoras
DROP POLICY IF EXISTS "Users can delete seguradoras" ON public.seguradoras;
DROP POLICY IF EXISTS "Admins can delete seguradoras" ON public.seguradoras;
-- Não criar policy de DELETE = ninguém consegue deletar

-- PROTOCOLO_DOCUMENTOS: NINGUÉM pode excluir documentos de protocolo
DROP POLICY IF EXISTS "Users can delete protocolo documentos" ON public.protocolo_documentos;
DROP POLICY IF EXISTS "Admins can delete protocolo documentos" ON public.protocolo_documentos;

-- =====================================================
-- TODOS PODEM EDITAR DADOS (Admin, Gestor, Funcionário)
-- =====================================================

-- CLIENTS: Todos authenticated podem editar
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- PROTOCOLOS: Todos authenticated podem editar
DROP POLICY IF EXISTS "Authenticated users can update protocolos" ON public.protocolos;
CREATE POLICY "Authenticated users can update protocolos"
ON public.protocolos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- PROCESSOS: Todos authenticated podem editar
DROP POLICY IF EXISTS "Authenticated users can update processos" ON public.processos;
CREATE POLICY "Authenticated users can update processos"
ON public.processos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- FUNCIONARIOS: Todos authenticated podem ver e admin/gestor podem editar
DROP POLICY IF EXISTS "All authenticated can view funcionarios" ON public.funcionarios;
CREATE POLICY "All authenticated can view funcionarios"
ON public.funcionarios
FOR SELECT
TO authenticated
USING (true);

-- SEGURADORAS: Todos authenticated podem cadastrar
DROP POLICY IF EXISTS "All authenticated can insert seguradoras" ON public.seguradoras;
CREATE POLICY "All authenticated can insert seguradoras"
ON public.seguradoras
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "All authenticated can update seguradoras" ON public.seguradoras;
CREATE POLICY "All authenticated can update seguradoras"
ON public.seguradoras
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);