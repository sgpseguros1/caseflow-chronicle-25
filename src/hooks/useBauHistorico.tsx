import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BauHistorico {
  id: string;
  bau_id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
  created_at: string;
  // Join
  usuario?: { name: string };
}

export interface BauDocumentoFaltante {
  id: string;
  bau_id: string;
  documento_nome: string;
  obrigatorio: boolean;
  status: 'faltando' | 'recebido' | 'dispensado';
  data_recebimento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BauEtiqueta {
  id: string;
  bau_id: string;
  nome: string;
  cor: string;
  tipo: 'manual' | 'automatica';
  ativo: boolean;
  created_at: string;
}

const CAMPO_LABELS: Record<string, string> = {
  status: 'Status',
  fase_cobranca: 'Fase de Cobrança',
  responsavel_id: 'Responsável',
  qualidade_status: 'Status Qualidade',
  previsao_entrega: 'Previsão de Entrega',
  data_recebimento: 'Data de Recebimento',
};

export const getCampoLabel = (campo: string) => CAMPO_LABELS[campo] || campo;

// ==========================================
// HOOK: Fetch BAU history
// ==========================================
export function useBauHistorico(bauId: string | undefined) {
  return useQuery({
    queryKey: ['bau-historico', bauId],
    queryFn: async () => {
      if (!bauId) return [];

      const { data, error } = await supabase
        .from('bau_historico')
        .select('*')
        .eq('bau_id', bauId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set((data || []).map(h => h.usuario_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      return (data || []).map(h => ({
        ...h,
        usuario: h.usuario_id ? { name: profileMap.get(h.usuario_id) || 'Desconhecido' } : undefined,
      })) as BauHistorico[];
    },
    enabled: !!bauId,
  });
}

// ==========================================
// HOOK: Fetch BAU missing documents
// ==========================================
export function useBauDocumentosFaltantes(bauId: string | undefined) {
  return useQuery({
    queryKey: ['bau-documentos-faltantes', bauId],
    queryFn: async () => {
      if (!bauId) return [];

      const { data, error } = await supabase
        .from('bau_documentos_faltantes')
        .select('*')
        .eq('bau_id', bauId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BauDocumentoFaltante[];
    },
    enabled: !!bauId,
  });
}

// ==========================================
// HOOK: Add missing document
// ==========================================
export function useAddBauDocumentoFaltante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bau_id: string; documento_nome: string; obrigatorio?: boolean }) => {
      const { data: result, error } = await supabase
        .from('bau_documentos_faltantes')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bau-documentos-faltantes', variables.bau_id] });
      toast({ title: 'Documento adicionado à lista!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar documento', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Update missing document status
// ==========================================
export function useUpdateBauDocumentoFaltante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BauDocumentoFaltante> & { id: string }) => {
      const { error } = await supabase
        .from('bau_documentos_faltantes')
        .update({
          ...data,
          data_recebimento: data.status === 'recebido' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bau-documentos-faltantes'] });
      toast({ title: 'Documento atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Fetch BAU tags
// ==========================================
export function useBauEtiquetas(bauId: string | undefined) {
  return useQuery({
    queryKey: ['bau-etiquetas', bauId],
    queryFn: async () => {
      if (!bauId) return [];

      const { data, error } = await supabase
        .from('bau_etiquetas')
        .select('*')
        .eq('bau_id', bauId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BauEtiqueta[];
    },
    enabled: !!bauId,
  });
}

// ==========================================
// HOOK: Add BAU tag
// ==========================================
export function useAddBauEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bau_id: string; nome: string; cor?: string; tipo?: string }) => {
      const { data: result, error } = await supabase
        .from('bau_etiquetas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bau-etiquetas', variables.bau_id] });
      toast({ title: 'Etiqueta adicionada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar etiqueta', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Remove BAU tag (soft delete)
// ==========================================
export function useRemoveBauEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bau_etiquetas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bau-etiquetas'] });
      toast({ title: 'Etiqueta removida!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover etiqueta', description: error.message, variant: 'destructive' });
    },
  });
}
