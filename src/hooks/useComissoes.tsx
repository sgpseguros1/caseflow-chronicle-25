import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Comissao {
  id: string;
  cliente_id: string;
  tipo_indenizacao: string;
  data_acidente: string;
  valor: number | null;
  status: 'pendente' | 'paga' | 'bloqueada';
  observacoes: string | null;
  motivo_bloqueio: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  pago_por: string | null;
  pago_em: string | null;
  beneficiario_nome: string | null;
  // Joined data
  clients?: {
    id: string;
    name: string;
    cpf: string | null;
    accident_date: string | null;
    accident_type: string | null;
  };
  created_by_profile?: {
    name: string;
    email: string;
  };
  pago_por_profile?: {
    name: string;
    email: string;
  };
}

export interface ComissaoHistorico {
  id: string;
  comissao_id: string;
  acao: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export interface ComissoesStats {
  total: number;
  pendentes: number;
  pagas: number;
  bloqueadas: number;
  valorTotalPago: number;
  valorTotalPendente: number;
  porUsuario: { usuario_id: string; nome: string; count: number }[];
  porTipo: { tipo: string; count: number }[];
}

export const TIPOS_INDENIZACAO = [
  'Auxílio-Acidente',
  'DPVAT',
  'Seguro de Vida',
  'Seguro Vida Empresarial',
  'Judicial',
  'Administrativo',
  'Previdenciário',
  'Danos Materiais',
  'Danos Morais',
  'Outro',
] as const;

export const STATUS_COMISSAO = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  paga: { label: 'Paga', color: 'bg-green-100 text-green-800' },
  bloqueada: { label: 'Bloqueada', color: 'bg-red-100 text-red-800' },
} as const;

// Hook para listar comissões (com filtros)
export function useComissoes(filters?: {
  status?: string;
  tipo?: string;
  periodo?: { inicio: string; fim: string };
}) {
  return useQuery({
    queryKey: ['comissoes', filters],
    queryFn: async () => {
      // Buscar comissões
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          clients (id, name, cpf, accident_date, accident_type)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.tipo) {
        query = query.eq('tipo_indenizacao', filters.tipo);
      }
      if (filters?.periodo) {
        query = query
          .gte('created_at', filters.periodo.inicio)
          .lte('created_at', filters.periodo.fim);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar profiles para created_by e pago_por
      const userIds = new Set<string>();
      data?.forEach((c) => {
        if (c.created_by) userIds.add(c.created_by);
        if (c.pago_por) userIds.add(c.pago_por);
      });

      let profilesMap: Record<string, { name: string; email: string }> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        profiles?.forEach((p) => {
          profilesMap[p.id] = { name: p.name, email: p.email };
        });
      }

      // Mapear profiles nas comissões e ordenar alfabeticamente por nome do cliente
      const comissoesComProfiles = data?.map((c) => ({
        ...c,
        created_by_profile: c.created_by ? profilesMap[c.created_by] : undefined,
        pago_por_profile: c.pago_por ? profilesMap[c.pago_por] : undefined,
      })) || [];

      // Ordenar alfabeticamente pelo nome do cliente
      comissoesComProfiles.sort((a, b) => {
        const nameA = a.clients?.name?.toLowerCase() || '';
        const nameB = b.clients?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });

      return comissoesComProfiles as Comissao[];
    },
  });
}

// Hook para buscar comissão por ID
export function useComissao(id: string | undefined) {
  return useQuery({
    queryKey: ['comissao', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('comissoes')
        .select(`
          *,
          clients (id, name, cpf, accident_date, accident_type)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Comissao;
    },
    enabled: !!id,
  });
}

// Hook para verificar duplicidade
export function useVerificarDuplicidade() {
  return useMutation({
    mutationFn: async ({
      cliente_id,
      data_acidente,
      tipo_indenizacao,
    }: {
      cliente_id: string;
      data_acidente: string;
      tipo_indenizacao: string;
    }) => {
      const { data, error } = await supabase
        .from('comissoes')
        .select('id, status')
        .eq('cliente_id', cliente_id)
        .eq('data_acidente', data_acidente)
        .eq('tipo_indenizacao', tipo_indenizacao)
        .is('deleted_at', null);

      if (error) throw error;
      return data && data.length > 0;
    },
  });
}

// Hook para criar comissão
export function useCreateComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comissao: {
      cliente_id: string;
      tipo_indenizacao: string;
      data_acidente: string;
      valor?: number;
      observacoes?: string;
    }) => {
      // Obter usuário logado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar duplicidade antes de criar
      const { data: existente, error: checkError } = await supabase
        .from('comissoes')
        .select('id, status')
        .eq('cliente_id', comissao.cliente_id)
        .eq('data_acidente', comissao.data_acidente)
        .eq('tipo_indenizacao', comissao.tipo_indenizacao)
        .is('deleted_at', null);

      if (checkError) throw checkError;

      if (existente && existente.length > 0) {
        throw new Error('Comissão já registrada ou já paga para este cliente e este acidente.');
      }

      const { data, error } = await supabase
        .from('comissoes')
        .insert({
          cliente_id: comissao.cliente_id,
          tipo_indenizacao: comissao.tipo_indenizacao,
          data_acidente: comissao.data_acidente,
          valor: comissao.valor || null,
          observacoes: comissao.observacoes || null,
          status: 'pendente',
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook para pagar comissão (com beneficiário)
export function usePagarComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      beneficiario_nome,
    }: {
      id: string;
      beneficiario_nome: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('comissoes')
        .update({
          status: 'paga',
          pago_por: userData.user?.id,
          pago_em: new Date().toISOString(),
          beneficiario_nome,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`*, clients (id, name)`)
        .single();

      if (error) throw error;
      
      // Adicionar etiqueta de comissão paga no cliente
      if (data.cliente_id) {
        // Buscar etiquetas existentes do cliente nos protocolos
        const { data: protocolos } = await supabase
          .from('protocolos')
          .select('id')
          .eq('cliente_id', data.cliente_id)
          .limit(1);

        if (protocolos && protocolos.length > 0) {
          // Verificar se já existe a etiqueta
          const { data: etiquetaExistente } = await supabase
            .from('protocolo_etiquetas')
            .select('id')
            .eq('protocolo_id', protocolos[0].id)
            .eq('codigo', 'COMISSAO_PAGA')
            .single();

          if (!etiquetaExistente) {
            await supabase.from('protocolo_etiquetas').insert({
              protocolo_id: protocolos[0].id,
              codigo: 'COMISSAO_PAGA',
              nome: `Comissão Paga - ${beneficiario_nome}`,
              tipo: 'status',
              cor: '#22c55e',
              gerado_automaticamente: true,
              regra_aplicada: 'Comissão marcada como paga',
            });
          }
        }

        // Também criar um alerta no cliente
        await supabase.from('client_alerts').insert({
          client_id: data.cliente_id,
          tipo: 'comissao_paga',
          titulo: 'Comissão Paga',
          descricao: `Comissão paga para ${beneficiario_nome}`,
          prioridade: 'baixa',
          status: 'resolvido',
          resolved_at: new Date().toISOString(),
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-pagas'] });
      toast.success('Comissão paga com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao pagar comissão');
    },
  });
}

// Hook para atualizar status da comissão
export function useUpdateComissaoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      motivo_bloqueio,
    }: {
      id: string;
      status: 'pendente' | 'paga' | 'bloqueada';
      motivo_bloqueio?: string;
    }) => {
      const { data, error } = await supabase
        .from('comissoes')
        .update({
          status,
          motivo_bloqueio: motivo_bloqueio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Status da comissão atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status da comissão');
    },
  });
}

// Hook para soft delete (apenas admin/gestor)
export function useDeleteComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('comissoes')
        .update({
          deleted_at: new Date().toISOString(),
          deletion_reason: motivo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir comissão');
    },
  });
}

// Hook para histórico de comissão
export function useComissaoHistorico(comissaoId: string | undefined) {
  return useQuery({
    queryKey: ['comissao-historico', comissaoId],
    queryFn: async () => {
      if (!comissaoId) return [];
      const { data, error } = await supabase
        .from('comissoes_historico')
        .select('*')
        .eq('comissao_id', comissaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar profiles dos usuários
      const userIds = new Set<string>();
      data?.forEach((h) => {
        if (h.usuario_id) userIds.add(h.usuario_id);
      });

      let profilesMap: Record<string, { name: string; email: string }> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        profiles?.forEach((p) => {
          profilesMap[p.id] = { name: p.name, email: p.email };
        });
      }

      return data.map((h) => ({
        ...h,
        profiles: h.usuario_id ? profilesMap[h.usuario_id] : undefined,
      })) as ComissaoHistorico[];
    },
    enabled: !!comissaoId,
  });
}

// Hook para listar comissões pagas (para a aba de pagamentos)
export function useComissoesPagas(periodo?: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['comissoes-pagas', periodo],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          clients (id, name, cpf)
        `)
        .eq('status', 'paga')
        .is('deleted_at', null)
        .order('pago_em', { ascending: false });

      if (periodo) {
        query = query
          .gte('pago_em', periodo.inicio)
          .lte('pago_em', periodo.fim);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar profiles
      const userIds = new Set<string>();
      data?.forEach((c) => {
        if (c.pago_por) userIds.add(c.pago_por);
        if (c.created_by) userIds.add(c.created_by);
      });

      let profilesMap: Record<string, { name: string; email: string }> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        profiles?.forEach((p) => {
          profilesMap[p.id] = { name: p.name, email: p.email };
        });
      }

      return (data || []).map((c) => ({
        ...c,
        clients: c.clients ? {
          ...c.clients,
          accident_date: (c.clients as any).accident_date || null,
          accident_type: (c.clients as any).accident_type || null,
        } : undefined,
        created_by_profile: c.created_by ? profilesMap[c.created_by] : undefined,
        pago_por_profile: c.pago_por ? profilesMap[c.pago_por] : undefined,
      })) as Comissao[];
    },
  });
}

// Hook para estatísticas do dashboard
export function useComissoesStats(periodo?: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['comissoes-stats', periodo],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select('*')
        .is('deleted_at', null);

      if (periodo) {
        query = query
          .gte('created_at', periodo.inicio)
          .lte('created_at', periodo.fim);
      }

      const { data, error } = await query;
      if (error) throw error;

      const comissoes = data || [];

      // Buscar profiles dos usuários que criaram
      const userIds = new Set<string>();
      comissoes.forEach((c) => {
        if (c.created_by) userIds.add(c.created_by);
      });

      let profilesMap: Record<string, { name: string; email: string }> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        profiles?.forEach((p) => {
          profilesMap[p.id] = { name: p.name, email: p.email };
        });
      }

      const stats: ComissoesStats = {
        total: comissoes.length,
        pendentes: comissoes.filter((c) => c.status === 'pendente').length,
        pagas: comissoes.filter((c) => c.status === 'paga').length,
        bloqueadas: comissoes.filter((c) => c.status === 'bloqueada').length,
        valorTotalPago: comissoes
          .filter((c) => c.status === 'paga')
          .reduce((acc, c) => acc + (c.valor || 0), 0),
        valorTotalPendente: comissoes
          .filter((c) => c.status === 'pendente')
          .reduce((acc, c) => acc + (c.valor || 0), 0),
        porUsuario: [],
        porTipo: [],
      };

      // Agrupar por usuário
      const porUsuario = comissoes.reduce((acc, c) => {
        const key = c.created_by || 'desconhecido';
        if (!acc[key]) {
          acc[key] = { count: 0, nome: profilesMap[key]?.name || 'Desconhecido' };
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { count: number; nome: string }>);
      stats.porUsuario = Object.entries(porUsuario).map(([usuario_id, data]) => ({
        usuario_id,
        nome: data.nome,
        count: data.count,
      }));

      // Agrupar por tipo
      const porTipo = comissoes.reduce((acc, c) => {
        acc[c.tipo_indenizacao] = (acc[c.tipo_indenizacao] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      stats.porTipo = Object.entries(porTipo).map(([tipo, count]) => ({
        tipo,
        count,
      }));

      return stats;
    },
  });
}
