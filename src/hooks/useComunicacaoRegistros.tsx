import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ComunicacaoRegistro {
  id: string;
  canal: 'whatsapp' | 'email' | 'sms' | 'interno' | 'telefone';
  direcao: 'entrada' | 'saida';
  remetente_id: string | null;
  destinatario_id: string | null;
  cliente_id: string | null;
  processo_id: string | null;
  protocolo_id: string | null;
  bau_id: string | null;
  assunto: string | null;
  conteudo: string;
  status: 'rascunho' | 'enviado' | 'entregue' | 'lido' | 'falha';
  data_leitura: string | null;
  metadados: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joins
  cliente?: { name: string; code: number };
  remetente?: { name: string };
  destinatario?: { name: string };
}

export const CANAL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  sms: 'SMS',
  interno: 'Interno',
  telefone: 'Telefone',
};

export const CANAL_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800',
  email: 'bg-blue-100 text-blue-800',
  sms: 'bg-purple-100 text-purple-800',
  interno: 'bg-gray-100 text-gray-800',
  telefone: 'bg-orange-100 text-orange-800',
};

// ==========================================
// HOOK: Fetch all communications
// ==========================================
export function useComunicacaoRegistros(filters?: {
  canal?: string;
  cliente_id?: string;
  processo_id?: string;
  bau_id?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comunicacao-registros', filters],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('comunicacao_registros')
        .select(`
          *,
          cliente:clients(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.canal) {
        queryBuilder = queryBuilder.eq('canal', filters.canal);
      }
      if (filters?.cliente_id) {
        queryBuilder = queryBuilder.eq('cliente_id', filters.cliente_id);
      }
      if (filters?.processo_id) {
        queryBuilder = queryBuilder.eq('processo_id', filters.processo_id);
      }
      if (filters?.bau_id) {
        queryBuilder = queryBuilder.eq('bau_id', filters.bau_id);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as ComunicacaoRegistro[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('comunicacao-registros-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comunicacao_registros' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comunicacao-registros'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// ==========================================
// HOOK: Fetch communications by client
// ==========================================
export function useComunicacaoByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['comunicacao-registros', 'client', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('comunicacao_registros')
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ComunicacaoRegistro[];
    },
    enabled: !!clientId,
  });
}

// ==========================================
// HOOK: Create communication
// ==========================================
export function useCreateComunicacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      canal: string;
      conteudo: string;
      assunto?: string;
      cliente_id?: string;
      processo_id?: string;
      protocolo_id?: string;
      bau_id?: string;
      destinatario_id?: string;
      direcao?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('comunicacao_registros')
        .insert({
          ...data,
          remetente_id: userData.user?.id,
          direcao: data.direcao || 'saida',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicacao-registros'] });
      toast({ title: 'Comunicação registrada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar comunicação', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Dashboard stats
// ==========================================
export function useComunicacaoDashboard() {
  return useQuery({
    queryKey: ['comunicacao-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const { data, error } = await supabase
        .from('comunicacao_registros')
        .select('canal, direcao, status, created_at')
        .gte('created_at', inicioMes.toISOString());

      if (error) throw error;

      const porCanal: Record<string, number> = {};
      const porDia: Record<string, number> = {};
      let enviados = 0;
      let recebidos = 0;

      (data || []).forEach(comm => {
        porCanal[comm.canal] = (porCanal[comm.canal] || 0) + 1;
        
        const dia = comm.created_at.split('T')[0];
        porDia[dia] = (porDia[dia] || 0) + 1;
        
        if (comm.direcao === 'saida') enviados++;
        else recebidos++;
      });

      return {
        total: data?.length || 0,
        enviados,
        recebidos,
        porCanal,
        porDia,
      };
    },
  });
}
