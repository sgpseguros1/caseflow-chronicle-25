import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ClipboardList, TrendingUp, TrendingDown, Clock, FileText, 
  Calendar, Users, PieChart, BarChart3, Building2, UserCheck,
  ArrowUpRight, ArrowDownRight, Receipt, CheckCircle2, Scale,
  Target, Zap, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useControleProcessosStats } from '@/hooks/useControleProcessos';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';

const COLORS = ['#1a365d', '#c9a227', '#2d5a87', '#d4af37', '#3b6d8c', '#e0c35a', '#4a7fa3', '#f0d87c'];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aguardando_documentos: { label: 'Aguardando Docs', variant: 'outline' },
  em_andamento: { label: 'Em Andamento', variant: 'default' },
  protocolado: { label: 'Protocolado', variant: 'default' },
  concluido: { label: 'Concluído', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  liquidado: { label: 'Liquidado', variant: 'default' },
  finalizado: { label: 'Finalizado', variant: 'default' },
  pendente: { label: 'Pendente', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'destructive' }
};

export default function ControleProcessosPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ano_atual');

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

  const { data: stats, isLoading } = useControleProcessosStats(periodo);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Controle de Processos
          </h1>
          <p className="text-muted-foreground">Entrada, liquidação e métricas completas de protocolos</p>
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
        </div>
      </div>

      {/* Cards Executivos - Visão Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Protocolos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalProtocolos || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Entrada no período</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gold">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Liquidados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">
              {stats?.protocolosLiquidados || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa: {stats && stats.totalProtocolos > 0 
                ? ((stats.protocolosLiquidados / stats.totalProtocolos) * 100).toFixed(1) 
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Valor Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.valorTotalRecebido || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total liquidado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(stats?.tempoMedioLiquidacao || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dias para liquidação</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.protocolosAtivos || 0}</div>
            <Progress 
              value={stats && stats.totalProtocolos > 0 
                ? (stats.protocolosAtivos / stats.totalProtocolos) * 100 
                : 0
              } 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.protocolosPendentes || 0}</div>
            <Progress 
              value={stats && stats.totalProtocolos > 0 
                ? (stats.protocolosPendentes / stats.totalProtocolos) * 100 
                : 0
              } 
              className="mt-2 h-2 [&>div]:bg-yellow-500" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Valor Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats?.valorTotalEstimado || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Potencial total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="visao_geral" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="visao_geral" className="gap-2">
            <PieChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="seguradoras" className="gap-2">
            <Building2 className="h-4 w-4" />
            Por Seguradora
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Indicações
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="h-4 w-4" />
            Por Equipe
          </TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Entradas Recentes
          </TabsTrigger>
          <TabsTrigger value="liquidacoes" className="gap-2">
            <Receipt className="h-4 w-4" />
            Liquidações
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao_geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Distribuição por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.porTipo && stats.porTipo.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={stats.porTipo}
                          dataKey="quantidade"
                          nameKey="tipo"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ tipo, percentual }) => `${tipo}: ${percentual.toFixed(0)}%`}
                        >
                          {stats.porTipo.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
                <div className="mt-4 space-y-2">
                  {stats?.porTipo?.slice(0, 5).map((item, index) => (
                    <div key={item.tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{item.tipo}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{item.quantidade}</span>
                        <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.porStatus && stats.porStatus.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.porStatus} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis dataKey="status" type="category" width={120} className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="#1a365d" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução Mensal: Entradas vs Liquidações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.porMes && stats.porMes.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.porMes}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#1a365d" fill="#1a365d" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="liquidacoes" name="Liquidações" stroke="#c9a227" fill="#c9a227" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Seguradora */}
        <TabsContent value="seguradoras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Desempenho por Seguradora
              </CardTitle>
              <CardDescription>
                Quantidade de protocolos, valores e taxa de conversão por seguradora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seguradora</TableHead>
                    <TableHead className="text-center">Protocolos</TableHead>
                    <TableHead className="text-center">Taxa Conversão</TableHead>
                    <TableHead className="text-right">Valor Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.porSeguradora?.slice(0, 15).map((seg, index) => (
                    <TableRow key={seg.seguradora}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">{index + 1}.</span>
                          <span className="font-medium">{seg.seguradora}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{seg.quantidade}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={seg.taxaConversao} className="w-20 h-2" />
                          <span className="text-sm">{seg.taxaConversao.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(seg.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.porSeguradora || stats.porSeguradora.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Indicador */}
        <TabsContent value="indicadores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Origem das Indicações
              </CardTitle>
              <CardDescription>
                De onde vêm os clientes e protocolos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  {stats?.porIndicador?.map((ind, index) => (
                    <div key={ind.indicador} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: COLORS[index % COLORS.length], color: 'white' }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{ind.indicador}</p>
                          <p className="text-xs text-muted-foreground">{ind.quantidade} protocolos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(ind.valor)}</p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.porIndicador || stats.porIndicador.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                  )}
                </div>
                <div className="h-64">
                  {stats?.porIndicador && stats.porIndicador.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.porIndicador.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="indicador" className="text-xs" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantidade" name="Protocolos" fill="#1a365d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Equipe */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Desempenho da Equipe
              </CardTitle>
              <CardDescription>
                Produtividade por analista/responsável
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Ativos</TableHead>
                    <TableHead className="text-center">Liquidados</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.porResponsavel?.map((resp, index) => (
                    <TableRow key={resp.nome}>
                      <TableCell>
                        {index < 3 ? (
                          <Award className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{resp.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{resp.ativos}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500">{resp.liquidados}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(resp.valorTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.porResponsavel || stats.porResponsavel.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entradas Recentes */}
        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                Protocolos Recentes
              </CardTitle>
              <CardDescription>
                Últimas entradas no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Seguradora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.protocolosRecentes?.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">#{p.codigo}</TableCell>
                      <TableCell>{p.cliente}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.tipo}</Badge>
                      </TableCell>
                      <TableCell>{p.seguradora || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[p.status]?.variant || 'default'}>
                          {STATUS_CONFIG[p.status]?.label || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(p.data), 'dd/MM/yyyy')}</TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.protocolosRecentes || stats.protocolosRecentes.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liquidações */}
        <TabsContent value="liquidacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gold" />
                Liquidações Recentes
              </CardTitle>
              <CardDescription>
                Protocolos finalizados com pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Dias</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.liquidacoesRecentes?.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">#{p.codigo}</TableCell>
                      <TableCell>{p.cliente}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(p.valor)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{p.diasTramitacao} dias</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(p.data), 'dd/MM/yyyy')}</TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.liquidacoesRecentes || stats.liquidacoesRecentes.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
