-- Drop existing INSERT policy that only allows admin and gestor
DROP POLICY IF EXISTS "Admin and gestor can insert client documents" ON public.client_documents;

-- Create new INSERT policy for all authenticated users
CREATE POLICY "Authenticated users can insert client documents" 
ON public.client_documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the UPDATE policy to allow all authenticated users
DROP POLICY IF EXISTS "Admin and gestor can update client documents" ON public.client_documents;

CREATE POLICY "Authenticated users can update client documents" 
ON public.client_documents 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);