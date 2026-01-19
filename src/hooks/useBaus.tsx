import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';
import { useEffect } from 'react';

// Types
export interface Bau {
  id: string;
  client_id: string;
  hospital_nome: string;
  hospital_telefone: string | null;
  hospital_contato: string | null;
  tipo_solicitacao: 'escritorio' | 'cliente_solicitou' | 'cliente_ira_solicitar';
  data_solicitacao: string;
  previsao_entrega: string | null;
  data_recebimento: string | null;
  status: 'solicitado' | 'em_andamento' | 'recebido' | 'incompleto' | 'em_correcao' | 'validado' | 'cancelado';
  fase_cobranca: 'normal' | 'pre_aviso' | 'cobrar' | 'escalonado' | 'critico';
  responsavel_id: string | null;
  qualidade_status: 'pendente' | 'recebido_validado' | 'recebido_incompleto' | 'em_correcao';
  motivo_incompleto: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  dias_corridos?: number;
  // Joins
  cliente?: { id: string; name: string; code: number };
  responsavel?: { id: string; nome: string };
}

export interface BauContato {
  id: string;
  bau_id: string;
  tipo_contato: 'telefone' | 'email' | 'presencial' | 'whatsapp';
  descricao: string;
  resultado: string | null;
  nova_previsao: string | null;
  registrado_por: string | null;
  created_at: string;
}

// Labels
export const TIPO_SOLICITACAO_LABELS: Record<string, string> = {
  escritorio: 'Escritório solicitou',
  cliente_solicitou: 'Cliente solicitou',
  cliente_ira_solicitar: 'Cliente irá solicitar',
};

export const STATUS_BAU_LABELS: Record<string, string> = {
  solicitado: 'Solicitado',
  em_andamento: 'Em Andamento',
  recebido: 'Recebido',
  incompleto: 'Incompleto',
  em_correcao: 'Em Correção',
  validado: 'Validado',
  arquivado: 'Arquivado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

// Status finais que não geram alertas e excluem o BAU da lista ativa
export const STATUS_FINAIS = ['recebido', 'validado', 'arquivado', 'concluido', 'cancelado'];

export const FASE_COBRANCA_LABELS: Record<string, string> = {
  normal: 'Normal',
  pre_aviso: 'Pré-aviso (5d)',
  cobrar: 'Cobrar (10d)',
  escalonado: 'Escalonado (15d)',
  critico: 'Crítico (20d)',
};

export const FASE_COBRANCA_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-800',
  pre_aviso: 'bg-yellow-100 text-yellow-800',
  cobrar: 'bg-orange-100 text-orange-800',
  escalonado: 'bg-red-100 text-red-800',
  critico: 'bg-black text-white',
};

// Calculate fase based on days
const calcularFase = (dias: number): string => {
  if (dias >= 20) return 'critico';
  if (dias >= 15) return 'escalonado';
  if (dias >= 10) return 'cobrar';
  if (dias >= 5) return 'pre_aviso';
  return 'normal';
};

// ==========================================
// HOOK: Fetch all BAUs
// ==========================================
export function useBaus() {
  const queryClient = useQueryClient();

  // Realtime subscription para BAUs
  useEffect(() => {
    const channel = supabase
      .channel('baus-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_baus' }, () => {
        queryClient.invalidateQueries({ queryKey: ['baus'] });
        queryClient.invalidateQueries({ queryKey: ['bau-dashboard'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['baus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_baus')
        .select(`
          *,
          cliente:clients(id, name, code),
          responsavel:funcionarios(id, nome)
        `)
        .neq('status', 'cancelado')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;

      // Calculate days and update fase if needed
      const bausWithDays = (data || []).map(bau => {
        const diasCorridos = differenceInDays(new Date(), parseISO(bau.data_solicitacao));
        const faseCalculada = calcularFase(diasCorridos);
        
        return {
          ...bau,
          dias_corridos: diasCorridos,
          fase_cobranca_calculada: faseCalculada,
        } as Bau & { fase_cobranca_calculada: string };
      });

      return bausWithDays;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// ==========================================
// HOOK: Fetch BAUs by client
// ==========================================
export function useBausByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['baus', 'client', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_baus')
        .select(`
          *,
          responsavel:funcionarios(id, nome)
        `)
        .eq('client_id', clientId)
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;

      return (data || []).map(bau => ({
        ...bau,
        dias_corridos: differenceInDays(new Date(), parseISO(bau.data_solicitacao)),
      })) as Bau[];
    },
    enabled: !!clientId,
  });
}

// ==========================================
// HOOK: Fetch single BAU
// ==========================================
export function useBau(bauId: string | undefined) {
  return useQuery({
    queryKey: ['bau', bauId],
    queryFn: async () => {
      if (!bauId) return null;

      const { data, error } = await supabase
        .from('client_baus')
        .select(`
          *,
          cliente:clients(id, name, code),
          responsavel:funcionarios(id, nome)
        `)
        .eq('id', bauId)
        .single();

      if (error) throw error;

      return {
        ...data,
        dias_corridos: differenceInDays(new Date(), parseISO(data.data_solicitacao)),
      } as Bau;
    },
    enabled: !!bauId,
  });
}

// ==========================================
// HOOK: Fetch BAU contacts
// ==========================================
export function useBauContatos(bauId: string | undefined) {
  return useQuery({
    queryKey: ['bau-contatos', bauId],
    queryFn: async () => {
      if (!bauId) return [];

      const { data, error } = await supabase
        .from('client_bau_contatos')
        .select('*')
        .eq('bau_id', bauId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BauContato[];
    },
    enabled: !!bauId,
  });
}

// ==========================================
// HOOK: Create BAU
// ==========================================
export function useCreateBau() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Bau> & { client_id: string; hospital_nome: string }) => {
      const { data: result, error } = await supabase
        .from('client_baus')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['baus'] });
      queryClient.invalidateQueries({ queryKey: ['baus', 'client', variables.client_id] });
      toast({ title: 'BAU criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar BAU', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Update BAU
// ==========================================
export function useUpdateBau() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bau> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('client_baus')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['baus'] });
      queryClient.invalidateQueries({ queryKey: ['bau', data.id] });
      queryClient.invalidateQueries({ queryKey: ['baus', 'client', data.client_id] });
      toast({ title: 'BAU atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar BAU', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Concluir/Arquivar BAU (com justificativa obrigatória)
// IMPORTANTE: BAUs não podem ser excluídos, apenas arquivados/concluídos
// ==========================================
export function useConcluirBau() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      justificativa 
    }: { 
      id: string; 
      status: 'arquivado' | 'concluido' | 'cancelado'; 
      justificativa: string;
    }) => {
      if (!justificativa.trim()) {
        throw new Error('Justificativa é obrigatória para conclusão/arquivamento');
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('client_baus')
        .update({
          status,
          justificativa_conclusao: justificativa,
          concluido_em: new Date().toISOString(),
          concluido_por: userData.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['baus'] });
      queryClient.invalidateQueries({ queryKey: ['bau', data.id] });
      queryClient.invalidateQueries({ queryKey: ['baus', 'client', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['bau-dashboard'] });
      toast({ 
        title: 'BAU atualizado', 
        description: `Status alterado para ${STATUS_BAU_LABELS[data.status]}` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao atualizar BAU', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// ==========================================
// HOOK: Add BAU contact
// ==========================================
export function useAddBauContato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BauContato> & { bau_id: string; descricao: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('client_bau_contatos')
        .insert({
          ...data,
          registrado_por: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // If nova_previsao is set, also update the BAU
      if (data.nova_previsao) {
        await supabase
          .from('client_baus')
          .update({ previsao_entrega: data.nova_previsao })
          .eq('id', data.bau_id);
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bau-contatos', variables.bau_id] });
      queryClient.invalidateQueries({ queryKey: ['baus'] });
      toast({ title: 'Contato registrado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar contato', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Dashboard stats
// ==========================================
export function useBauDashboardStats() {
  return useQuery({
    queryKey: ['bau-dashboard'],
    queryFn: async () => {
      const { data: baus, error } = await supabase
        .from('client_baus')
        .select(`
          *,
          cliente:clients(id, name, code),
          responsavel:funcionarios(id, nome)
        `)
        .neq('status', 'cancelado');

      if (error) throw error;

      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Calculate stats
      const bausComDias = (baus || []).map(bau => ({
        ...bau,
        dias_corridos: differenceInDays(hoje, parseISO(bau.data_solicitacao)),
      }));

      const total = bausComDias.length;
      const emAndamento = bausComDias.filter(b => ['solicitado', 'em_andamento'].includes(b.status)).length;
      const mais10Dias = bausComDias.filter(b => b.dias_corridos >= 10 && !['recebido', 'validado'].includes(b.status)).length;
      const criticos = bausComDias.filter(b => b.dias_corridos >= 15 && !['recebido', 'validado'].includes(b.status)).length;
      const recebidosMes = bausComDias.filter(b => 
        b.data_recebimento && parseISO(b.data_recebimento) >= inicioMes
      ).length;
      const incompletos = bausComDias.filter(b => b.qualidade_status === 'recebido_incompleto' || b.status === 'incompleto').length;

      // Hospital ranking
      const hospitalMap = new Map<string, { 
        nome: string; 
        total: number; 
        atrasados: number; 
        criticos: number;
        tempoMedio: number;
        tempoTotal: number;
      }>();

      bausComDias.forEach(bau => {
        const atual = hospitalMap.get(bau.hospital_nome) || {
          nome: bau.hospital_nome,
          total: 0,
          atrasados: 0,
          criticos: 0,
          tempoMedio: 0,
          tempoTotal: 0,
        };

        atual.total++;
        atual.tempoTotal += bau.dias_corridos;
        atual.tempoMedio = atual.tempoTotal / atual.total;
        
        if (bau.dias_corridos >= 10 && !['recebido', 'validado'].includes(bau.status)) {
          atual.atrasados++;
        }
        if (bau.dias_corridos >= 15 && !['recebido', 'validado'].includes(bau.status)) {
          atual.criticos++;
        }

        hospitalMap.set(bau.hospital_nome, atual);
      });

      const hospitalRanking = Array.from(hospitalMap.values())
        .sort((a, b) => b.criticos - a.criticos || b.atrasados - a.atrasados);

      // Analyst ranking
      const analistaMap = new Map<string, {
        id: string;
        nome: string;
        ativos: number;
        atrasados: number;
        criticos: number;
        tempoMedio: number;
        tempoTotal: number;
      }>();

      bausComDias.filter(b => b.responsavel_id).forEach(bau => {
        const analista = bau.responsavel;
        if (!analista) return;

        const atual = analistaMap.get(bau.responsavel_id!) || {
          id: bau.responsavel_id!,
          nome: analista.nome,
          ativos: 0,
          atrasados: 0,
          criticos: 0,
          tempoMedio: 0,
          tempoTotal: 0,
        };

        if (!['recebido', 'validado', 'cancelado'].includes(bau.status)) {
          atual.ativos++;
          atual.tempoTotal += bau.dias_corridos;
          atual.tempoMedio = atual.tempoTotal / atual.ativos;

          if (bau.dias_corridos >= 10) atual.atrasados++;
          if (bau.dias_corridos >= 15) atual.criticos++;
        }

        analistaMap.set(bau.responsavel_id!, atual);
      });

      const analistaRanking = Array.from(analistaMap.values())
        .sort((a, b) => b.atrasados - a.atrasados || b.ativos - a.ativos);

      // BAUs that need action today
      const acaoHoje = bausComDias.filter(bau => {
        if (['recebido', 'validado', 'cancelado'].includes(bau.status)) return false;
        
        // +10 days without recent contact
        if (bau.dias_corridos >= 10) return true;
        
        // Previsão vencida
        if (bau.previsao_entrega && parseISO(bau.previsao_entrega) < hoje) return true;
        
        return false;
      });

      // Hospitais críticos
      const hospitaisCriticos = Array.from(hospitalMap.values()).filter(h => h.criticos > 0);

      return {
        total,
        emAndamento,
        mais10Dias,
        criticos,
        recebidosMes,
        incompletos,
        hospitaisCriticos: hospitaisCriticos.length,
        hospitalRanking,
        analistaRanking,
        acaoHoje,
        baus: bausComDias,
      };
    },
    refetchInterval: 30000,
  });
}
