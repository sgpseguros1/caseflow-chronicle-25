import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Scale, FileText, Clock, AlertTriangle, CheckCircle, 
  Users, DollarSign, Calendar, Brain, Loader2, RefreshCw,
  Gavel, Building, MapPin, User, Briefcase, AlertCircle, 
  History, FileStack, Upload, ExternalLink, Eye, Bell
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalisarProcessoIA, useProcessoIAHistorico, useAndamentosIAAnalise } from '@/hooks/useProcessoIA';
import { AndamentoTeorCompleto } from '@/components/processos/AndamentoTeorCompleto';
import { ProcessoAlertasRealtime } from '@/components/processos/ProcessoAlertasRealtime';
import { SincronizacaoAutomatica } from '@/components/processos/SincronizacaoAutomatica';

const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em Andamento',
  concluso_decisao: 'Concluso para Decisão',
  aguardando_audiencia: 'Aguardando Audiência',
  aguardando_pericia: 'Aguardando Perícia',
  sentenciado: 'Sentenciado',
  em_recurso: 'Em Recurso',
  arquivado: 'Arquivado',
  pago_cumprido: 'Pago/Cumprido',
};

const STATUS_COLORS: Record<string, string> = {
  em_andamento: 'bg-blue-500',
  concluso_decisao: 'bg-yellow-500',
  aguardando_audiencia: 'bg-purple-500',
  aguardando_pericia: 'bg-orange-500',
  sentenciado: 'bg-green-600',
  em_recurso: 'bg-pink-500',
  arquivado: 'bg-gray-500',
  pago_cumprido: 'bg-emerald-500',
};

const RISCO_COLORS: Record<string, string> = {
  baixo: 'bg-green-500',
  medio: 'bg-yellow-500',
  alto: 'bg-red-500',
  nao_avaliado: 'bg-gray-400',
};

export default function ProcessoViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('visao-geral');
  
  const analisarIA = useAnalisarProcessoIA();
  const { data: iaHistorico } = useProcessoIAHistorico(id);
  const { data: andamentosIA } = useAndamentosIAAnalise(id);

  // Buscar processo completo
  const { data: processo, isLoading } = useQuery({
    queryKey: ['processo-judicial', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('processos_judiciais')
        .select(`
          *,
          funcionarios:responsavel_id (id, nome),
          advogados:advogado_auxiliar_id (id, nome, oab),
          clients:cliente_id (id, name, cpf)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar andamentos
  const { data: andamentos } = useQuery({
    queryKey: ['andamentos-processo', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('andamentos_processo')
        .select('*')
        .eq('processo_id', id)
        .order('data_andamento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar alertas
  const { data: alertas } = useQuery({
    queryKey: ['alertas-processo', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('alertas_prazo')
        .select('*')
        .eq('processo_id', id)
        .order('data_prazo', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar histórico de alterações
  const { data: historico } = useQuery({
    queryKey: ['historico-processo', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('historico_processo')
        .select('*')
        .eq('processo_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar documentos
  const { data: documentos } = useQuery({
    queryKey: ['documentos-processo', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('documentos_processo')
        .select('*')
        .eq('processo_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!processo) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Processo não encontrado</p>
          <Button onClick={() => navigate('/processos-judiciais')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/processos-judiciais')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              {processo.numero_processo}
            </h1>
            <p className="text-muted-foreground">
              {processo.tribunal} • {processo.vara || 'Vara não informada'}
            </p>
          </div>
          <Button
            onClick={() => analisarIA.mutate({ processoId: id! })}
            disabled={analisarIA.isPending}
            className="gap-2"
          >
            {analisarIA.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Analisar com IA
              </>
            )}
          </Button>
        </div>

        {/* BLOCO 1 - Identidade do Processo */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={`${STATUS_COLORS[processo.status]} mt-1`}>
                  {STATUS_LABELS[processo.status] || processo.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tribunal</p>
                <p className="font-medium">{processo.tribunal || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vara / Comarca</p>
                <p className="font-medium">{processo.vara || '-'} | {processo.comarca || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Juiz</p>
                <p className="font-medium">{processo.juiz_responsavel || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Classe</p>
                <p className="font-medium text-sm">{processo.classe_processual || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo Aberto?</p>
                <Badge variant={processo.prazo_aberto ? "destructive" : "secondary"}>
                  {processo.prazo_aberto ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Alerta */}
        {(processo.processo_parado || processo.processo_critico) && (
          <Card className={processo.processo_critico ? "border-red-500 bg-red-500/10" : "border-yellow-500 bg-yellow-500/10"}>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className={`h-6 w-6 ${processo.processo_critico ? 'text-red-500' : 'text-yellow-500'}`} />
              <div>
                <p className="font-semibold">
                  {processo.processo_critico ? '🔴 PROCESSO CRÍTICO' : '⚠️ PROCESSO PARADO'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sem movimentação há {processo.dias_parado || 0} dias
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="ia">🧠 IA</TabsTrigger>
            <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
            <TabsTrigger value="alertas" className="relative">
              <Bell className="h-4 w-4 mr-1" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* BLOCO 2 - Partes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Partes do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Autor</p>
                      <p className="font-medium">{processo.autor_nome || '-'}</p>
                      <p className="text-xs text-muted-foreground">{processo.autor_documento || ''}</p>
                    </div>
                    {(processo as any).clients && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/clientes/${(processo as any).clients.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Réu</p>
                    <p className="font-medium">{processo.reu_nome || '-'}</p>
                    <p className="text-xs text-muted-foreground">{processo.reu_documento || ''}</p>
                  </div>
                  <Separator />
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Advogado Responsável</p>
                    <p className="font-medium">{(processo as any).funcionarios?.nome || '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Advogado Auxiliar</p>
                    <p className="font-medium">{(processo as any).advogados?.nome || '-'}</p>
                    <p className="text-xs text-muted-foreground">{(processo as any).advogados?.oab || ''}</p>
                  </div>
                </CardContent>
              </Card>

              {/* BLOCO 5 - Prazos e Audiências */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Prazos e Audiências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {processo.prazo_aberto && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-red-400">PRAZO ABERTO</p>
                          <p className="font-bold text-red-500">{processo.tipo_prazo || 'Prazo'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-500">{processo.prazo_dias_restantes || 0}</p>
                          <p className="text-xs text-red-400">dias restantes</p>
                        </div>
                      </div>
                      {processo.prazo_data_final && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Vence em: {format(parseISO(processo.prazo_data_final), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                  {processo.data_audiencia && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-xs text-purple-400">AUDIÊNCIA MARCADA</p>
                      <p className="font-bold text-purple-500">
                        {format(parseISO(processo.data_audiencia), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {processo.data_pericia && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-xs text-orange-400">PERÍCIA AGENDADA</p>
                      <p className="font-bold text-orange-500">
                        {format(parseISO(processo.data_pericia), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {!processo.prazo_aberto && !processo.data_audiencia && !processo.data_pericia && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum prazo ou audiência pendente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Último Andamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Último Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processo.ultima_movimentacao ? (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{processo.ultima_movimentacao}</p>
                    {processo.data_ultima_movimentacao && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(parseISO(processo.data_ultima_movimentacao), { addSuffix: true, locale: ptBR })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab IA */}
          <TabsContent value="ia" className="space-y-4">
            {/* BLOCO 4 - Leitura da IA */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  🧠 Análise Inteligente do Processo
                </CardTitle>
                {processo.ia_analisado_em && (
                  <p className="text-xs text-muted-foreground">
                    Última análise: {formatDistanceToNow(parseISO(processo.ia_analisado_em), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {processo.ia_resumo_processo ? (
                  <>
                    <div className="p-4 bg-background rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">📌 RESUMO DO PROCESSO</p>
                      <p className="text-sm">{processo.ia_resumo_processo}</p>
                    </div>

                    <div className="p-4 bg-background rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">🧠 O QUE A IA ENTENDEU</p>
                      <p className="text-sm">{processo.ia_entendimento}</p>
                    </div>

                    <div className="p-4 bg-background rounded-lg border border-primary/30">
                      <p className="text-xs text-primary mb-1">⚡ O QUE PRECISA SER FEITO AGORA</p>
                      <p className="text-sm font-medium">{processo.ia_acao_necessaria}</p>
                    </div>

                    <div className="p-4 bg-background rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">➡️ PRÓXIMA AÇÃO SUGERIDA</p>
                      <p className="text-sm">{processo.ia_proxima_acao_sugerida}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-background rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Risco Processual</p>
                        <Badge className={`mt-1 ${RISCO_COLORS[processo.ia_risco_processual || 'nao_avaliado']}`}>
                          {(processo.ia_risco_processual || 'não avaliado').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="p-3 bg-background rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Impacto Financeiro</p>
                        <Badge variant="outline" className="mt-1">
                          {(processo.ia_impacto_financeiro || 'não avaliado').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="p-3 bg-background rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Dependências</p>
                        <div className="flex gap-1 justify-center mt-1">
                          {processo.ia_depende_bau && <Badge variant="secondary" className="text-xs">BAU</Badge>}
                          {processo.ia_depende_cliente && <Badge variant="secondary" className="text-xs">Cliente</Badge>}
                          {processo.ia_depende_pericia && <Badge variant="secondary" className="text-xs">Perícia</Badge>}
                          {!processo.ia_depende_bau && !processo.ia_depende_cliente && !processo.ia_depende_pericia && (
                            <Badge variant="outline" className="text-xs">Nenhuma</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50 text-primary" />
                    <p className="text-muted-foreground mb-4">Nenhuma análise de IA realizada ainda</p>
                    <Button
                      onClick={() => analisarIA.mutate({ processoId: id! })}
                      disabled={analisarIA.isPending}
                    >
                      {analisarIA.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Gerar Análise
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Análises IA */}
            {iaHistorico && iaHistorico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Análises IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {iaHistorico.map((h: any) => (
                        <div key={h.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{h.tipo_analise}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Andamentos - COM TEOR COMPLETO */}
          <TabsContent value="andamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Linha do Tempo com Teor Completo
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {andamentos?.length || 0} andamentos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {andamentos && andamentos.length > 0 ? (
                    <div className="space-y-2">
                      {andamentos.map((andamento: any, index: number) => {
                        // Buscar análise IA do andamento
                        const iaAnalise = andamentosIA?.find(
                          (ia: any) => ia.andamento_id === andamento.id
                        );
                        
                        return (
                          <AndamentoTeorCompleto
                            key={andamento.id}
                            andamento={andamento}
                            iaAnalise={iaAnalise}
                            isLast={index === andamentos.length - 1}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum andamento registrado</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Alertas em Tempo Real */}
          <TabsContent value="alertas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProcessoAlertasRealtime processoId={id} />
              <SincronizacaoAutomatica intervaloMinutos={360} />
            </div>
          </TabsContent>

          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Valor da Causa</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(processo.valor_causa)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Indenização Pleiteada</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(processo.indenizacao_pleiteada)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Indenização Paga</p>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(processo.indenizacao_paga)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Diferença</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {formatCurrency((processo.indenizacao_pleiteada || 0) - (processo.indenizacao_paga || 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Honorários Estimados</p>
                  <p className="text-2xl font-bold">{formatCurrency(processo.honorarios_estimados)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Custas Totais</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(processo.custas_totais)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileStack className="h-5 w-5 text-primary" />
                  Documentos do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentos && documentos.length > 0 ? (
                  <div className="space-y-3">
                    {documentos.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <p className="text-xs text-muted-foreground">{doc.tipo_documento}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileStack className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento anexado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {historico && historico.length > 0 ? (
                    <div className="space-y-3">
                      {historico.map((h: any) => (
                        <div key={h.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{h.acao}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {h.campo_alterado && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Campo:</span> {h.campo_alterado}
                            </p>
                          )}
                          {h.valor_anterior && (
                            <p className="text-xs text-muted-foreground">
                              De: <span className="line-through">{h.valor_anterior}</span> → Para: {h.valor_novo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma alteração registrada</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alertas && alertas.length > 0 ? (
                  <div className="space-y-3">
                    {alertas.map((alerta: any) => (
                      <div 
                        key={alerta.id} 
                        className={`p-3 rounded-lg border ${alerta.status === 'pendente' ? 'border-orange-500 bg-orange-500/10' : 'border-muted bg-muted/30'}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{alerta.titulo}</p>
                          <Badge variant={alerta.status === 'pendente' ? 'destructive' : 'secondary'}>
                            {alerta.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
                        {alerta.data_prazo && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Prazo: {format(parseISO(alerta.data_prazo), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum alerta registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
