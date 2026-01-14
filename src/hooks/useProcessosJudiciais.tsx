import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProcessoJudicial {
  id: string;
  numero_processo: string;
  tribunal: string | null;
  grau: string | null;
  vara: string | null;
  comarca: string | null;
  juiz_responsavel: string | null;
  classe_processual: string | null;
  assunto_principal: string | null;
  assuntos_secundarios: string[] | null;
  autor_nome: string | null;
  autor_documento: string | null;
  autor_tipo: string | null;
  reu_nome: string | null;
  reu_documento: string | null;
  reu_tipo: string | null;
  valor_causa: number | null;
  valor_atualizado: number | null;
  custas_iniciais: number | null;
  indenizacao_pleiteada: number | null;
  indenizacao_paga: number | null;
  diferenca_valores: number | null;
  status: string;
  status_detalhado: string | null;
  ultima_movimentacao: string | null;
  data_ultima_movimentacao: string | null;
  proxima_acao: string | null;
  prazo_processual: string | null;
  alerta_prazo_dias: number | null;
  responsavel_id: string | null;
  cadastrado_por: string | null;
  prioridade: string;
  observacoes_estrategicas: string | null;
  etiquetas: string[] | null;
  data_fato: string | null;
  data_distribuicao: string | null;
  data_citacao: string | null;
  data_audiencia: string | null;
  data_pericia: string | null;
  data_sentenca: string | null;
  data_pagamento: string | null;
  dados_completos: any;
  link_externo: string | null;
  sincronizado_em: string | null;
  created_at: string;
  updated_at: string;
  funcionarios?: { nome: string } | null;
}

export interface AndamentoProcesso {
  id: string;
  processo_id: string;
  data_andamento: string;
  tipo: string | null;
  descricao: string;
  complemento: string | null;
  codigo_movimento: number | null;
  destaque: boolean;
  lido: boolean;
  lido_por: string | null;
  lido_em: string | null;
  created_at: string;
}

export interface DocumentoProcesso {
  id: string;
  processo_id: string;
  tipo_documento: string;
  nome: string;
  descricao: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface HistoricoProcesso {
  id: string;
  processo_id: string;
  usuario_id: string | null;
  acao: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AlertaPrazo {
  id: string;
  processo_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_prazo: string;
  dias_restantes: number | null;
  status: string;
  usuario_alvo_id: string | null;
  lido_em: string | null;
  created_at: string;
}

// Hook para listar processos judiciais
export function useProcessosJudiciais(filters?: {
  status?: string;
  responsavel_id?: string;
  prioridade?: string;
}) {
  return useQuery({
    queryKey: ['processos-judiciais', filters],
    queryFn: async () => {
      let query = supabase
        .from('processos_judiciais')
        .select(`
          *,
          funcionarios:responsavel_id (nome)
        `)
        .order('data_ultima_movimentacao', { ascending: false, nullsFirst: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.responsavel_id) {
        query = query.eq('responsavel_id', filters.responsavel_id);
      }
      if (filters?.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProcessoJudicial[];
    },
  });
}

// Hook para buscar um processo específico
export function useProcessoJudicial(id: string | undefined) {
  return useQuery({
    queryKey: ['processos-judiciais', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('processos_judiciais')
        .select(`
          *,
          funcionarios:responsavel_id (nome)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ProcessoJudicial;
    },
    enabled: !!id,
  });
}

// Hook para criar processo
export function useCreateProcessoJudicial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (processo: Partial<ProcessoJudicial>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepara os dados removendo campos calculados/relacionados
      const { funcionarios, diferenca_valores, ...processoData } = processo as any;
      
      const insertData = {
        numero_processo: processoData.numero_processo,
        tribunal: processoData.tribunal || null,
        grau: processoData.grau || null,
        vara: processoData.vara || null,
        comarca: processoData.comarca || null,
        juiz_responsavel: processoData.juiz_responsavel || null,
        classe_processual: processoData.classe_processual || null,
        assunto_principal: processoData.assunto_principal || null,
        autor_nome: processoData.autor_nome || null,
        autor_documento: processoData.autor_documento || null,
        autor_tipo: processoData.autor_tipo || 'pessoa_fisica',
        reu_nome: processoData.reu_nome || null,
        reu_documento: processoData.reu_documento || null,
        reu_tipo: processoData.reu_tipo || 'pessoa_juridica',
        valor_causa: processoData.valor_causa || 0,
        valor_atualizado: processoData.valor_atualizado || 0,
        custas_iniciais: processoData.custas_iniciais || 0,
        indenizacao_pleiteada: processoData.indenizacao_pleiteada || 0,
        indenizacao_paga: processoData.indenizacao_paga || 0,
        status: processoData.status || 'em_andamento',
        proxima_acao: processoData.proxima_acao || null,
        prazo_processual: processoData.prazo_processual || null,
        responsavel_id: processoData.responsavel_id || null,
        cadastrado_por: user?.id || null,
        prioridade: processoData.prioridade || 'media',
        observacoes_estrategicas: processoData.observacoes_estrategicas || null,
        etiquetas: processoData.etiquetas || null,
        data_fato: processoData.data_fato || null,
        data_distribuicao: processoData.data_distribuicao || null,
        data_audiencia: processoData.data_audiencia || null,
        data_pericia: processoData.data_pericia || null,
        data_sentenca: processoData.data_sentenca || null,
        data_pagamento: processoData.data_pagamento || null,
      };
      
      const { data, error } = await supabase
        .from('processos_judiciais')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      toast({ title: 'Processo criado com sucesso' });
    },
    onError: (error) => {
      console.error('Erro ao criar processo:', error);
      toast({ title: 'Erro ao criar processo', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para atualizar processo
export function useUpdateProcessoJudicial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...processo }: Partial<ProcessoJudicial> & { id: string }) => {
      const { data, error } = await supabase
        .from('processos_judiciais')
        .update(processo)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais', variables.id] });
      toast({ title: 'Processo atualizado com sucesso' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar processo:', error);
      toast({ title: 'Erro ao atualizar processo', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para deletar processo
export function useDeleteProcessoJudicial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('processos_judiciais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      toast({ title: 'Processo excluído com sucesso' });
    },
    onError: (error) => {
      console.error('Erro ao excluir processo:', error);
      toast({ title: 'Erro ao excluir processo', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para buscar andamentos de um processo
export function useAndamentosProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['andamentos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('andamentos_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('data_andamento', { ascending: false });
      if (error) throw error;
      return data as AndamentoProcesso[];
    },
    enabled: !!processoId,
  });
}

// Hook para buscar documentos de um processo
export function useDocumentosProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['documentos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('documentos_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocumentoProcesso[];
    },
    enabled: !!processoId,
  });
}

// Hook para buscar histórico de um processo
export function useHistoricoProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['historico-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('historico_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as HistoricoProcesso[];
    },
    enabled: !!processoId,
  });
}

// Hook para buscar alertas de prazo
export function useAlertasPrazo() {
  return useQuery({
    queryKey: ['alertas-prazo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas_prazo')
        .select(`
          *,
          processos_judiciais (numero_processo, tribunal)
        `)
        .eq('status', 'pendente')
        .order('data_prazo', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// Hook para marcar andamento como lido
export function useMarcarAndamentoLido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('andamentos_processo')
        .update({ lido: true, lido_por: user?.id, lido_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['andamentos-processo'] });
    },
  });
}

// Hook para buscar processo via DataJud
export function useBuscarProcessoDataJud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (numeroProcesso: string) => {
      const { data, error } = await supabase.functions.invoke('buscar-processo-datajud', {
        body: { numero_processo: numeroProcesso },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      toast({ title: 'Processo encontrado e importado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao buscar processo:', error);
      toast({ title: 'Erro ao buscar processo', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para sincronizar processos existentes
export function useSincronizarProcessosJudiciais() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('atualizar-processos-judiciais');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      queryClient.invalidateQueries({ queryKey: ['andamentos-processo'] });
      toast({ title: 'Sincronização concluída', description: `${data?.atualizados || 0} processos atualizados` });
    },
    onError: (error) => {
      console.error('Erro na sincronização:', error);
      toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook para estatísticas do dashboard
export function useEstatisticasProcessosJudiciais() {
  return useQuery({
    queryKey: ['estatisticas-processos-judiciais'],
    queryFn: async () => {
      const { data: processos, error } = await supabase
        .from('processos_judiciais')
        .select('*');
      
      if (error) throw error;

      const total = processos?.length || 0;
      const porStatus = processos?.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const porPrioridade = processos?.reduce((acc, p) => {
        acc[p.prioridade] = (acc[p.prioridade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const valorTotal = processos?.reduce((acc, p) => acc + (p.valor_causa || 0), 0) || 0;
      const indenizacaoPleiteada = processos?.reduce((acc, p) => acc + (p.indenizacao_pleiteada || 0), 0) || 0;
      const indenizacaoPaga = processos?.reduce((acc, p) => acc + (p.indenizacao_paga || 0), 0) || 0;

      const hoje = new Date();
      const processosComPrazo = processos?.filter(p => p.prazo_processual) || [];
      const prazosProximos = processosComPrazo.filter(p => {
        const prazo = new Date(p.prazo_processual!);
        const diff = (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }).length;

      return {
        total,
        porStatus,
        porPrioridade,
        valorTotal,
        indenizacaoPleiteada,
        indenizacaoPaga,
        prazosProximos,
        emAndamento: porStatus['em_andamento'] || 0,
        aguardandoAudiencia: porStatus['aguardando_audiencia'] || 0,
        sentenciado: porStatus['sentenciado'] || 0,
        arquivado: porStatus['arquivado'] || 0,
      };
    },
  });
}
