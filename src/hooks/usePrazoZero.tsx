import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Types from database
type EmailCategoria = Database['public']['Enums']['email_categoria'];
type PrazoPrioridade = Database['public']['Enums']['prazo_prioridade'];
type TarefaStatus = Database['public']['Enums']['tarefa_status_pz'];

// Types
export interface PZTarefa {
  id: string;
  titulo: string;
  descricao?: string | null;
  email_origem_id?: string | null;
  cliente_id?: string | null;
  processo_id?: string | null;
  protocolo_id?: string | null;
  categoria?: EmailCategoria | null;
  prioridade: PrazoPrioridade;
  status: TarefaStatus;
  data_prazo?: string | null;
  valor?: number | null;
  criado_por?: string | null;
  responsavel_id?: string | null;
  delegado_por?: string | null;
  delegado_em?: string | null;
  concluido_por?: string | null;
  concluido_em?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  responsavel?: { name: string } | null;
  cliente?: { name: string; code: number } | null;
  checklist?: PZChecklistItem[];
  comentarios?: PZComentario[];
}

export interface PZChecklistItem {
  id: string;
  tarefa_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
}

export interface PZComentario {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  comentario: string;
  created_at: string;
  usuario?: { name: string } | null;
}

export interface PZAgenda {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  data_inicio: string;
  data_fim?: string | null;
  dia_inteiro: boolean;
  tarefa_id?: string | null;
  cliente_id?: string | null;
  processo_id?: string | null;
  responsavel_id?: string | null;
  concluido: boolean;
  created_at: string;
}

export interface PZEmail {
  id: string;
  caixa_id: string | null;
  remetente: string | null;
  remetente_nome?: string | null;
  assunto?: string | null;
  corpo_texto?: string | null;
  data_recebimento?: string | null;
  categoria: EmailCategoria;
  confianca_ia?: number | null;
  triagem_pendente: boolean;
  dados_extraidos?: any;
  tem_anexos: boolean;
  lido: boolean;
}

export interface PZRegra {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  condicoes: any;
  acao_categoria?: EmailCategoria | null;
  acao_responsavel_id?: string | null;
  acao_prioridade?: PrazoPrioridade | null;
  acao_criar_tarefa: boolean;
  acao_checklist_padrao?: any;
  ordem: number;
}

// Hook para Tarefas
export function usePZTarefas(filtros?: { status?: string; responsavel?: string; categoria?: string }) {
  return useQuery({
    queryKey: ['pz-tarefas', filtros],
    queryFn: async () => {
      let query = supabase
        .from('pz_tarefas')
        .select(`
          *,
          responsavel:profiles!pz_tarefas_responsavel_id_fkey(name),
          cliente:clients(name, code)
        `)
        .order('data_prazo', { ascending: true, nullsFirst: false });

      if (filtros?.status && filtros.status !== 'todas') {
        query = query.eq('status', filtros.status as TarefaStatus);
      }
      if (filtros?.responsavel) {
        query = query.eq('responsavel_id', filtros.responsavel);
      }
      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria as EmailCategoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PZTarefa[];
    },
  });
}

export function usePZTarefa(id: string) {
  return useQuery({
    queryKey: ['pz-tarefa', id],
    queryFn: async () => {
      const { data: tarefa, error } = await supabase
        .from('pz_tarefas')
        .select(`
          *,
          responsavel:profiles!pz_tarefas_responsavel_id_fkey(name),
          cliente:clients(name, code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Buscar checklist
      const { data: checklist } = await supabase
        .from('pz_tarefa_checklist')
        .select('*')
        .eq('tarefa_id', id)
        .order('ordem');

      // Buscar comentários
      const { data: comentarios } = await supabase
        .from('pz_tarefa_comentarios')
        .select('*, usuario:profiles(name)')
        .eq('tarefa_id', id)
        .order('created_at', { ascending: false });

      return {
        ...tarefa,
        checklist: checklist || [],
        comentarios: comentarios || [],
      } as unknown as PZTarefa;
    },
    enabled: !!id,
  });
}

export function useCreatePZTarefa() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string | null;
      categoria?: EmailCategoria | null;
      prioridade?: PrazoPrioridade;
      status?: TarefaStatus;
      data_prazo?: string | null;
      valor?: number | null;
      responsavel_id?: string | null;
      cliente_id?: string | null;
      checklist_items?: string[];
    }) => {
      const { checklist_items, ...tarefaData } = data;
      
      const { data: tarefa, error } = await supabase
        .from('pz_tarefas')
        .insert({
          titulo: tarefaData.titulo,
          descricao: tarefaData.descricao,
          categoria: tarefaData.categoria,
          prioridade: tarefaData.prioridade || 'media',
          status: tarefaData.status || 'pendente',
          data_prazo: tarefaData.data_prazo,
          valor: tarefaData.valor,
          responsavel_id: tarefaData.responsavel_id,
          cliente_id: tarefaData.cliente_id,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar itens de checklist se fornecidos
      if (checklist_items && checklist_items.length > 0) {
        const checklistData = checklist_items.map((texto, index) => ({
          tarefa_id: tarefa.id,
          texto,
          ordem: index + 1,
        }));

        await supabase.from('pz_tarefa_checklist').insert(checklistData);
      }

      return tarefa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-tarefas'] });
      toast.success('Tarefa criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });
}

export function useUpdatePZTarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string;
      titulo?: string;
      descricao?: string | null;
      categoria?: EmailCategoria | null;
      prioridade?: PrazoPrioridade;
      status?: TarefaStatus;
      data_prazo?: string | null;
      valor?: number | null;
      responsavel_id?: string | null;
      cliente_id?: string | null;
    }) => {
      const { error } = await supabase
        .from('pz_tarefas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-tarefas'] });
      toast.success('Tarefa atualizada');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function useConcluirPZTarefa() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pz_tarefas')
        .update({
          status: 'concluida' as TarefaStatus,
          concluido_por: user?.id,
          concluido_em: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-tarefas'] });
      toast.success('Tarefa concluída!');
    },
  });
}

// Hook para Checklist
export function useTogglePZChecklist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase
        .from('pz_tarefa_checklist')
        .update({
          concluido,
          concluido_por: concluido ? user?.id : null,
          concluido_em: concluido ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-tarefa'] });
    },
  });
}

// Hook para Comentários
export function useAddPZComentario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tarefa_id, comentario }: { tarefa_id: string; comentario: string }) => {
      const { error } = await supabase
        .from('pz_tarefa_comentarios')
        .insert({
          tarefa_id,
          comentario,
          usuario_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-tarefa'] });
      toast.success('Comentário adicionado');
    },
  });
}

// Hook para Agenda
export function usePZAgenda(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['pz-agenda', dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('pz_agenda')
        .select(`
          *,
          responsavel:profiles(name),
          cliente:clients(name)
        `)
        .order('data_inicio');

      if (dataInicio) {
        query = query.gte('data_inicio', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_inicio', dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PZAgenda[];
    },
  });
}

export function useCreatePZEvento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string | null;
      tipo: string;
      data_inicio: string;
      data_fim?: string | null;
      dia_inteiro?: boolean;
      responsavel_id?: string | null;
      cliente_id?: string | null;
    }) => {
      const { error } = await supabase
        .from('pz_agenda')
        .insert({
          titulo: data.titulo,
          descricao: data.descricao,
          tipo: data.tipo,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          dia_inteiro: data.dia_inteiro || false,
          responsavel_id: data.responsavel_id,
          cliente_id: data.cliente_id,
          criado_por: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-agenda'] });
      toast.success('Evento criado');
    },
  });
}

// Hook para Emails (Triagem)
export function usePZEmailsTriagem() {
  return useQuery({
    queryKey: ['pz-emails-triagem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pz_emails')
        .select('*')
        .eq('triagem_pendente', true)
        .order('data_recebimento', { ascending: false });

      if (error) throw error;
      return data as unknown as PZEmail[];
    },
  });
}

export function useClassificarEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoria, criar_tarefa }: { id: string; categoria: string; criar_tarefa?: boolean }) => {
      const { error } = await supabase
        .from('pz_emails')
        .update({
          categoria: categoria as EmailCategoria,
          triagem_pendente: false,
          classificado_manualmente: true,
        })
        .eq('id', id);

      if (error) throw error;

      // TODO: Se criar_tarefa, chamar função para criar tarefa automaticamente
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-emails-triagem'] });
      toast.success('Email classificado');
    },
  });
}

// Hook para Regras
export function usePZRegras() {
  return useQuery({
    queryKey: ['pz-regras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pz_regras')
        .select(`
          *,
          responsavel:profiles!pz_regras_acao_responsavel_id_fkey(name)
        `)
        .order('ordem');

      if (error) throw error;
      return data as unknown as PZRegra[];
    },
  });
}

export function useCreatePZRegra() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      descricao?: string | null;
      condicoes: any;
      acao_categoria?: EmailCategoria | null;
      acao_responsavel_id?: string | null;
      acao_prioridade?: PrazoPrioridade | null;
      acao_criar_tarefa?: boolean;
    }) => {
      const { error } = await supabase
        .from('pz_regras')
        .insert({
          nome: data.nome,
          descricao: data.descricao,
          condicoes: data.condicoes,
          acao_categoria: data.acao_categoria,
          acao_responsavel_id: data.acao_responsavel_id,
          acao_prioridade: data.acao_prioridade,
          acao_criar_tarefa: data.acao_criar_tarefa ?? true,
          criado_por: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-regras'] });
      toast.success('Regra criada');
    },
  });
}

// Hook para Templates de Checklist
export function usePZChecklistTemplates() {
  return useQuery({
    queryKey: ['pz-checklist-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pz_checklist_templates')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
  });
}

// Hook para Dashboard Stats
export function usePZDashboardStats() {
  return useQuery({
    queryKey: ['pz-dashboard-stats'],
    queryFn: async () => {
      const now = new Date();
      const em48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
      const em7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Tarefas urgentes (até 48h)
      const { count: urgentes } = await supabase
        .from('pz_tarefas')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'concluida')
        .neq('status', 'cancelada')
        .lte('data_prazo', em48h)
        .gte('data_prazo', now.toISOString());

      // Próximos 7 dias
      const { count: proximos7d } = await supabase
        .from('pz_tarefas')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'concluida')
        .neq('status', 'cancelada')
        .gt('data_prazo', em48h)
        .lte('data_prazo', em7d);

      // Pendentes gerais
      const { count: pendentes } = await supabase
        .from('pz_tarefas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'em_andamento', 'aguardando']);

      // Pagamentos a vencer
      const { count: pagamentos } = await supabase
        .from('pz_tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('categoria', 'pagamento')
        .neq('status', 'concluida')
        .neq('status', 'cancelada');

      // Triagem pendente
      const { count: triagem } = await supabase
        .from('pz_emails')
        .select('*', { count: 'exact', head: true })
        .eq('triagem_pendente', true);

      return {
        urgentes: urgentes || 0,
        proximos7d: proximos7d || 0,
        pendentes: pendentes || 0,
        pagamentos: pagamentos || 0,
        triagem: triagem || 0,
      };
    },
  });
}

// Hook para Usuários (para delegação)
export function usePZUsuarios() {
  return useQuery({
    queryKey: ['pz-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .order('name');

      if (error) throw error;
      return (data || []) as { id: string; name: string | null; role: string | null }[];
    },
  });
}

// ============ CONEXÕES DE EMAIL ============

export interface PZEmailConexao {
  id: string;
  nome: string;
  tipo: 'gmail' | 'outlook' | 'imap';
  email: string;
  imap_host?: string | null;
  imap_port?: number | null;
  ativo: boolean;
  ultimo_sync?: string | null;
  erro_ultimo_sync?: string | null;
  created_at: string;
}

export function usePZEmailConexoes() {
  return useQuery({
    queryKey: ['pz-email-conexoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pz_email_conexoes')
        .select('id, nome, tipo, email, imap_host, imap_port, ativo, ultimo_sync, erro_ultimo_sync, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PZEmailConexao[];
    },
  });
}

export function useCreatePZEmailConexao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      tipo: 'gmail' | 'outlook' | 'imap';
      email: string;
      imap_host?: string;
      imap_port?: number;
      imap_user?: string;
      imap_password?: string;
    }) => {
      const { error } = await supabase
        .from('pz_email_conexoes')
        .insert({
          nome: data.nome,
          tipo: data.tipo,
          email: data.email,
          imap_host: data.imap_host,
          imap_port: data.imap_port || 993,
          imap_user: data.imap_user,
          imap_password: data.imap_password,
          criado_por: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-email-conexoes'] });
      toast.success('Conexão de e-mail salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar conexão: ' + error.message);
    },
  });
}

export function useDeletePZEmailConexao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pz_email_conexoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-email-conexoes'] });
      toast.success('Conexão removida');
    },
  });
}

// ============ GMAIL OAUTH ============

export interface PZGmailToken {
  id: string;
  user_id: string;
  email: string;
  token_expiry: string;
  created_at: string;
  updated_at: string;
}

export function usePZGmailTokens() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pz-gmail-tokens', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data, error } = await (supabase as any)
          .from('pz_gmail_tokens')
          .select('id, user_id, email, token_expiry, created_at, updated_at')
          .eq('user_id', user.id);

        if (error) {
          console.error('Gmail tokens error:', error);
          return [];
        }
        return (data || []) as PZGmailToken[];
      } catch (e) {
        console.error('Gmail tokens error:', e);
        return [];
      }
    },
    enabled: !!user?.id,
  });
}

export function useGmailOAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você precisa estar logado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao iniciar OAuth');
      }

      const { authUrl } = await response.json();
      return authUrl;
    },
    onSuccess: (authUrl) => {
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for completion
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'gmail-oauth-success') {
          queryClient.invalidateQueries({ queryKey: ['pz-gmail-tokens'] });
          toast.success('Gmail conectado com sucesso!');
        }
        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao conectar Gmail');
    },
  });
}

export function useGmailSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você precisa estar logado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pz-emails-triagem'] });
      queryClient.invalidateQueries({ queryKey: ['pz-dashboard-stats'] });
      toast.success(`Sincronização concluída: ${data.imported} novos e-mails importados`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar');
    },
  });
}

export function useGmailClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você precisa estar logado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-classify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao classificar');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pz-emails-triagem'] });
      toast.success(`${data.classified} e-mails classificados pela IA`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao classificar');
    },
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await (supabase as any)
        .from('pz_gmail_tokens')
        .delete()
        .eq('id', tokenId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pz-gmail-tokens'] });
      toast.success('Gmail desconectado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desconectar');
    },
  });
}
