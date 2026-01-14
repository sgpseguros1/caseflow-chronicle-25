import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncResult {
  message: string;
  synced: number;
  oabs_processed: number;
  errors?: string[];
}

interface AlertCheckResult {
  message: string;
  alertas_criados: number;
  movimentacoes_nao_lidas: number;
  prazos_proximos: number;
  processos_parados: number;
  errors?: string[];
}

export function useSyncDataJud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { oab_id?: string; numero_oab?: string; uf?: string }) => {
      const { data, error } = await supabase.functions.invoke<SyncResult>('sync-datajud', {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['processos-sincronizados'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['oab-monitoradas'] });
      
      toast({
        title: 'Sincronização concluída',
        description: `${data?.synced || 0} processos sincronizados de ${data?.oabs_processed || 0} OABs`,
      });
    },
    onError: (error) => {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCheckProcessAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { dias_prazo?: number }) => {
      const { data, error } = await supabase.functions.invoke<AlertCheckResult>('check-process-alerts', {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      
      if (data?.alertas_criados && data.alertas_criados > 0) {
        toast({
          title: 'Novos alertas gerados',
          description: `${data.alertas_criados} alertas criados`,
        });
      } else {
        toast({
          title: 'Verificação concluída',
          description: 'Nenhum novo alerta para gerar',
        });
      }
    },
    onError: (error) => {
      console.error('Erro na verificação de alertas:', error);
      toast({
        title: 'Erro na verificação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
