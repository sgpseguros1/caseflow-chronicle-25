import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientChecklistIA {
  id: string;
  client_id: string;
  // Identificação do caso
  tipo_ocorrencia: string | null;
  data_evento: string | null;
  cidade_uf_evento: string | null;
  bo_status: string | null;
  atendimento_medico: boolean | null;
  internacao: boolean | null;
  // Bloco Trânsito
  perfil_vitima: string | null;
  usava_equipamento_seguranca: string | null;
  veiculos_envolvidos: number | null;
  terceiro_identificado: string | null;
  placa_terceiro: string | null;
  terceiro_tem_seguro: string | null;
  veiculo_cliente: string | null;
  veiculo_financiado: string | null;
  veiculo_segurado: boolean | null;
  culpa_cliente: string | null;
  provas_disponiveis: string[] | null;
  // Danos
  lesao_corporal: boolean | null;
  sequelas: string | null;
  sequela_permanente: string | null;
  obito: boolean | null;
  danos_materiais: string[] | null;
  dano_material_comprovavel: boolean | null;
  afastamento: boolean | null;
  perda_renda: boolean | null;
  // Bloco Trabalho
  trabalhava: boolean | null;
  regime_trabalho: string | null;
  e_clt: boolean | null;
  empresa_cnpj: string | null;
  funcao_cargo: string | null;
  havia_epi: boolean | null;
  havia_treinamento: boolean | null;
  houve_cat: boolean | null;
  tipo_acidente_trabalho: string | null;
  e_motorista_app: boolean | null;
  // Bloco INSS
  contribuia_inss: boolean | null;
  afastamento_15_dias: boolean | null;
  recebeu_beneficio: boolean | null;
  beneficio_recebido: string | null;
  incapacidade_atual: string | null;
  // Bloco Caça-Seguro
  tem_conta_banco: boolean | null;
  tem_cartao_credito: boolean | null;
  tem_emprestimo: boolean | null;
  fez_financiamento: boolean | null;
  usa_fintech: boolean | null;
  // Responsabilidade civil
  tipos_gastos: string[] | null;
  impacto_moral: string[] | null;
  // Controle
  status: string | null;
  concluido_em: string | null;
  concluido_por: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientChecklist(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-checklist', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('client_checklist_ia')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data as ClientChecklistIA | null;
    },
    enabled: !!clientId,
  });
}

export function useCreateOrUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: Partial<ClientChecklistIA> }) => {
      // Check if checklist exists
      const { data: existing } = await supabase
        .from('client_checklist_ia')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from('client_checklist_ia')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('client_id', clientId)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        // Insert
        const { data: created, error } = await supabase
          .from('client_checklist_ia')
          .insert({ client_id: clientId, ...data })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-workflow', variables.clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar checklist: ${error.message}`);
    },
  });
}

export function useChecklistProgress(checklist: ClientChecklistIA | null): {
  total: number;
  filled: number;
  percentage: number;
  isComplete: boolean;
} {
  if (!checklist) return { total: 0, filled: 0, percentage: 0, isComplete: false };

  // Define mandatory fields
  const mandatoryFields = [
    'tipo_ocorrencia',
    'data_evento',
    'cidade_uf_evento',
    'bo_status',
    'atendimento_medico',
  ];

  // Conditional fields based on tipo_ocorrencia
  if (checklist.tipo_ocorrencia === 'transito') {
    mandatoryFields.push(
      'perfil_vitima',
      'usava_equipamento_seguranca',
      'veiculos_envolvidos',
      'terceiro_identificado',
      'veiculo_cliente',
      'culpa_cliente'
    );
  }

  if (checklist.tipo_ocorrencia === 'trabalho') {
    mandatoryFields.push(
      'trabalhava',
      'regime_trabalho',
      'houve_cat',
      'tipo_acidente_trabalho'
    );
  }

  // INSS fields if applicable
  if (checklist.trabalhava || checklist.e_clt) {
    mandatoryFields.push(
      'contribuia_inss',
      'afastamento_15_dias'
    );
  }

  // Damage fields
  mandatoryFields.push('lesao_corporal', 'sequelas');

  // Caça-seguro fields
  mandatoryFields.push(
    'tem_conta_banco',
    'tem_cartao_credito',
    'tem_emprestimo',
    'fez_financiamento'
  );

  const total = mandatoryFields.length;
  let filled = 0;

  for (const field of mandatoryFields) {
    const value = (checklist as any)[field];
    if (value !== null && value !== undefined && value !== '') {
      filled++;
    }
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  const isComplete = percentage === 100;

  return { total, filled, percentage, isComplete };
}
