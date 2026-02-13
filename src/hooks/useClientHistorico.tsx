import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientHistoricoItem {
  id: string;
  client_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  acao: string;
  categoria: string;
  descricao: string;
  tabela_origem: string | null;
  registro_id: string | null;
  dados_anteriores: Record<string, any> | null;
  dados_novos: Record<string, any> | null;
  created_at: string;
}

export function useClientHistorico(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-historico', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_historico')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ClientHistoricoItem[];
    },
    enabled: !!clientId,
  });
}
