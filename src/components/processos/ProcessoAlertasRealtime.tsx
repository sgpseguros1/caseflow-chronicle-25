import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Gavel, 
  FileText,
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useSyncDataJud, useCheckProcessAlerts } from '@/hooks/useSyncDataJud';
import { useQueryClient } from '@tanstack/react-query';

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  prioridade: string;
  status: string;
  created_at: string;
}

interface ProcessoAlertasRealtimeProps {
  processoId?: string;
  showGlobal?: boolean;
}

const PRIORIDADE_COLORS: Record<string, string> = {
  critica: 'bg-red-500',
  alta: 'bg-orange-500',
  normal: 'bg-blue-500',
  baixa: 'bg-gray-500',
};

const TIPO_ICONS: Record<string, any> = {
  movimentacao_nova: FileText,
  prazo_fatal: Clock,
  processo_parado: AlertTriangle,
  audiencia: Gavel,
  default: Bell,
};

export function ProcessoAlertasRealtime({ processoId, showGlobal = false }: ProcessoAlertasRealtimeProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [novosAlertas, setNovosAlertas] = useState<number>(0);
  const queryClient = useQueryClient();
  
  const syncDataJud = useSyncDataJud();
  const checkAlerts = useCheckProcessAlerts();

  // Buscar alertas iniciais
  useEffect(() => {
    const fetchAlertas = async () => {
      let query = supabase
        .from('alertas')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(20);

      if (processoId) {
        query = query.eq('processo_id', processoId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAlertas(data);
      }
    };

    fetchAlertas();
  }, [processoId]);

  // Subscription para alertas em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('alertas-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas',
        },
        (payload) => {
          const novoAlerta = payload.new as Alerta;
          // Adiciona ao início da lista
          setAlertas(prev => [novoAlerta, ...prev.slice(0, 19)]);
          setNovosAlertas(prev => prev + 1);
          
          // Toca notificação visual
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Novo Alerta Processual', {
              body: novoAlerta.titulo,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alertas',
        },
        (payload) => {
          const alertaAtualizado = payload.new as Alerta;
          setAlertas(prev => 
            prev.map(a => a.id === alertaAtualizado.id ? alertaAtualizado : a)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarcarLido = async (alertaId: string) => {
    await supabase
      .from('alertas')
      .update({ status: 'resolvido', lido_em: new Date().toISOString() })
      .eq('id', alertaId);
    
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
  };

  const handleSincronizar = async () => {
    await syncDataJud.mutateAsync({});
    await checkAlerts.mutateAsync({ dias_prazo: 5 });
    queryClient.invalidateQueries({ queryKey: ['alertas'] });
  };

  const isSyncing = syncDataJud.isPending || checkAlerts.isPending;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas em Tempo Real
            {novosAlertas > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                +{novosAlertas}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSincronizar}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {alertas.length > 0 ? (
            <div className="space-y-2">
              {alertas.map((alerta) => {
                const IconComponent = TIPO_ICONS[alerta.tipo] || TIPO_ICONS.default;
                
                return (
                  <div 
                    key={alerta.id}
                    className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                      alerta.prioridade === 'critica' 
                        ? 'border-red-500/50 bg-red-500/10' 
                        : alerta.prioridade === 'alta'
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${PRIORIDADE_COLORS[alerta.prioridade] || 'bg-gray-500'}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{alerta.titulo}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${
                              alerta.prioridade === 'critica' ? 'border-red-500 text-red-500' :
                              alerta.prioridade === 'alta' ? 'border-orange-500 text-orange-500' :
                              ''
                            }`}
                          >
                            {alerta.prioridade}
                          </Badge>
                        </div>
                        {alerta.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {alerta.descricao}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(parseISO(alerta.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleMarcarLido(alerta.id)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta pendente</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
