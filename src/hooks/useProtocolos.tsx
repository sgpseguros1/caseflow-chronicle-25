import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { 
  Protocolo, 
  ProtocoloAuxilioAcidente, 
  ProtocoloHistorico, 
  ProtocoloDocumento,
  ProtocoloFinanceiro,
  ProtocoloEtiqueta,
  ProtocoloAlerta,
  ProtocoloChecklistEncerramento,
  ProtocoloResponsavel,
  StatusProtocolo,
  TipoProtocolo,
} from '@/types/protocolo';

// ==========================================
// HOOK: Listar todos os protocolos
// ==========================================
export function useProtocolos() {
  return useQuery({
    queryKey: ['protocolos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocolos')
        .select(`
          *,
          cliente:clients(name, cpf),
          seguradora:seguradoras(razao_social),
          advogado:advogados(nome),
          funcionario:funcionarios(nome),
          etiquetas:protocolo_etiquetas(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calcular dias parado
      return (data || []).map(p => ({
        ...p,
        dias_parado: p.data_ultima_movimentacao 
          ? Math.floor((Date.now() - new Date(p.data_ultima_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      })) as Protocolo[];
    },
  });
}

// ==========================================
// HOOK: Buscar protocolo por ID
// ==========================================
export function useProtocolo(id: string | undefined) {
  return useQuery({
    queryKey: ['protocolos', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('protocolos')
        .select(`
          *,
          cliente:clients(name, cpf, phone1, email),
          seguradora:seguradoras(razao_social),
          advogado:advogados(nome),
          funcionario:funcionarios(nome),
          etiquetas:protocolo_etiquetas(*),
          financeiro:protocolo_financeiro(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        dias_parado: data.data_ultima_movimentacao 
          ? Math.floor((Date.now() - new Date(data.data_ultima_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        financeiro: Array.isArray(data.financeiro) ? data.financeiro[0] : data.financeiro,
      } as Protocolo;
    },
    enabled: !!id,
  });
}

// ==========================================
// HOOK: Protocolos por cliente
// ==========================================
export function useProtocolosByCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['protocolos', 'cliente', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      
      const { data, error } = await supabase
        .from('protocolos')
        .select(`
          *,
          seguradora:seguradoras(razao_social),
          advogado:advogados(nome),
          funcionario:funcionarios(nome),
          etiquetas:protocolo_etiquetas(*)
        `)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Protocolo[];
    },
    enabled: !!clienteId,
  });
}

// ==========================================
// HOOK: Criar protocolo
// ==========================================
export function useCreateProtocolo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (protocolo: Partial<Protocolo>) => {
      const { data, error } = await supabase
        .from('protocolos')
        .insert(protocolo as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-protocolos'] });
      toast({ title: 'Protocolo criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar protocolo', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Atualizar protocolo (com histórico)
// ==========================================
export function useUpdateProtocolo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      observacaoHistorico,
      ...protocolo 
    }: Partial<Protocolo> & { id: string; observacaoHistorico: string }) => {
      // Buscar dados atuais para comparação
      const { data: atual } = await supabase
        .from('protocolos')
        .select('*')
        .eq('id', id)
        .single();
      
      // Atualizar protocolo
      const { data, error } = await supabase
        .from('protocolos')
        .update(protocolo)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Registrar histórico para cada campo alterado
      if (atual) {
        const alteracoes: { campo: string; anterior: string | null; novo: string | null }[] = [];
        
        Object.keys(protocolo).forEach(campo => {
          if (atual[campo] !== (protocolo as any)[campo]) {
            alteracoes.push({
              campo,
              anterior: String(atual[campo] ?? ''),
              novo: String((protocolo as any)[campo] ?? ''),
            });
          }
        });
        
        if (alteracoes.length > 0) {
          const { data: userData } = await supabase.auth.getUser();
          
          await supabase.from('protocolo_historico').insert(
            alteracoes.map(alt => ({
              protocolo_id: id,
              campo_alterado: alt.campo,
              valor_anterior: alt.anterior,
              valor_novo: alt.novo,
              usuario_id: userData.user?.id,
              observacao: observacaoHistorico,
            }))
          );
        }
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos'] });
      queryClient.invalidateQueries({ queryKey: ['protocolos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-protocolos'] });
      toast({ title: 'Protocolo atualizado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Deletar protocolo
// ==========================================
export function useDeleteProtocolo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('protocolos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-protocolos'] });
      toast({ title: 'Protocolo excluído com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Histórico do protocolo
// ==========================================
export function useProtocoloHistorico(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-historico', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return [];
      
      const { data, error } = await supabase
        .from('protocolo_historico')
        .select('*')
        .eq('protocolo_id', protocoloId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProtocoloHistorico[];
    },
    enabled: !!protocoloId,
  });
}

// ==========================================
// HOOK: Documentos do protocolo
// ==========================================
export function useProtocoloDocumentos(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-documentos', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return [];
      
      const { data, error } = await supabase
        .from('protocolo_documentos')
        .select('*')
        .eq('protocolo_id', protocoloId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProtocoloDocumento[];
    },
    enabled: !!protocoloId,
  });
}

// ==========================================
// HOOK: Atualizar status de documento
// ==========================================
export function useUpdateDocumentoStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      validado_por,
    }: { 
      id: string; 
      status: string;
      validado_por?: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'validado' && validado_por) {
        updateData.validado_por = validado_por;
        updateData.validado_em = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('protocolo_documentos')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolo-documentos'] });
      toast({ title: 'Status do documento atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar documento', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Financeiro do protocolo
// ==========================================
export function useProtocoloFinanceiro(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-financeiro', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return null;
      
      const { data, error } = await supabase
        .from('protocolo_financeiro')
        .select('*')
        .eq('protocolo_id', protocoloId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProtocoloFinanceiro | null;
    },
    enabled: !!protocoloId,
  });
}

// ==========================================
// HOOK: Criar/Atualizar financeiro
// ==========================================
export function useUpsertProtocoloFinanceiro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (financeiro: Partial<ProtocoloFinanceiro> & { protocolo_id: string }) => {
      const { data, error } = await supabase
        .from('protocolo_financeiro')
        .upsert(financeiro, { onConflict: 'protocolo_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolo-financeiro', variables.protocolo_id] });
      queryClient.invalidateQueries({ queryKey: ['protocolos', variables.protocolo_id] });
      toast({ title: 'Dados financeiros salvos' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar financeiro', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Alertas de protocolo
// ==========================================
export function useProtocoloAlertas(protocoloId?: string) {
  return useQuery({
    queryKey: ['protocolo-alertas', protocoloId],
    queryFn: async () => {
      let query = supabase
        .from('protocolo_alertas')
        .select('*, protocolo:protocolos(codigo, tipo, cliente:clients(name))')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (protocoloId) {
        query = query.eq('protocolo_id', protocoloId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProtocoloAlerta[];
    },
  });
}

// ==========================================
// HOOK: Resolver alerta
// ==========================================
export function useResolverProtocoloAlerta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('protocolo_alertas')
        .update({
          status: 'resolvido',
          resolvido_por: userData.user?.id,
          resolvido_em: new Date().toISOString(),
          resolucao_observacao: observacao,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolo-alertas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-protocolos'] });
      toast({ title: 'Alerta resolvido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao resolver alerta', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Auxílio-Acidente
// ==========================================
export function useProtocoloAuxilioAcidente(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-auxilio', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return null;
      
      const { data, error } = await supabase
        .from('protocolo_auxilio_acidente')
        .select('*')
        .eq('protocolo_id', protocoloId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProtocoloAuxilioAcidente | null;
    },
    enabled: !!protocoloId,
  });
}

// ==========================================
// HOOK: Upsert Auxílio-Acidente
// ==========================================
export function useUpsertAuxilioAcidente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ProtocoloAuxilioAcidente> & { protocolo_id: string }) => {
      const { data: result, error } = await supabase
        .from('protocolo_auxilio_acidente')
        .upsert(data, { onConflict: 'protocolo_id' })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolo-auxilio', variables.protocolo_id] });
      toast({ title: 'Dados de Auxílio-Acidente salvos' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });
}

// ==========================================
// HOOK: Checklist de encerramento
// ==========================================
export function useProtocoloChecklist(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-checklist', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return null;
      
      const { data, error } = await supabase
        .from('protocolo_checklist_encerramento')
        .select('*')
        .eq('protocolo_id', protocoloId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProtocoloChecklistEncerramento | null;
    },
    enabled: !!protocoloId,
  });
}

// ==========================================
// HOOK: Responsáveis do protocolo
// ==========================================
export function useProtocoloResponsaveis(protocoloId: string | undefined) {
  return useQuery({
    queryKey: ['protocolo-responsaveis', protocoloId],
    queryFn: async () => {
      if (!protocoloId) return [];
      
      const { data, error } = await supabase
        .from('protocolo_responsaveis')
        .select('*, funcionario:funcionarios(nome)')
        .eq('protocolo_id', protocoloId)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return data as ProtocoloResponsavel[];
    },
    enabled: !!protocoloId,
  });
}
