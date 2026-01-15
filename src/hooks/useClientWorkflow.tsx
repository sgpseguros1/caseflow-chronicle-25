import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientWorkflow {
  id: string;
  client_id: string;
  cliente_cadastrado: boolean;
  checklist_ia_status: string | null;
  bau_acionado: boolean;
  bau_status: string | null;
  bau_id: string | null;
  bo_status: string | null;
  bo_numero: string | null;
  bo_data: string | null;
  bo_orgao: string | null;
  laudo_status: string | null;
  laudo_medico: string | null;
  laudo_crm: string | null;
  laudo_data: string | null;
  laudo_cid: string | null;
  laudo_tipo_incapacidade: string | null;
  protocolo_status: string | null;
  protocolo_id: string | null;
  pericia_liberada: boolean;
  financeiro_liberado: boolean;
  juridico_liberado: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientWorkflow(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-workflow', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('client_workflow')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data as ClientWorkflow | null;
    },
    enabled: !!clientId,
  });
}

export function useCreateOrUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: Partial<ClientWorkflow> }) => {
      const { data: existing } = await supabase
        .from('client_workflow')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabase
          .from('client_workflow')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('client_id', clientId)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('client_workflow')
          .insert({ client_id: clientId, ...data })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-workflow', variables.clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar workflow: ${error.message}`);
    },
  });
}

export function useEnsureWorkflowExists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data: existing } = await supabase
        .from('client_workflow')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      if (!existing) {
        const { data: created, error } = await supabase
          .from('client_workflow')
          .insert({ 
            client_id: clientId,
            cliente_cadastrado: true,
            checklist_ia_status: 'pendente'
          })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
      return existing;
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-workflow', clientId] });
    },
  });
}
