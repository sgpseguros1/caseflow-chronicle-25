import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// ==========================================
// TYPES
// ==========================================
export interface Conversa {
  id: string;
  titulo: string | null;
  canal: string;
  cliente_id: string | null;
  bau_id: string | null;
  processo_id: string | null;
  protocolo_id: string | null;
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'arquivado';
  responsavel_id: string | null;
  ultima_mensagem_em: string | null;
  ultima_mensagem: string | null;
  total_mensagens: number;
  nao_lidas: number;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  etiquetas: string[] | null;
  created_at: string;
  updated_at: string;
  // Joins
  cliente?: { name: string; code: number } | null;
  responsavel?: { nome: string } | null;
}

export interface Mensagem {
  id: string;
  canal: string;
  direcao: 'entrada' | 'saida';
  remetente_id: string | null;
  destinatario_id: string | null;
  cliente_id: string | null;
  conversa_id: string | null;
  assunto: string | null;
  conteudo: string;
  status: string;
  atendente_id: string | null;
  atendente_nome: string | null;
  anexos: any[];
  origem: string | null;
  created_at: string;
  // Joins
  cliente?: { name: string; code: number } | null;
}

export interface CanalConfig {
  id: string;
  canal: string;
  nome_exibicao: string;
  ativo: boolean;
  configuracao: Record<string, any>;
  ultimo_sync: string | null;
}

export const CANAL_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  whatsapp: { icon: 'MessageSquare', color: 'text-green-600', bg: 'bg-green-100' },
  email: { icon: 'Mail', color: 'text-blue-600', bg: 'bg-blue-100' },
  sms: { icon: 'Phone', color: 'text-purple-600', bg: 'bg-purple-100' },
  interno: { icon: 'Zap', color: 'text-amber-600', bg: 'bg-amber-100' },
  telefone: { icon: 'PhoneCall', color: 'text-orange-600', bg: 'bg-orange-100' },
  facebook: { icon: 'Facebook', color: 'text-blue-700', bg: 'bg-blue-50' },
  instagram: { icon: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-100' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-yellow-100 text-yellow-800' },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-blue-100 text-blue-800' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800' },
  arquivado: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800' },
};

// ==========================================
// HOOKS
// ==========================================

export function useConversas(filters?: {
  canal?: string;
  status?: string;
  responsavel_id?: string;
  cliente_id?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comunicacao-conversas', filters],
    queryFn: async () => {
      let queryBuilder = (supabase as any)
        .from('comunicacao_conversas')
        .select(`
          *,
          cliente:clients(name, code)
        `)
        .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
        .limit(200);

      if (filters?.canal && filters.canal !== 'todos') {
        queryBuilder = queryBuilder.eq('canal', filters.canal);
      }
      if (filters?.status && filters.status !== 'todos') {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }
      if (filters?.responsavel_id) {
        queryBuilder = queryBuilder.eq('responsavel_id', filters.responsavel_id);
      }
      if (filters?.cliente_id) {
        queryBuilder = queryBuilder.eq('cliente_id', filters.cliente_id);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return (data || []) as Conversa[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('conversas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comunicacao_conversas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['comunicacao-conversas'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useMensagensConversa(conversaId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comunicacao-mensagens', conversaId],
    queryFn: async () => {
      if (!conversaId) return [];

      const { data, error } = await (supabase as any)
        .from('comunicacao_registros')
        .select(`*, cliente:clients(name, code)`)
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map to our interface with defaults
      return (data || []).map((d: any) => ({
        ...d,
        conversa_id: d.conversa_id || null,
        atendente_id: d.atendente_id || null,
        atendente_nome: d.atendente_nome || null,
        anexos: (d as any).anexos || [],
        origem: (d as any).origem || 'manual',
      })) as Mensagem[];
    },
    enabled: !!conversaId,
  });

  // Realtime
  useEffect(() => {
    if (!conversaId) return;

    const channel = supabase
      .channel(`mensagens-${conversaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comunicacao_registros' }, (payload) => {
        if ((payload.new as any).conversa_id === conversaId) {
          queryClient.invalidateQueries({ queryKey: ['comunicacao-mensagens', conversaId] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversaId, queryClient]);

  return query;
}

export function useCanaisConfig() {
  return useQuery({
    queryKey: ['comunicacao-canais-config'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('comunicacao_canais_config')
        .select('*')
        .order('nome_exibicao');

      if (error) throw error;
      return (data || []) as CanalConfig[];
    },
  });
}

export function useCreateConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      titulo?: string;
      canal: string;
      cliente_id?: string;
      bau_id?: string;
      processo_id?: string;
      protocolo_id?: string;
      prioridade?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data: result, error } = await (supabase as any)
        .from('comunicacao_conversas')
        .insert({
          ...data,
          responsavel_id: userData.user?.id,
          status: 'aberto',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicacao-conversas'] });
      toast({ title: 'Conversa criada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar conversa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useEnviarMensagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversa_id: string;
      canal: string;
      conteudo: string;
      assunto?: string;
      cliente_id?: string;
      direcao?: 'entrada' | 'saida';
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userData.user?.id || '')
        .maybeSingle();

      const { data: result, error } = await supabase
        .from('comunicacao_registros')
        .insert({
          ...data,
          remetente_id: userData.user?.id,
          direcao: data.direcao || 'saida',
          status: 'enviado',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comunicacao-mensagens', variables.conversa_id] });
      queryClient.invalidateQueries({ queryKey: ['comunicacao-conversas'] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAtualizarConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; responsavel_id?: string; prioridade?: string }) => {
      const { error } = await (supabase as any)
        .from('comunicacao_conversas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicacao-conversas'] });
      toast({ title: 'Conversa atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar conversa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAtribuirConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversa_id, funcionario_id, funcionario_nome }: { conversa_id: string; funcionario_id: string; funcionario_nome: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userData.user?.id || '').maybeSingle();

      // Atualizar conversa
      await (supabase as any)
        .from('comunicacao_conversas')
        .update({ responsavel_id: funcionario_id, status: 'em_atendimento', updated_at: new Date().toISOString() })
        .eq('id', conversa_id);

      // Log de atribuição
      await (supabase as any)
        .from('comunicacao_atribuicoes')
        .insert({
          conversa_id,
          funcionario_id,
          funcionario_nome,
          acao: 'atribuiu',
          observacao: `Atribuído por ${profile?.name || 'Sistema'}`,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicacao-conversas'] });
      toast({ title: 'Conversa atribuída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atribuir conversa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useComunicacaoStats() {
  return useQuery({
    queryKey: ['comunicacao-stats'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Conversas
      const { data: conversas } = await (supabase as any)
        .from('comunicacao_conversas')
        .select('id, status, canal, nao_lidas, created_at')
        .gte('created_at', inicioMes.toISOString());

      // Mensagens hoje
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const { count: mensagensHoje } = await supabase
        .from('comunicacao_registros')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', inicioHoje.toISOString());

      const conversasList = (conversas || []) as any[];
      const abertas = conversasList.filter(c => c.status === 'aberto').length;
      const emAtendimento = conversasList.filter(c => c.status === 'em_atendimento').length;
      const naoLidas = conversasList.reduce((acc, c) => acc + (c.nao_lidas || 0), 0);

      const porCanal: Record<string, number> = {};
      conversasList.forEach(c => {
        porCanal[c.canal] = (porCanal[c.canal] || 0) + 1;
      });

      return {
        total: conversasList.length,
        abertas,
        emAtendimento,
        naoLidas,
        mensagensHoje: mensagensHoje || 0,
        porCanal,
      };
    },
    refetchInterval: 30000,
  });
}
