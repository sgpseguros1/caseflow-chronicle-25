import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Bell, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Gavel,
  FileText,
  CheckCircle,
  ExternalLink,
  Eye,
  Brain
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSyncDataJud, useCheckProcessAlerts } from '@/hooks/useSyncDataJud';
import { ProcessoAlertasRealtime } from '@/components/processos/ProcessoAlertasRealtime';
import { SincronizacaoAutomatica } from '@/components/processos/SincronizacaoAutomatica';
import { useNavigate } from 'react-router-dom';

export default function MonitoramentoRealtimePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar movimentações recentes
  const { data: movimentacoesRecentes, refetch: refetchMovimentacoes } = useQuery({
    queryKey: ['movimentacoes-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .select(`
          *,
          processos_sincronizados (
            id,
            numero_processo,
            tribunal,
            classe_processual
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data?.map(m => ({
        ...m,
        processos_sincronizados: Array.isArray(m.processos_sincronizados) 
          ? m.processos_sincronizados[0] 
          : m.processos_sincronizados
      })) || [];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Buscar processos com prazo
  const { data: processosComPrazo } = useQuery({
    queryKey: ['processos-com-prazo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos_judiciais')
        .select('id, numero_processo, tribunal, prazo_aberto, tipo_prazo, prazo_dias_restantes, prazo_data_final')
        .eq('prazo_aberto', true)
        .order('prazo_dias_restantes', { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Buscar processos críticos
  const { data: processosCriticos } = useQuery({
    queryKey: ['processos-criticos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos_judiciais')
        .select('id, numero_processo, tribunal, dias_parado, ultima_movimentacao, data_ultima_movimentacao')
        .eq('processo_critico', true)
        .order('dias_parado', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Subscription para movimentações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('movimentacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'movimentacoes_processo',
        },
        () => {
          refetchMovimentacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchMovimentacoes]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Monitoramento em Tempo Real
            </h1>
            <p className="text-muted-foreground">
              Acompanhe processos, decisões e prazos automaticamente
            </p>
          </div>
          <Badge variant="outline" className="text-sm py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Conectado
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="prazos">Prazos</TabsTrigger>
            <TabsTrigger value="criticos">Críticos</TabsTrigger>
          </TabsList>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProcessoAlertasRealtime showGlobal />
              <SincronizacaoAutomatica intervaloMinutos={360} />
            </div>

            {/* Últimas Movimentações Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Últimas Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {movimentacoesRecentes && movimentacoesRecentes.length > 0 ? (
                    <div className="space-y-2">
                      {movimentacoesRecentes.slice(0, 10).map((mov: any) => (
                        <div 
                          key={mov.id}
                          className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-all"
                          onClick={() => {
                            const processoId = mov.processos_sincronizados?.id;
                            if (processoId) {
                              // Buscar processo judicial vinculado
                              navigate(`/processos-judiciais`);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {mov.processos_sincronizados?.numero_processo || 'N/A'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(mov.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{mov.descricao}</p>
                          {mov.complemento && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {mov.complemento}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma movimentação recente</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Movimentações Completa */}
          <TabsContent value="movimentacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Todas as Movimentações Recentes
                  <Badge variant="secondary" className="ml-2">
                    {movimentacoesRecentes?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {movimentacoesRecentes && movimentacoesRecentes.length > 0 ? (
                    <div className="space-y-3">
                      {movimentacoesRecentes.map((mov: any) => (
                        <Card key={mov.id} className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {mov.processos_sincronizados?.numero_processo || 'N/A'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {mov.processos_sincronizados?.tribunal || 'N/A'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(mov.data_movimento), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mb-2">{mov.descricao}</p>
                                {mov.complemento && (
                                  <div className="p-3 bg-muted/50 rounded text-sm">
                                    <p className="text-xs text-muted-foreground mb-1">Teor:</p>
                                    <p className="whitespace-pre-wrap">{mov.complemento}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {!mov.lido && (
                                  <Badge variant="destructive" className="text-xs">Novo</Badge>
                                )}
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma movimentação registrada</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Prazos */}
          <TabsContent value="prazos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Processos com Prazo Aberto
                  <Badge className="bg-orange-500 ml-2">
                    {processosComPrazo?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {processosComPrazo && processosComPrazo.length > 0 ? (
                    <div className="space-y-3">
                      {processosComPrazo.map((processo: any) => (
                        <Card 
                          key={processo.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            processo.prazo_dias_restantes <= 2 
                              ? 'border-red-500 bg-red-500/10' 
                              : processo.prazo_dias_restantes <= 5
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-yellow-500 bg-yellow-500/10'
                          }`}
                          onClick={() => navigate(`/processos-judiciais/${processo.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{processo.numero_processo}</p>
                                <p className="text-sm text-muted-foreground">{processo.tribunal}</p>
                                <Badge variant="outline" className="mt-2">
                                  {processo.tipo_prazo || 'Prazo'}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className={`text-3xl font-bold ${
                                  processo.prazo_dias_restantes <= 2 
                                    ? 'text-red-500' 
                                    : processo.prazo_dias_restantes <= 5
                                    ? 'text-orange-500'
                                    : 'text-yellow-500'
                                }`}>
                                  {processo.prazo_dias_restantes}
                                </p>
                                <p className="text-xs text-muted-foreground">dias restantes</p>
                                {processo.prazo_data_final && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Vence: {format(parseISO(processo.prazo_data_final), "dd/MM/yyyy")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p>Nenhum prazo aberto no momento</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Processos Críticos */}
          <TabsContent value="criticos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Processos Críticos (+45 dias parados)
                  <Badge variant="destructive" className="ml-2">
                    {processosCriticos?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {processosCriticos && processosCriticos.length > 0 ? (
                    <div className="space-y-3">
                      {processosCriticos.map((processo: any) => (
                        <Card 
                          key={processo.id} 
                          className="border-red-500 bg-red-500/10 cursor-pointer transition-all hover:shadow-md"
                          onClick={() => navigate(`/processos-judiciais/${processo.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{processo.numero_processo}</p>
                                <p className="text-sm text-muted-foreground">{processo.tribunal}</p>
                                {processo.ultima_movimentacao && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    Último: {processo.ultima_movimentacao}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-red-500">
                                  {processo.dias_parado}
                                </p>
                                <p className="text-xs text-red-400">dias parado</p>
                                {processo.data_ultima_movimentacao && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Desde: {format(parseISO(processo.data_ultima_movimentacao), "dd/MM/yyyy")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p>Nenhum processo crítico</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
