import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Plus, RefreshCw, Scale, FileText, Clock, AlertTriangle, 
  CheckCircle, Users, DollarSign, Calendar, ExternalLink, Eye, 
  Edit, Trash2, Filter, Download, BarChart3, TrendingUp,
  Gavel, Building, MapPin, User, Briefcase
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useProcessosJudiciais, 
  useCreateProcessoJudicial, 
  useBuscarProcessoDataJud,
  useSincronizarProcessosJudiciais,
  useEstatisticasProcessosJudiciais,
  useAlertasPrazo,
  ProcessoJudicial
} from '@/hooks/useProcessosJudiciais';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

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

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: 'bg-gray-400',
  media: 'bg-blue-400',
  alta: 'bg-orange-500',
  urgente: 'bg-red-600',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6'];

export default function ProcessosJudiciaisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [numeroProcessoBusca, setNumeroProcessoBusca] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: processos, isLoading } = useProcessosJudiciais({
    status: statusFilter || undefined,
    prioridade: prioridadeFilter || undefined,
  });
  const { data: estatisticas } = useEstatisticasProcessosJudiciais();
  const { data: alertas } = useAlertasPrazo();
  const { data: funcionarios } = useFuncionarios();
  const createProcesso = useCreateProcessoJudicial();
  const buscarProcesso = useBuscarProcessoDataJud();
  const sincronizar = useSincronizarProcessosJudiciais();

  const processosFiltrados = processos?.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.numero_processo?.toLowerCase().includes(term) ||
      p.autor_nome?.toLowerCase().includes(term) ||
      p.reu_nome?.toLowerCase().includes(term) ||
      p.tribunal?.toLowerCase().includes(term) ||
      p.classe_processual?.toLowerCase().includes(term)
    );
  }) || [];

  const handleBuscarProcesso = async () => {
    if (!numeroProcessoBusca.trim()) return;
    await buscarProcesso.mutateAsync(numeroProcessoBusca);
    setNumeroProcessoBusca('');
    setDialogOpen(false);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Dados para gráficos
  const chartDataStatus = Object.entries(estatisticas?.porStatus || {}).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
  }));

  const chartDataPrioridade = Object.entries(estatisticas?.porPrioridade || {}).map(([prioridade, count]) => ({
    name: prioridade.charAt(0).toUpperCase() + prioridade.slice(1),
    value: count,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-7 w-7 text-primary" />
              Processos Judiciais do Escritório
            </h1>
            <p className="text-muted-foreground">
              Gestão completa de processos com busca automática nos tribunais
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => sincronizar.mutate()}
              disabled={sincronizar.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sincronizar.isPending ? 'animate-spin' : ''}`} />
              Sincronizar Todos
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Processo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar Processo Automaticamente
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Número do Processo (CNJ)</Label>
                    <Input
                      placeholder="0000000-00.0000.0.00.0000"
                      value={numeroProcessoBusca}
                      onChange={(e) => setNumeroProcessoBusca(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Digite o número completo no formato CNJ. O sistema buscará automaticamente 
                      os dados do processo, partes, andamentos e muito mais.
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleBuscarProcesso}
                    disabled={buscarProcesso.isPending || !numeroProcessoBusca.trim()}
                  >
                    {buscarProcesso.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Buscando nos Tribunais...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar e Importar Processo
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="processos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Processos</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              {alertas && alertas.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {alertas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Total</p>
                      <p className="text-2xl font-bold">{estatisticas?.total || 0}</p>
                    </div>
                    <Scale className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Em Andamento</p>
                      <p className="text-2xl font-bold">{estatisticas?.emAndamento || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Audiências</p>
                      <p className="text-2xl font-bold">{estatisticas?.aguardandoAudiencia || 0}</p>
                    </div>
                    <Gavel className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Prazos Próx.</p>
                      <p className="text-2xl font-bold">{estatisticas?.prazosProximos || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Sentenciados</p>
                      <p className="text-2xl font-bold">{estatisticas?.sentenciado || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Arquivados</p>
                      <p className="text-2xl font-bold">{estatisticas?.arquivado || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Total das Causas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(estatisticas?.valorTotal || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Indenização Pleiteada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(estatisticas?.indenizacaoPleiteada || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Indenização Paga
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(estatisticas?.indenizacaoPaga || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processos por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {chartDataStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processos por Prioridade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataPrioridade}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Últimos Processos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimas Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processos?.slice(0, 5).map((processo) => (
                    <div 
                      key={processo.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{processo.numero_processo}</span>
                          <Badge className={STATUS_COLORS[processo.status]}>
                            {STATUS_LABELS[processo.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {processo.ultima_movimentacao || 'Sem movimentação'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {processo.data_ultima_movimentacao 
                            ? formatDistanceToNow(new Date(processo.data_ultima_movimentacao), { addSuffix: true, locale: ptBR })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processos Tab */}
          <TabsContent value="processos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, partes, tribunal..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Status</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Processos */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Tribunal/Vara</TableHead>
                        <TableHead>Partes</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Última Mov.</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : processosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            Nenhum processo encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        processosFiltrados.map((processo) => (
                          <TableRow key={processo.id}>
                            <TableCell>
                              <div>
                                <span className="font-mono text-sm">{processo.numero_processo}</span>
                                <p className="text-xs text-muted-foreground">
                                  {processo.classe_processual || '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{processo.tribunal || '-'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{processo.vara || '-'}</p>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-green-500" />
                                  <span className="text-xs">{processo.autor_nome || 'Não informado'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3 text-red-500" />
                                  <span className="text-xs">{processo.reu_nome || 'Não informado'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{formatCurrency(processo.valor_causa)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_COLORS[processo.status]} text-white text-xs`}>
                                {STATUS_LABELS[processo.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${PRIORIDADE_COLORS[processo.prioridade]} text-white text-xs`}>
                                {processo.prioridade.charAt(0).toUpperCase() + processo.prioridade.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="text-xs truncate">{processo.ultima_movimentacao || '-'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {processo.data_ultima_movimentacao 
                                    ? format(new Date(processo.data_ultima_movimentacao), 'dd/MM/yyyy', { locale: ptBR })
                                    : '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {processo.link_externo && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => window.open(processo.link_externo!, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas Tab */}
          <TabsContent value="alertas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas de Prazo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alertas && alertas.length > 0 ? (
                  <div className="space-y-3">
                    {alertas.map((alerta: any) => (
                      <div 
                        key={alerta.id}
                        className={`p-4 rounded-lg border ${
                          alerta.dias_restantes <= 1 
                            ? 'bg-red-50 border-red-200' 
                            : alerta.dias_restantes <= 3 
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{alerta.titulo}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alerta.descricao}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Processo: {alerta.processos_judiciais?.numero_processo}
                            </p>
                          </div>
                          <Badge variant={alerta.dias_restantes <= 1 ? 'destructive' : 'secondary'}>
                            {alerta.dias_restantes} dia(s)
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Nenhum alerta de prazo pendente!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="relatorios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Download className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-medium">Relatório Geral</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Exportar todos os processos em PDF
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 text-green-600" />
                  <h3 className="font-medium">Relatório Financeiro</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Valores e pagamentos por processo
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-medium">Por Responsável</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processos por funcionário
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-orange-600" />
                  <h3 className="font-medium">Linha do Tempo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cronograma de eventos
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Building className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-medium">Por Tribunal</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Distribuição por tribunal
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
                  <h3 className="font-medium">Análise de Performance</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Métricas e KPIs
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
