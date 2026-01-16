import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyncDataJud, useCheckProcessAlerts } from '@/hooks/useSyncDataJud';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SincronizacaoAutomaticaProps {
  intervaloMinutos?: number;
  autoStart?: boolean;
}

export function SincronizacaoAutomatica({ 
  intervaloMinutos = 360, // 6 horas padrão
  autoStart = false 
}: SincronizacaoAutomaticaProps) {
  const [isAutoSync, setIsAutoSync] = useState(autoStart);
  const [proximaSync, setProximaSync] = useState<Date | null>(null);
  const [tempoRestante, setTempoRestante] = useState<string>('');
  
  const queryClient = useQueryClient();
  const syncDataJud = useSyncDataJud();
  const checkAlerts = useCheckProcessAlerts();

  // Buscar última sincronização
  const { data: ultimaSync } = useQuery({
    queryKey: ['ultima-sincronizacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_monitoradas')
        .select('ultima_sincronizacao')
        .order('ultima_sincronizacao', { ascending: false })
        .limit(1)
        .single();
      
      return data?.ultima_sincronizacao || null;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Buscar estatísticas de sincronização
  const { data: stats } = useQuery({
    queryKey: ['sync-stats'],
    queryFn: async () => {
      const { count: totalProcessos } = await supabase
        .from('processos_sincronizados')
        .select('*', { count: 'exact', head: true });

      const { count: movimentacoesHoje } = await supabase
        .from('movimentacoes_processo')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: alertasPendentes } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      return {
        totalProcessos: totalProcessos || 0,
        movimentacoesHoje: movimentacoesHoje || 0,
        alertasPendentes: alertasPendentes || 0,
      };
    },
    refetchInterval: 30000,
  });

  // Timer para contagem regressiva
  useEffect(() => {
    if (!isAutoSync || !proximaSync) return;

    const interval = setInterval(() => {
      const agora = new Date();
      const diff = proximaSync.getTime() - agora.getTime();
      
      if (diff <= 0) {
        executarSincronizacao();
      } else {
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        setTempoRestante(`${horas}h ${minutos}m ${segundos}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSync, proximaSync]);

  // Configurar próxima sincronização quando ativar auto-sync
  useEffect(() => {
    if (isAutoSync) {
      const proxima = new Date();
      proxima.setMinutes(proxima.getMinutes() + intervaloMinutos);
      setProximaSync(proxima);
    } else {
      setProximaSync(null);
      setTempoRestante('');
    }
  }, [isAutoSync, intervaloMinutos]);

  const executarSincronizacao = async () => {
    try {
      toast({
        title: 'Sincronização iniciada',
        description: 'Buscando novos andamentos nos tribunais...',
      });

      // Sincronizar processos
      const syncResult = await syncDataJud.mutateAsync({});
      
      // Verificar alertas
      const alertResult = await checkAlerts.mutateAsync({ dias_prazo: 5 });
      
      // Atualizar queries
      queryClient.invalidateQueries({ queryKey: ['processos-sincronizados'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ultima-sincronizacao'] });

      // Configurar próxima sincronização
      if (isAutoSync) {
        const proxima = new Date();
        proxima.setMinutes(proxima.getMinutes() + intervaloMinutos);
        setProximaSync(proxima);
      }

      toast({
        title: 'Sincronização concluída',
        description: `${syncResult?.synced || 0} processos atualizados, ${alertResult?.alertas_criados || 0} novos alertas`,
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível completar a sincronização',
        variant: 'destructive',
      });
    }
  };

  const isSyncing = syncDataJud.isPending || checkAlerts.isPending;
  const progressPercent = proximaSync 
    ? Math.max(0, 100 - ((proximaSync.getTime() - Date.now()) / (intervaloMinutos * 60 * 1000)) * 100)
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sincronização Automática
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isAutoSync ? 'default' : 'secondary'}>
              {isAutoSync ? 'Ativo' : 'Desativado'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAutoSync(!isAutoSync)}
            >
              {isAutoSync ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats?.totalProcessos || 0}</p>
            <p className="text-xs text-muted-foreground">Processos Monitorados</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-500">{stats?.movimentacoesHoje || 0}</p>
            <p className="text-xs text-muted-foreground">Movimentações Hoje</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">{stats?.alertasPendentes || 0}</p>
            <p className="text-xs text-muted-foreground">Alertas Pendentes</p>
          </div>
        </div>

        {/* Última sincronização */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Última sincronização:</span>
          </div>
          <span className="text-sm font-medium">
            {ultimaSync 
              ? formatDistanceToNow(parseISO(ultimaSync), { addSuffix: true, locale: ptBR })
              : 'Nunca'
            }
          </span>
        </div>

        {/* Próxima sincronização */}
        {isAutoSync && proximaSync && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Próxima sincronização:</span>
              <span className="text-sm font-medium text-primary">{tempoRestante}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button 
            onClick={executarSincronizacao}
            disabled={isSyncing}
            className="flex-1 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </div>

        {/* Status da sincronização */}
        {isSyncing && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm text-primary">
                Buscando novos andamentos nos tribunais...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
