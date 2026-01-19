import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Calendar, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Lock, Wallet, PiggyBank, Receipt, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  useFinanceiroStats, 
  useLancamentosFinanceiros, 
  useFechamentosMensais,
  useFecharMes,
  useMarcarRecebido,
  useDeleteLancamento,
  TIPO_RECEITA_LABELS
} from '@/hooks/useFinanceiro';
import { useAuth } from '@/hooks/useAuth';

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  recebido: { label: '✅ Recebido', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  parcial: { label: '⏳ Parcial', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  em_aberto: { label: '📋 A Receber', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  em_atraso: { label: '🚨 Atrasado', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  negociado: { label: '🤝 Negociado', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  cancelado: { label: '❌ Cancelado', bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
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
        return { inicio: startOfMonth(hoje).toISOString(), fim: endOfMonth(hoje).toISOString() };
      case 'mes_anterior':
        const mesAnterior = subMonths(hoje, 1);
        return { inicio: startOfMonth(mesAnterior).toISOString(), fim: endOfMonth(mesAnterior).toISOString() };
      case 'ultimos_3_meses':
        return { inicio: startOfMonth(subMonths(hoje, 2)).toISOString(), fim: endOfMonth(hoje).toISOString() };
      default:
        return { inicio: startOfMonth(hoje).toISOString(), fim: endOfMonth(hoje).toISOString() };
    }
  }, [periodoSelecionado]);

  const { data: stats, isLoading: statsLoading } = useFinanceiroStats(periodo);
  const { data: lancamentos, isLoading: lancamentosLoading } = useLancamentosFinanceiros(periodo);
  const { data: fechamentos } = useFechamentosMensais();
  const fecharMes = useFecharMes();
  const marcarRecebido = useMarcarRecebido();
  const deleteLancamento = useDeleteLancamento();

  const temPermissao = isAdmin || isGestor;
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
          Apenas Gestores e Administradores podem acessar.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const mesFechado = fechamentos?.some(f => f.ano === anoAtual && f.mes === mesAtual);
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

  // Calcular totais e percentuais
  const totalRecebido = stats?.totalRecebido || 0;
  const totalAReceber = stats?.totalAReceber || 0;
  const totalEmAtraso = stats?.totalEmAtraso || 0;
  const totalGeral = totalRecebido + totalAReceber + totalEmAtraso;
  
  const percentRecebido = totalGeral > 0 ? (totalRecebido / totalGeral) * 100 : 0;
  const percentAReceber = totalGeral > 0 ? (totalAReceber / totalGeral) * 100 : 0;
  const percentEmAtraso = totalGeral > 0 ? (totalEmAtraso / totalGeral) * 100 : 0;

  // Filtrar lançamentos por status para exibição rápida
  const lancamentosRecebidos = lancamentos?.filter(l => l.status === 'recebido') || [];
  const lancamentosPendentes = lancamentos?.filter(l => l.status === 'em_aberto') || [];
  const lancamentosAtrasados = lancamentos?.filter(l => l.status === 'em_atraso') || [];

  return (
    <div className="space-y-6 animate-fade-in p-4">
      {/* CABEÇALHO SIMPLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-2xl border">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            Dinheiro da Empresa
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Quanto entrou, quanto falta e quanto está atrasado 💰</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-48 h-12 text-base">
              <Calendar className="h-5 w-5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">📅 Este Mês</SelectItem>
              <SelectItem value="mes_anterior">📅 Mês Passado</SelectItem>
              <SelectItem value="ultimos_3_meses">📅 Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => navigate('/financeiro/novo')} className="h-12 text-base gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-5 w-5" />
            Novo
          </Button>
        </div>
      </div>

      {/* RESUMO VISUAL - 3 CAIXAS GRANDES */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* DINHEIRO QUE ENTROU */}
        <Card className="border-4 border-green-400 bg-green-50 dark:bg-green-950/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                {percentRecebido.toFixed(0)}%
              </Badge>
            </div>
            <p className="text-green-700 dark:text-green-300 font-semibold text-lg mb-1">💵 Dinheiro que ENTROU</p>
            <p className="text-4xl font-bold text-green-600">
              {statsLoading ? '...' : formatCurrency(totalRecebido)}
            </p>
            <div className="mt-4">
              <Progress value={percentRecebido} className="h-3 bg-green-200" />
            </div>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {lancamentosRecebidos.length} pagamentos recebidos
            </p>
          </CardContent>
        </Card>

        {/* DINHEIRO QUE VAI ENTRAR */}
        <Card className="border-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1">
                {percentAReceber.toFixed(0)}%
              </Badge>
            </div>
            <p className="text-blue-700 dark:text-blue-300 font-semibold text-lg mb-1">⏳ Vai ENTRAR (aguardando)</p>
            <p className="text-4xl font-bold text-blue-600">
              {statsLoading ? '...' : formatCurrency(totalAReceber)}
            </p>
            <div className="mt-4">
              <Progress value={percentAReceber} className="h-3 bg-blue-200" />
            </div>
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <Receipt className="h-4 w-4" />
              {lancamentosPendentes.length} esperando pagamento
            </p>
          </CardContent>
        </Card>

        {/* DINHEIRO ATRASADO */}
        <Card className="border-4 border-red-400 bg-red-50 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-red-500 text-white text-sm px-3 py-1">
                {percentEmAtraso.toFixed(0)}%
              </Badge>
            </div>
            <p className="text-red-700 dark:text-red-300 font-semibold text-lg mb-1">🚨 ATRASADO (cobrar!)</p>
            <p className="text-4xl font-bold text-red-600">
              {statsLoading ? '...' : formatCurrency(totalEmAtraso)}
            </p>
            <div className="mt-4">
              <Progress value={percentEmAtraso} className="h-3 bg-red-200" />
            </div>
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              {lancamentosAtrasados.length} precisam de cobrança
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TOTAL GERAL */}
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500 rounded-xl">
              <PiggyBank className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-purple-700 dark:text-purple-300 font-semibold text-lg">🏦 TOTAL GERAL (Tudo Junto)</p>
              <p className="text-4xl font-bold text-purple-600">
                {statsLoading ? '...' : formatCurrency(totalGeral)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status do Mês</p>
            {mesFechado ? (
              <Badge className="bg-green-500 text-lg px-4 py-2">🔒 Fechado</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600 text-lg px-4 py-2">📖 Aberto</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* LISTA SIMPLES DE LANÇAMENTOS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-6 w-6 text-primary" />
            📋 Lista de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentosLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !lancamentos?.length ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">Nenhum lançamento neste período</p>
              <Button onClick={() => navigate('/financeiro/novo')} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-base font-bold">Cliente</TableHead>
                    <TableHead className="text-base font-bold">Tipo</TableHead>
                    <TableHead className="text-base font-bold text-right">Valor</TableHead>
                    <TableHead className="text-base font-bold text-center">Status</TableHead>
                    <TableHead className="text-base font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.slice(0, 15).map((lanc) => {
                    const statusConfig = STATUS_CONFIG[lanc.status] || STATUS_CONFIG.em_aberto;
                    return (
                      <TableRow key={lanc.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-base">
                          {lanc.cliente?.name || 'Cliente não informado'}
                        </TableCell>
                        <TableCell className="text-base">
                          {TIPO_RECEITA_LABELS[lanc.tipo_receita as keyof typeof TIPO_RECEITA_LABELS] || lanc.tipo_receita}
                        </TableCell>
                        <TableCell className="text-right font-bold text-base">
                          {formatCurrency(lanc.valor_bruto || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} text-sm px-3 py-1`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {lanc.status !== 'recebido' && lanc.status !== 'cancelado' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => {
                                  setLancamentoSelecionado(lanc.id);
                                  setMarcarRecebidoDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Recebeu
                              </Button>
                            )}
                            {isRafael && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => {
                                  setLancamentoParaExcluir(lanc.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                🗑️
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {lancamentos.length > 15 && (
                <p className="text-center text-muted-foreground py-4">
                  Mostrando 15 de {lancamentos.length} lançamentos
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOTÃO FECHAR MÊS */}
      {podeFecharMes && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-amber-700 dark:text-amber-300 font-semibold text-lg">
                📆 Último dia do mês! Hora de fechar?
              </p>
              <p className="text-muted-foreground">Após fechar, os dados não poderão mais ser alterados.</p>
            </div>
            <Button 
              onClick={() => setFechamentoDialogOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-lg px-6 py-3"
            >
              <Lock className="h-5 w-5 mr-2" />
              Fechar Mês
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DIALOGS */}
      <Dialog open={marcarRecebidoDialogOpen} onOpenChange={setMarcarRecebidoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">✅ Marcar como Recebido</DialogTitle>
            <DialogDescription>Confirme que este pagamento foi recebido</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-base">Data do Recebimento</Label>
            <Input 
              type="date" 
              value={dataRecebimento} 
              onChange={(e) => setDataRecebimento(e.target.value)}
              className="mt-2 h-12 text-base"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcarRecebidoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarcarRecebido} className="bg-green-600 hover:bg-green-700">
              {marcarRecebido.isPending ? 'Salvando...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">🗑️ Excluir Lançamento</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita!</DialogDescription>
          </DialogHeader>
          <p className="py-4 text-muted-foreground">Tem certeza que deseja excluir este lançamento financeiro?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir}>
              {deleteLancamento.isPending ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fechamentoDialogOpen} onOpenChange={setFechamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">🔒 Fechar Mês {mesAtual}/{anoAtual}</DialogTitle>
            <DialogDescription>Após fechar, os dados serão consolidados e não poderão mais ser editados.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-base">Observações (opcional)</Label>
            <Textarea 
              value={fechamentoObs} 
              onChange={(e) => setFechamentoObs(e.target.value)}
              placeholder="Adicione observações sobre o fechamento..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFechamentoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFecharMes} disabled={fecharMes.isPending} className="bg-amber-600 hover:bg-amber-700">
              {fecharMes.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
