import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedClient, ClientDocument, ClientAlert } from '@/types/client';

export function useExtendedClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', 'extended', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          advogados:advogado_id(nome),
          seguradoras:seguradora_id(razao_social),
          funcionarios:responsavel_id(nome)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ExtendedClient | null;
    },
    enabled: !!id,
  });
}

export function useUpdateExtendedClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<ExtendedClient> & { id: string }) => {
      // Remove joined data before update
      const { advogados, seguradoras, funcionarios, ...updateData } = clientData as any;
      
      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', 'extended', data.id] });
      toast({
        title: 'Cliente atualizado!',
        description: 'Alterações salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSoftDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason, userId }: { id: string; reason: string; userId: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          deletion_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Client Documents hooks
export function useClientDocuments(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientDocument[];
    },
    enabled: !!clientId,
  });
}

export function useUploadClientDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      clientId,
      file,
      description,
      category,
      userId,
    }: {
      clientId: string;
      file: File;
      description?: string;
      category?: string;
      userId?: string;
    }) => {
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description,
          document_category: category,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client_documents', variables.clientId] });
      toast({
        title: 'Documento enviado!',
        description: 'O documento foi salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar documento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClientDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filePath, clientId }: { id: string; filePath: string; clientId: string }) => {
      // Delete from storage
      await supabase.storage.from('client-documents').remove([filePath]);
      
      // Delete record
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client_documents', clientId] });
      toast({
        title: 'Documento excluído!',
        description: 'O documento foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir documento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Client Alerts hooks
export function useClientAlerts(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_alerts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_alerts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientAlert[];
    },
    enabled: !!clientId,
  });
}

export function useResolveClientAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId, clientId }: { id: string; userId: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_alerts')
        .update({
          status: 'resolvido',
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq('id', id);

      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client_alerts', clientId] });
      toast({
        title: 'Alerta resolvido!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao resolver alerta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Get client processes
export function useClientProcesses(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_processes', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('processos')
        .select(`
          id, numero, tipo, titulo, status, data_abertura,
          advogados:advogado_id(nome),
          funcionarios:responsavel_id(nome)
        `)
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

// Update last contact
export function useUpdateLastContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
