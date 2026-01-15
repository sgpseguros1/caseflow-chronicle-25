import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export interface Pericia {
  id: string;
  cliente_id: string;
  tipo_pericia: 'inss' | 'auxilio_doenca' | 'auxilio_acidente' | 'dpvat' | 'seguro_vida' | 'judicial' | 'acidente_trabalho' | 'danos' | 'junta_medica' | 'outros';
  status: 'agendada' | 'realizada_aguardando_pagamento' | 'cliente_faltou';
  data_pericia: string;
  hora_pericia: string | null;
  medico_responsavel: string | null;
  crm_medico: string | null;
  clinica_nome: string | null;
  clinica_endereco: string | null;
  clinica_numero: string | null;
  clinica_bairro: string | null;
  clinica_cidade: string | null;
  clinica_cep: string | null;
  clinica_telefone: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cliente?: { id: string; name: string; code: number };
  junta_medica?: JuntaMedica | null;
}

export interface JuntaMedica {
  id: string;
  pericia_id: string;
  local_junta: string;
  endereco_junta: string | null;
  data_junta: string;
  hora_junta: string | null;
  observacoes: string | null;
  created_at: string;
  medicos?: JuntaMedico[];
}

export interface JuntaMedico {
  id: string;
  junta_id: string;
  nome_medico: string;
  crm: string;
  especialidade: string | null;
  endereco_profissional: string | null;
  telefone: string | null;
  created_at: string;
}

export interface PericiaLog {
  id: string;
  pericia_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  created_at: string;
}

export const TIPO_PERICIA_LABELS: Record<string, string> = {
  inss: 'Perícia de INSS',
  auxilio_doenca: 'Perícia de Auxílio-Doença',
  auxilio_acidente: 'Perícia de Auxílio-Acidente',
  dpvat: 'Perícia de DPVAT',
  seguro_vida: 'Perícia de Seguro de Vida',
  judicial: 'Perícia Judicial',
  acidente_trabalho: 'Perícia de Acidente de Trabalho',
  danos: 'Perícia de Danos',
  junta_medica: 'Perícia de Junta Médica',
  outros: 'Outros tipos de perícia'
};

export const STATUS_PERICIA_LABELS: Record<string, string> = {
  agendada: 'Perícia Agendada',
  realizada_aguardando_pagamento: 'Realizada - Aguardando Indenização',
  cliente_faltou: 'Cliente Faltou'
};

export const STATUS_PERICIA_COLORS: Record<string, string> = {
  agendada: 'bg-blue-500',
  realizada_aguardando_pagamento: 'bg-green-500',
  cliente_faltou: 'bg-red-500'
};

export function usePericias() {
  const queryClient = useQueryClient();
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('pericias-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pericias' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pericias'] });
        queryClient.invalidateQueries({ queryKey: ['pericias-stats'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['pericias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pericias')
        .select(`
          *,
          cliente:clients(id, name, code)
        `)
        .order('data_pericia', { ascending: true });
      if (error) throw error;
      return data as Pericia[];
    }
  });
}

export function usePericia(id: string | undefined) {
  return useQuery({
    queryKey: ['pericia', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: pericia, error } = await supabase
        .from('pericias')
        .select(`
          *,
          cliente:clients(id, name, code)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;

      // Se for junta médica, buscar dados da junta
      if (pericia.status === 'junta_medica') {
        const { data: junta } = await supabase
          .from('juntas_medicas')
          .select('*')
          .eq('pericia_id', id)
          .single();
        
        if (junta) {
          const { data: medicos } = await supabase
            .from('junta_medicos')
            .select('*')
            .eq('junta_id', junta.id);
          
          (pericia as Pericia).junta_medica = { ...junta, medicos: medicos || [] };
        }
      }

      return pericia as Pericia;
    },
    enabled: !!id
  });
}

export function usePericiaLogs(periciaId: string | undefined) {
  return useQuery({
    queryKey: ['pericia-logs', periciaId],
    queryFn: async () => {
      if (!periciaId) return [];
      const { data, error } = await supabase
        .from('pericia_logs')
        .select('*')
        .eq('pericia_id', periciaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PericiaLog[];
    },
    enabled: !!periciaId
  });
}

export function usePericiaStats() {
  return useQuery({
    queryKey: ['pericias-stats'],
    queryFn: async () => {
      const { data: pericias, error } = await supabase
        .from('pericias')
        .select('id, status, tipo_pericia, data_pericia, cliente:clients(id, name)');
      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const stats = {
        total: pericias?.length || 0,
        agendadas: 0,
        aguardandoPagamento: 0,
        clientesFaltosos: 0,
        juntasMedicas: 0,
        proximos3Dias: [] as Pericia[],
        porTipo: {} as Record<string, number>
      };

      pericias?.forEach((p: any) => {
        // Contagem por status
        if (p.status === 'agendada') stats.agendadas++;
        if (p.status === 'realizada_aguardando_pagamento') stats.aguardandoPagamento++;
        if (p.status === 'cliente_faltou') stats.clientesFaltosos++;
        if (p.status === 'junta_medica') stats.juntasMedicas++;

        // Próximos 3 dias
        const dataPericia = new Date(p.data_pericia);
        const diffDays = Math.ceil((dataPericia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3 && p.status === 'agendada') {
          stats.proximos3Dias.push(p as Pericia);
        }

        // Por tipo
        if (!stats.porTipo[p.tipo_pericia]) stats.porTipo[p.tipo_pericia] = 0;
        stats.porTipo[p.tipo_pericia]++;
      });

      return stats;
    }
  });
}

export function useCreatePericia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (pericia: Omit<Pericia, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'junta_medica'> & {
      junta_medica?: Omit<JuntaMedica, 'id' | 'pericia_id' | 'created_at' | 'medicos'> & {
        medicos: Omit<JuntaMedico, 'id' | 'junta_id' | 'created_at'>[];
      };
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { junta_medica, ...periciaData } = pericia;
      
      const { data, error } = await supabase
        .from('pericias')
        .insert({ ...periciaData, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;

      // Se for tipo junta médica, criar os registros
      if (pericia.tipo_pericia === 'junta_medica' && junta_medica) {
        const { data: junta, error: juntaError } = await supabase
          .from('juntas_medicas')
          .insert({
            pericia_id: data.id,
            local_junta: junta_medica.local_junta,
            endereco_junta: junta_medica.endereco_junta,
            data_junta: junta_medica.data_junta,
            hora_junta: junta_medica.hora_junta,
            observacoes: junta_medica.observacoes
          })
          .select()
          .single();
        if (juntaError) throw juntaError;

        // Inserir os 3 médicos
        if (junta_medica.medicos?.length > 0) {
          const medicosData = junta_medica.medicos.map(m => ({
            junta_id: junta.id,
            nome_medico: m.nome_medico,
            crm: m.crm,
            especialidade: m.especialidade,
            endereco_profissional: m.endereco_profissional,
            telefone: m.telefone
          }));

          const { error: medicosError } = await supabase
            .from('junta_medicos')
            .insert(medicosData);
          if (medicosError) throw medicosError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pericias'] });
      queryClient.invalidateQueries({ queryKey: ['pericias-stats'] });
      toast({ title: 'Perícia cadastrada!', description: 'A perícia foi registrada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cadastrar perícia', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdatePericia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...pericia }: Partial<Pericia> & { id: string } & {
      junta_medica?: Omit<JuntaMedica, 'id' | 'pericia_id' | 'created_at' | 'medicos'> & {
        medicos: Omit<JuntaMedico, 'id' | 'junta_id' | 'created_at'>[];
      };
    }) => {
      const { junta_medica, cliente, ...updateData } = pericia as any;
      
      const { data, error } = await supabase
        .from('pericias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Se mudou para tipo junta médica, criar ou atualizar
      if (pericia.tipo_pericia === 'junta_medica' && junta_medica) {
        // Verificar se já existe junta
        const { data: existingJunta } = await supabase
          .from('juntas_medicas')
          .select('id')
          .eq('pericia_id', id)
          .single();

        if (existingJunta) {
          // Atualizar junta existente
          await supabase
            .from('juntas_medicas')
            .update({
              local_junta: junta_medica.local_junta,
              endereco_junta: junta_medica.endereco_junta,
              data_junta: junta_medica.data_junta,
              hora_junta: junta_medica.hora_junta,
              observacoes: junta_medica.observacoes
            })
            .eq('id', existingJunta.id);

          // Deletar médicos antigos e inserir novos
          await supabase.from('junta_medicos').delete().eq('junta_id', existingJunta.id);
          
          if (junta_medica.medicos?.length > 0) {
            const medicosData = junta_medica.medicos.map(m => ({
              junta_id: existingJunta.id,
              nome_medico: m.nome_medico,
              crm: m.crm,
              especialidade: m.especialidade,
              endereco_profissional: m.endereco_profissional,
              telefone: m.telefone
            }));
            await supabase.from('junta_medicos').insert(medicosData);
          }
        } else {
          // Criar nova junta
          const { data: junta, error: juntaError } = await supabase
            .from('juntas_medicas')
            .insert({
              pericia_id: id,
              local_junta: junta_medica.local_junta,
              endereco_junta: junta_medica.endereco_junta,
              data_junta: junta_medica.data_junta,
              hora_junta: junta_medica.hora_junta,
              observacoes: junta_medica.observacoes
            })
            .select()
            .single();
          if (juntaError) throw juntaError;

          if (junta_medica.medicos?.length > 0) {
            const medicosData = junta_medica.medicos.map(m => ({
              junta_id: junta.id,
              nome_medico: m.nome_medico,
              crm: m.crm,
              especialidade: m.especialidade,
              endereco_profissional: m.endereco_profissional,
              telefone: m.telefone
            }));
            await supabase.from('junta_medicos').insert(medicosData);
          }
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pericias'] });
      queryClient.invalidateQueries({ queryKey: ['pericia', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pericias-stats'] });
      toast({ title: 'Perícia atualizada!', description: 'As informações foram salvas com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar perícia', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdatePericiaStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: string; status: Pericia['status']; observacoes?: string }) => {
      const updateData: any = { status };
      if (observacoes) updateData.observacoes = observacoes;

      const { data, error } = await supabase
        .from('pericias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Se mudou para "realizada_aguardando_pagamento", criar lançamento financeiro
      if (status === 'realizada_aguardando_pagamento') {
        const { data: pericia } = await supabase
          .from('pericias')
          .select('cliente_id, tipo_pericia')
          .eq('id', id)
          .single();

        if (pericia) {
          const tipoReceitaMap: Record<string, string> = {
            inss: 'previdenciario',
            auxilio_doenca: 'previdenciario',
            auxilio_acidente: 'auxilio_acidente',
            dpvat: 'dpvat',
            seguro_vida: 'seguro_vida',
            judicial: 'judicial',
            acidente_trabalho: 'trabalhista',
            danos: 'danos',
            outros: 'outros'
          };

          await supabase.from('lancamentos_financeiros').insert({
            cliente_id: pericia.cliente_id,
            pericia_id: id,
            tipo_receita: tipoReceitaMap[pericia.tipo_pericia] || 'outros',
            valor_bruto: 0,
            valor_pago: 0,
            status: 'em_aberto'
          });
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pericias'] });
      queryClient.invalidateQueries({ queryKey: ['pericia', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pericias-stats'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      toast({ title: 'Status atualizado!', description: 'O status da perícia foi alterado.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  });
}
