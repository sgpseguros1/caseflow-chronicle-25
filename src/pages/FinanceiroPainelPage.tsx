import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, FileText, AlertTriangle, 
  Calendar, Users, PieChart, BarChart3, Lock, Eye, Plus,
  ArrowUpRight, ArrowDownRight, Receipt, CheckCircle2, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  useFinanceiroStats, 
  useLancamentosFinanceiros, 
  useFechamentosMensais,
  useFecharMes,
  useAuditoriaFinanceira,
  useMarcarRecebido,
  useDeleteLancamento,
  TIPO_RECEITA_LABELS
} from '@/hooks/useFinanceiro';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899', '#14b8a6'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recebido: { label: 'Recebido', color: 'bg-green-500' },
  parcial: { label: 'Parcial', color: 'bg-yellow-500' },
  em_aberto: { label: 'A Receber', color: 'bg-blue-500' },
  em_atraso: { label: 'Em Atraso', color: 'bg-red-500' },
  negociado: { label: 'Negociado', color: 'bg-purple-500' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-500' }
};

export default function FinanceiroPainelPage() {
  const navigate = useNavigate();
  const { isAdmin, isGestor, profile, loading: authLoading } = useAuth();
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes_atual');
  const [fechamentoObs, setFechamentoObs] = useState('');
  const [fechamentoDialogOpen, setFechamentoDialogOpen] = useState(false);
  const [marcarRecebidoDialogOpen, setMarcarRecebidoDialogOpen] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<string | null>(null);
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lancamentoParaExcluir, setLancamentoParaExcluir] = useState<string | null>(null);

  const periodo = useMemo(() => {
    const hoje = new Date();
    switch (periodoSelecionado) {
      case 'mes_atual':
        return { 
          inicio: startOfMonth(hoje).toISOString(), 
          fim: endOfMonth(hoje).toISOString() 
        };
      case 'mes_anterior':
        const mesAnterior = subMonths(hoje, 1);
        return { 
          inicio: startOfMonth(mesAnterior).toISOString(), 
          fim: endOfMonth(mesAnterior).toISOString() 
        };
      case 'ultimos_3_meses':
        return { 
          inicio: startOfMonth(subMonths(hoje, 2)).toISOString(), 
          fim: endOfMonth(hoje).toISOString() 
        };
      case 'ultimos_6_meses':
        return { 
          inicio: startOfMonth(subMonths(hoje, 5)).toISOString(), 
          fim: endOfMonth(hoje).toISOString() 
        };
      case 'ano_atual':
        return { 
          inicio: new Date(hoje.getFullYear(), 0, 1).toISOString(), 
          fim: new Date(hoje.getFullYear(), 11, 31).toISOString() 
        };
      default:
        return { 
          inicio: startOfMonth(hoje).toISOString(), 
          fim: endOfMonth(hoje).toISOString() 
        };
    }
  }, [periodoSelecionado]);

  const { data: stats, isLoading: statsLoading } = useFinanceiroStats(periodo);
  const { data: lancamentos, isLoading: lancamentosLoading } = useLancamentosFinanceiros(periodo);
  const { data: fechamentos } = useFechamentosMensais();
  const { data: auditoria } = useAuditoriaFinanceira();
  const fecharMes = useFecharMes();
  const marcarRecebido = useMarcarRecebido();
  const deleteLancamento = useDeleteLancamento();

  // Verificar permissão - apenas admin e gestor
  const temPermissao = isAdmin || isGestor;
  
  // Verificar se é o usuário Rafael (único que pode excluir)
  const isRafael = profile?.name?.toLowerCase().includes('rafael') || profile?.email?.toLowerCase().includes('rafael');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!temPermissao) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground text-center max-w-md">
          O painel financeiro é exclusivo para Gestores e Administradores.
          Entre em contato com seu gestor para mais informações.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const mesFechado = fechamentos?.some(f => f.ano === anoAtual && f.mes === mesAtual);
  
  // Verificar se é o último dia do mês
  const hoje = new Date();
  const ultimoDiaMes = new Date(anoAtual, mesAtual, 0).getDate();
  const podeFecharMes = hoje.getDate() === ultimoDiaMes && !mesFechado;

  const handleFecharMes = () => {
    fecharMes.mutate({ ano: anoAtual, mes: mesAtual, observacoes: fechamentoObs }, {
      onSuccess: () => {
        setFechamentoDialogOpen(false);
        setFechamentoObs('');
      }
    });
  };

  const handleMarcarRecebido = () => {
    if (lancamentoSelecionado) {
      marcarRecebido.mutate({ id: lancamentoSelecionado, dataRecebimento }, {
        onSuccess: () => {
          setMarcarRecebidoDialogOpen(false);
          setLancamentoSelecionado(null);
        }
      });
    }
  };

  const handleExcluir = () => {
    if (lancamentoParaExcluir && isRafael) {
      deleteLancamento.mutate({ id: lancamentoParaExcluir, isRafael: true }, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setLancamentoParaExcluir(null);
        }
      });
    }
  };

  const openMarcarRecebido = (id: string) => {
    setLancamentoSelecionado(id);
    setMarcarRecebidoDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setLancamentoParaExcluir(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-primary" />
            Painel Financeiro
          </h1>
          <p className="text-muted-foreground">Gestão completa de receitas e caixa em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
              <SelectItem value="ano_atual">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => navigate('/financeiro/novo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Cards Executivos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Recebido - VERDE */}
        <Card 
          className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/financeiro/novo')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : formatCurrency(stats?.totalRecebido || 0)}
            </div>
            {stats?.crescimentoPercentual !== undefined && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${stats.crescimentoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.crescimentoPercentual >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(stats.crescimentoPercentual).toFixed(1)}% vs período anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* A Receber - AZUL */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : formatCurrency(stats?.totalAReceber || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.contasAReceber?.length || 0} lançamentos pendentes
            </p>
          </CardContent>
        </Card>

        {/* Em Atraso - VERMELHO */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? '...' : formatCurrency(stats?.totalEmAtraso || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.contasEmAtraso?.length || 0} em atraso
            </p>
          </CardContent>
        </Card>

        {/* Receita Média - ROXO */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Receita Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : formatCurrency(stats?.receitaMedia || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 3 meses fechados</p>
          </CardContent>
        </Card>

        {/* Lançamentos - CINZA */}
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {statsLoading ? '...' : stats?.numeroLancamentos || 0}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {stats?.lancamentosPorStatus?.map(s => (
                <Badge key={s.status} variant="outline" className="text-xs">
                  {STATUS_CONFIG[s.status]?.label || s.status}: {s.quantidade}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status do Mês */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Status do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mesFechado ? (
              <Badge className="bg-green-500">Fechado</Badge>
            ) : (
              <div className="space-y-2">
                <Badge variant="outline" className="border-amber-500 text-amber-600">Aberto</Badge>
                {podeFecharMes && (
                  <Dialog open={fechamentoDialogOpen} onOpenChange={setFechamentoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 w-full">
                        <Lock className="h-4 w-4" />
                        Fechar Mês
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Fechar Mês {mesAtual}/{anoAtual}</DialogTitle>
                        <DialogDescription>
                          Ao fechar o mês, os dados serão consolidados e não poderão mais ser editados.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Observações (opcional)</Label>
                          <Textarea 
                            value={fechamentoObs} 
                            onChange={(e) => setFechamentoObs(e.target.value)}
                            placeholder="Adicione observações sobre o fechamento..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setFechamentoDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFecharMes} disabled={fecharMes.isPending}>
                          {fecharMes.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {!podeFecharMes && !mesFechado && (
                  <p className="text-xs text-muted-foreground">Fechamento apenas no dia {ultimoDiaMes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="visao_geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao_geral" className="gap-2">
            <PieChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="gap-2">
            <Receipt className="h-4 w-4" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="contas_receber" className="gap-2">
            <Clock className="h-4 w-4" />
            A Receber
          </TabsTrigger>
          <TabsTrigger value="em_atraso" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Em Atraso
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            Por Cliente
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="auditoria" className="gap-2">
              <Eye className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
          )}
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao_geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Receita por Tipo de Indenização */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Receita por Tipo de Indenização
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.porTipo && stats.porTipo.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={stats.porTipo}
                          dataKey="valor"
                          nameKey="tipo"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ tipo, percentual }) => `${tipo}: ${percentual.toFixed(1)}%`}
                        >
                          {stats.porTipo.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
                <div className="mt-4 space-y-2">
                  {stats?.porTipo?.map((item, index) => (
                    <div key={item.tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{item.tipo}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{formatCurrency(item.valor)}</span>
                        <Progress value={item.percentual} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fluxo de Caixa Diário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Fluxo de Caixa Diário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.porDia && stats.porDia.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.porDia}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="data" 
                          tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                          className="text-xs"
                        />
                        <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                        />
                        <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Fechamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Histórico de Fechamentos Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fechamentos && fechamentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Total Recebido</TableHead>
                      <TableHead>A Receber</TableHead>
                      <TableHead>Em Atraso</TableHead>
                      <TableHead>Lançamentos</TableHead>
                      <TableHead>Fechado Em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fechamentos.slice(0, 6).map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.mes}/{f.ano}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(f.total_recebido)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(f.total_a_receber)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(f.total_em_atraso)}</TableCell>
                        <TableCell>{f.numero_lancamentos}</TableCell>
                        <TableCell>{format(new Date(f.fechado_em), 'dd/MM/yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum fechamento realizado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lançamentos Financeiros</CardTitle>
              <CardDescription>Todos os registros do período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {lancamentosLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : lancamentos && lancamentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Bruto</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Pendente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.cliente?.name || 'N/A'}</TableCell>
                        <TableCell>{TIPO_RECEITA_LABELS[l.tipo_receita] || l.tipo_receita}</TableCell>
                        <TableCell>{formatCurrency(l.valor_bruto)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(l.valor_pago)}</TableCell>
                        <TableCell className={l.valor_pendente > 0 ? 'text-red-600' : ''}>{formatCurrency(l.valor_pendente)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[l.status]?.color || 'bg-gray-500'}>
                            {STATUS_CONFIG[l.status]?.label || l.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{l.data_recebimento ? format(new Date(l.data_recebimento), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => navigate(`/financeiro/${l.id}`)}
                            >
                              Editar
                            </Button>
                            {l.status !== 'recebido' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600"
                                onClick={() => openMarcarRecebido(l.id)}
                              >
                                Receber
                              </Button>
                            )}
                            {isRafael && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => openDeleteDialog(l.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum lançamento encontrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contas a Receber */}
        <TabsContent value="contas_receber" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Contas a Receber
              </CardTitle>
              <CardDescription>Valores pendentes de recebimento</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.contasAReceber && stats.contasAReceber.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Pendente</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.contasAReceber.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.cliente?.name || 'N/A'}</TableCell>
                        <TableCell>{TIPO_RECEITA_LABELS[l.tipo_receita] || l.tipo_receita}</TableCell>
                        <TableCell>{formatCurrency(l.valor_bruto)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(l.valor_pago)}</TableCell>
                        <TableCell className="text-blue-600 font-medium">{formatCurrency(l.valor_pendente)}</TableCell>
                        <TableCell>{l.data_vencimento ? format(new Date(l.data_vencimento), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            onClick={() => openMarcarRecebido(l.id)}
                          >
                            Marcar Recebido
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma conta a receber</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Em Atraso */}
        <TabsContent value="em_atraso" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Contas em Atraso
              </CardTitle>
              <CardDescription>Valores com data de vencimento ultrapassada</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.contasEmAtraso && stats.contasEmAtraso.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Pendente</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias em Atraso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.contasEmAtraso.map((l) => {
                      const diasAtraso = l.data_vencimento 
                        ? differenceInDays(new Date(), new Date(l.data_vencimento))
                        : 0;
                      return (
                        <TableRow key={l.id} className="bg-red-50 dark:bg-red-900/10">
                          <TableCell className="font-medium">{l.cliente?.name || 'N/A'}</TableCell>
                          <TableCell>{TIPO_RECEITA_LABELS[l.tipo_receita] || l.tipo_receita}</TableCell>
                          <TableCell className="text-red-600 font-bold">{formatCurrency(l.valor_pendente)}</TableCell>
                          <TableCell>{l.data_vencimento ? format(new Date(l.data_vencimento), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{diasAtraso} dias</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600"
                              onClick={() => openMarcarRecebido(l.id)}
                            >
                              Marcar Recebido
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma conta em atraso!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Cliente */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top 10 Clientes por Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.porCliente && stats.porCliente.length > 0 ? (
                <div className="space-y-4">
                  {stats.porCliente.map((cliente, index) => (
                    <div key={cliente.clienteId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium">{cliente.clienteNome}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-green-600">{formatCurrency(cliente.valor)}</span>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/clientes/${cliente.clienteId}`)}>
                          Ver Cliente
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditoria (apenas admin) */}
        {isAdmin && (
          <TabsContent value="auditoria" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Log de Auditoria Financeira
                </CardTitle>
                <CardDescription>Todas as ações são registradas automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                {auditoria && auditoria.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor Anterior</TableHead>
                        <TableHead>Valor Novo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditoria.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Badge variant={log.acao === 'exclusao' ? 'destructive' : log.acao === 'criacao' ? 'default' : 'secondary'}>
                              {log.acao}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.descricao}</TableCell>
                          <TableCell>{log.valor_anterior ? formatCurrency(log.valor_anterior) : '-'}</TableCell>
                          <TableCell>{log.valor_novo ? formatCurrency(log.valor_novo) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum registro de auditoria</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Marcar Recebido */}
      <Dialog open={marcarRecebidoDialogOpen} onOpenChange={setMarcarRecebidoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              Informe a data em que o valor foi recebido.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Data de Recebimento</Label>
            <Input 
              type="date" 
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcarRecebidoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarcarRecebido} disabled={marcarRecebido.isPending} className="bg-green-600 hover:bg-green-700">
              {marcarRecebido.isPending ? 'Salvando...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Lançamento</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O lançamento será removido permanentemente, mas ficará registrado na auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir} disabled={deleteLancamento.isPending}>
              {deleteLancamento.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
