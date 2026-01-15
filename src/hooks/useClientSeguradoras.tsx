import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientSeguradora {
  id: string;
  client_id: string;
  nome_seguradora: string;
  tipo_produto: string | null;
  numero_apolice: string | null;
  numero_certificado: string | null;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  status: string | null;
  observacoes: string | null;
  created_at: string;
}

export const TIPOS_PRODUTO = [
  { value: 'vida', label: 'Seguro de Vida' },
  { value: 'ap', label: 'Acidentes Pessoais (AP)' },
  { value: 'auto', label: 'Seguro Auto' },
  { value: 'prestamista', label: 'Prestamista' },
  { value: 'empresarial', label: 'Seguro Empresarial' },
  { value: 'cartao', label: 'Seguro de Cartão' },
  { value: 'fintech', label: 'Seguro de App/Fintech' },
  { value: 'residencial', label: 'Seguro Residencial' },
  { value: 'outro', label: 'Outro' },
];

export function useClientSeguradoras(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-seguradoras', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_seguradoras')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClientSeguradora[];
    },
    enabled: !!clientId,
  });
}

export function useCreateClientSeguradora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: Omit<ClientSeguradora, 'id' | 'client_id' | 'created_at'> }) => {
      // Check limit of 10 seguradoras
      const { count, error: countError } = await supabase
        .from('client_seguradoras')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);
      
      if (countError) throw countError;
      
      if (count && count >= 10) {
        throw new Error('Limite máximo de 10 seguradoras por cliente');
      }

      const { data: created, error } = await supabase
        .from('client_seguradoras')
        .insert({ client_id: clientId, ...data })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-seguradoras', variables.clientId] });
      toast.success('Seguradora adicionada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateClientSeguradora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, data }: { id: string; clientId: string; data: Partial<ClientSeguradora> }) => {
      const { data: updated, error } = await supabase
        .from('client_seguradoras')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-seguradoras', variables.clientId] });
      toast.success('Seguradora atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteClientSeguradora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_seguradoras')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-seguradoras', variables.clientId] });
      toast.success('Seguradora removida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}
