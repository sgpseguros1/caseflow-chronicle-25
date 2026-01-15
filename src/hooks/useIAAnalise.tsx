import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IAAnalise {
  id: string;
  cliente_id: string;
  usuario_id: string | null;
  texto_observacao: string | null;
  resultado_ia: string | null;
  modelo_utilizado: string | null;
  created_at: string;
}

export interface ClienteContexto {
  id: string;
  name: string;
  cpf: string | null;
  birth_date: string | null;
  phone1: string | null;
  email: string | null;
  accident_date: string | null;
  accident_type: string | null;
  accident_location: string | null;
  injuries: string | null;
  cid_code: string | null;
  body_part_affected: string | null;
  injury_severity: string | null;
  has_sequelae: boolean | null;
  disability_percentage: number | null;
  admission_hospital: string | null;
  was_hospitalized: boolean | null;
  hospitalization_days: number | null;
  had_surgery: boolean | null;
  has_police_report: boolean | null;
  is_clt: boolean | null;
  company_name: string | null;
  notes: string | null;
}

export function useIAAnalises(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['ia-analises', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from('ia_analises_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IAAnalise[];
    },
    enabled: !!clienteId,
  });
}

export function useCreateIAAnalise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      textoObservacao,
      cliente 
    }: { 
      clienteId: string; 
      textoObservacao: string;
      cliente: ClienteContexto;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Chamar edge function para gerar análise
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-cliente-analise', {
        body: { cliente, observacao: textoObservacao }
      });

      if (aiError) throw aiError;

      const resultadoIA = aiResponse?.resultado || 'Análise não disponível no momento.';

      const { data, error } = await supabase
        .from('ia_analises_cliente')
        .insert({
          cliente_id: clienteId,
          usuario_id: userData.user?.id,
          texto_observacao: textoObservacao,
          resultado_ia: resultadoIA,
          modelo_utilizado: 'google/gemini-3-flash-preview'
        })
        .select()
        .single();

      if (error) throw error;
      return data as IAAnalise;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ia-analises', variables.clienteId] });
      toast.success('Análise IA gerada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar análise: ${error.message}`);
    }
  });
}
