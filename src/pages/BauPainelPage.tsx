import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone,
  ExternalLink,
  Calendar,
  User,
  TrendingUp,
  FileWarning,
  Activity,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useBauDashboardStats, 
  useBauContatos,
  TIPO_SOLICITACAO_LABELS, 
  STATUS_BAU_LABELS,
  FASE_COBRANCA_LABELS,
  FASE_COBRANCA_COLORS 
} from '@/hooks/useBaus';
import { useAuth } from '@/hooks/useAuth';
import { useFuncionarios } from '@/hooks/useFuncionarios';

// Timeline component for BAU
function BauTimeline({ bauId }: { bauId: string }) {
  const { data: contatos, isLoading } = useBauContatos(bauId);

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  if (!contatos?.length) {
    return <div className="p-4 text-center text-muted-foreground">Nenhum contato registrado</div>;
  }

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto">
      {contatos.map((contato, index) => (
        <div key={contato.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${
              contato.resultado === 'sucesso' ? 'bg-green-500' :
              contato.resultado === 'problema' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            {index < contatos.length - 1 && <div className="w-0.5 h-full bg-border" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">{contato.tipo_contato}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(contato.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-sm">{contato.descricao}</p>
            {contato.nova_previsao && (
              <p className="text-xs text-muted-foreground mt-1">
                Nova previsão: {format(parseISO(contato.nova_previsao), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BauPainelPage() {
  const { data: stats, isLoading } = useBauDashboardStats();
  const { data: funcionarios } = useFuncionarios();
  const { isAdminOrGestor } = useAuth();

  const [tab, setTab] = useState('lista');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroFase, setFiltroFase] = useState<string>('todos');
  const [selectedBauId, setSelectedBauId] = useState<string | null>(null);

  // Filtered BAUs list
  const bausFiltrados = useMemo(() => {
    if (!stats?.baus) return [];

    return stats.baus.filter(bau => {
      if (filtroStatus !== 'todos' && bau.status !== filtroStatus) return false;
      if (filtroResponsavel !== 'todos' && bau.responsavel_id !== filtroResponsavel) return false;
      if (filtroFase !== 'todos') {
        const faseCalculada = bau.dias_corridos >= 20 ? 'critico' :
                              bau.dias_corridos >= 15 ? 'escalonado' :
                              bau.dias_corridos >= 10 ? 'cobrar' :
                              bau.dias_corridos >= 5 ? 'pre_aviso' : 'normal';
        if (faseCalculada !== filtroFase) return false;
      }
      return true;
    }).sort((a, b) => (b.dias_corridos || 0) - (a.dias_corridos || 0));
  }, [stats?.baus, filtroStatus, filtroResponsavel, filtroFase]);

  const getFaseBadge = (dias: number, status: string) => {
    if (['recebido', 'validado'].includes(status)) {
      return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
    }
    
    if (dias >= 20) return <Badge className={FASE_COBRANCA_COLORS.critico}>{FASE_COBRANCA_LABELS.critico}</Badge>;
    if (dias >= 15) return <Badge className={FASE_COBRANCA_COLORS.escalonado}>{FASE_COBRANCA_LABELS.escalonado}</Badge>;
    if (dias >= 10) return <Badge className={FASE_COBRANCA_COLORS.cobrar}>{FASE_COBRANCA_LABELS.cobrar}</Badge>;
    if (dias >= 5) return <Badge className={FASE_COBRANCA_COLORS.pre_aviso}>{FASE_COBRANCA_LABELS.pre_aviso}</Badge>;
    return <Badge className={FASE_COBRANCA_COLORS.normal}>{FASE_COBRANCA_LABELS.normal}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Painel BAU — Hospitais
        </h1>
        <p className="text-muted-foreground">Dashboard de controle de prontuários médicos</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('todos')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total BAUs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('em_andamento')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                <Activity className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.emAndamento || 0}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 bg-orange-50 dark:bg-orange-950/20" onClick={() => setFiltroFase('cobrar')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats?.mais10Dias || 0}</p>
                <p className="text-xs text-muted-foreground">+10 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 bg-red-50 dark:bg-red-950/20" onClick={() => setFiltroFase('escalonado')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats?.criticos || 0}</p>
                <p className="text-xs text-muted-foreground">Críticos (+15d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats?.recebidosMes || 0}</p>
                <p className="text-xs text-muted-foreground">Recebidos (mês)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <FileWarning className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats?.incompletos || 0}</p>
                <p className="text-xs text-muted-foreground">Incompletos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/50">
                <Building2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{stats?.hospitaisCriticos || 0}</p>
                <p className="text-xs text-muted-foreground">Hospitais Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_BAU_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fase de Cobrança</label>
              <Select value={filtroFase} onValueChange={setFiltroFase}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {Object.entries(FASE_COBRANCA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lista" className="gap-2">
            <Building2 className="h-4 w-4" />
            Lista ({bausFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="acao" className="gap-2">
            <Phone className="h-4 w-4" />
            Ação Hoje ({stats?.acaoHoje?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analistas" className="gap-2">
            <Users className="h-4 w-4" />
            Analistas
          </TabsTrigger>
          <TabsTrigger value="hospitais" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Hospitais
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Lista Principal */}
        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista Operacional de BAUs</CardTitle>
            </CardHeader>
            <CardContent>
              {bausFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum BAU encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Solicitação</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Previsão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bausFiltrados.map(bau => (
                      <TableRow key={bau.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {bau.cliente?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{bau.hospital_nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TIPO_SOLICITACAO_LABELS[bau.tipo_solicitacao]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(bau.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            bau.dias_corridos >= 20 ? 'text-black dark:text-white' :
                            bau.dias_corridos >= 15 ? 'text-red-600' :
                            bau.dias_corridos >= 10 ? 'text-orange-500' :
                            bau.dias_corridos >= 5 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {bau.dias_corridos}d
                          </span>
                        </TableCell>
                        <TableCell>
                          {bau.previsao_entrega 
                            ? format(parseISO(bau.previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })
                            : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{STATUS_BAU_LABELS[bau.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          {getFaseBadge(bau.dias_corridos, bau.status)}
                        </TableCell>
                        <TableCell>
                          {bau.responsavel?.nome || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedBauId(bau.id)}>
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Linha do Tempo - {bau.hospital_nome}</DialogTitle>
                                </DialogHeader>
                                <BauTimeline bauId={bau.id} />
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="default" asChild>
                              <Link to={`/clientes/${bau.client_id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Ação Hoje */}
        <TabsContent value="acao" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                BAUs que Exigem Ação Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.acaoHoje?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>Nenhum BAU exigindo ação imediata</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.acaoHoje.map((bau, index) => (
                      <TableRow key={bau.id} className={index < 3 ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          <Badge variant={index < 3 ? 'destructive' : 'secondary'}>#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{bau.cliente?.name || 'N/A'}</TableCell>
                        <TableCell>{bau.hospital_nome}</TableCell>
                        <TableCell>
                          {bau.hospital_telefone || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">{bau.dias_corridos}d</span>
                        </TableCell>
                        <TableCell>
                          {bau.dias_corridos >= 10 && <Badge variant="outline">+10 dias</Badge>}
                          {bau.previsao_entrega && parseISO(bau.previsao_entrega) < new Date() && (
                            <Badge variant="destructive" className="ml-1">Vencido</Badge>
                          )}
                        </TableCell>
                        <TableCell>{bau.responsavel?.nome || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="default" asChild>
                            <Link to={`/clientes/${bau.client_id}`}>
                              Ir para Cliente
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Performance Analistas */}
        <TabsContent value="analistas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Performance por Analista
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.analistaRanking?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum analista com BAUs ativos</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analista</TableHead>
                      <TableHead>BAUs Ativos</TableHead>
                      <TableHead>Atrasados (+10d)</TableHead>
                      <TableHead>Críticos (+15d)</TableHead>
                      <TableHead>Tempo Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.analistaRanking.map(analista => (
                      <TableRow key={analista.id}>
                        <TableCell className="font-medium">{analista.nome}</TableCell>
                        <TableCell>{analista.ativos}</TableCell>
                        <TableCell>
                          {analista.atrasados > 0 ? (
                            <Badge variant="destructive">{analista.atrasados}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {analista.criticos > 0 ? (
                            <Badge className="bg-black text-white">{analista.criticos}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{Math.round(analista.tempoMedio)} dias</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Ranking Hospitais */}
        <TabsContent value="hospitais" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ranking de Hospitais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.hospitalRanking?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum hospital registrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Total BAUs</TableHead>
                      <TableHead>Atrasados</TableHead>
                      <TableHead>Críticos</TableHead>
                      <TableHead>Tempo Médio</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.hospitalRanking.map(hospital => (
                      <TableRow key={hospital.nome}>
                        <TableCell className="font-medium">{hospital.nome}</TableCell>
                        <TableCell>{hospital.total}</TableCell>
                        <TableCell>
                          {hospital.atrasados > 0 ? (
                            <Badge variant="destructive">{hospital.atrasados}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hospital.criticos > 0 ? (
                            <Badge className="bg-black text-white">{hospital.criticos}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{Math.round(hospital.tempoMedio)} dias</TableCell>
                        <TableCell>
                          {hospital.criticos > 0 ? (
                            <Badge variant="destructive">⚠️ Crítico</Badge>
                          ) : hospital.atrasados > 0 ? (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">Atenção</Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Notice */}
      {!isAdminOrGestor && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Modo visualização. Edições e novos BAUs devem ser feitos na ficha do Cliente.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
