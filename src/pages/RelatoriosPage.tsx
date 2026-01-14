import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, Download, Calendar, BarChart3, Users, 
  Building2, Scale, MessageSquare, Bell, TrendingUp,
  DollarSign, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRelatorioCompleto, useExportRelatorio } from '@/hooks/useRelatorios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'custom'>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activeTab, setActiveTab] = useState('resumo');

  const { data: relatorio, isLoading } = useRelatorioCompleto(periodo, dataInicio, dataFim);
  const { exportToCsv } = useExportRelatorio();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExport = () => {
    if (relatorio) {
      const filename = `relatorio_${periodo}_${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCsv(relatorio, filename);
    }
  };

  const canalChartData = Object.entries(relatorio?.comunicacoes.por_canal || {}).map(([canal, value]) => ({
    name: canal.charAt(0).toUpperCase() + canal.slice(1),
    value,
  }));

  const producaoChartData = (relatorio?.producao_por_funcionario || []).slice(0, 10).map(p => ({
    name: p.funcionario_nome.split(' ')[0],
    baus: p.baus_recebidos,
    comunicacoes: p.comunicacoes,
    alertas: p.alertas_resolvidos,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              Relatórios de Produção
            </h1>
            <p className="text-muted-foreground">
              Análise completa de BAUs, Processos, Comunicação e Alertas
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {periodo === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">De:</Label>
                  <Input 
                    type="date" 
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Até:</Label>
                  <Input 
                    type="date" 
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </>
            )}

            <Button onClick={handleExport} disabled={!relatorio}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">BAUs</p>
                      <p className="text-2xl font-bold">{relatorio?.baus.total || 0}</p>
                    </div>
                    <Building2 className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Recebidos</p>
                      <p className="text-2xl font-bold">{relatorio?.baus.recebidos || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Processos</p>
                      <p className="text-2xl font-bold">{relatorio?.processos.total || 0}</p>
                    </div>
                    <Scale className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Comunicações</p>
                      <p className="text-2xl font-bold">{relatorio?.comunicacoes.total || 0}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Alertas</p>
                      <p className="text-2xl font-bold">{relatorio?.alertas.total || 0}</p>
                    </div>
                    <Bell className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Valor Total</p>
                      <p className="text-lg font-bold">{formatCurrency(relatorio?.processos.valor_total || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="bau">BAU</TabsTrigger>
                <TabsTrigger value="processos">Processos</TabsTrigger>
                <TabsTrigger value="producao">Produção</TabsTrigger>
              </TabsList>

              {/* Resumo Tab */}
              <TabsContent value="resumo" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Comunicações por Canal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Comunicações por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={canalChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {canalChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Produção por Funcionário */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Produção por Funcionário</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={producaoChartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="baus" fill="#3b82f6" name="BAUs" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="comunicacoes" fill="#10b981" name="Comunicações" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="alertas" fill="#f59e0b" name="Alertas" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Resumo Financeiro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Resumo Financeiro dos Processos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Valor Total das Causas</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(relatorio?.processos.valor_total || 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Indenização Pleiteada</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(relatorio?.processos.indenizacao_pleiteada || 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Indenização Paga</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(relatorio?.processos.indenizacao_paga || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BAU Tab */}
              <TabsContent value="bau" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.baus.total || 0}</p>
                          <p className="text-xs text-muted-foreground">Total de BAUs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.baus.solicitados || 0}</p>
                          <p className="text-xs text-muted-foreground">Solicitados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.baus.recebidos || 0}</p>
                          <p className="text-xs text-muted-foreground">Recebidos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.baus.incompletos || 0}</p>
                          <p className="text-xs text-muted-foreground">Incompletos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Tempo Médio de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-primary">
                        {relatorio?.baus.tempo_medio || 0}
                      </div>
                      <div className="text-muted-foreground">
                        dias em média para receber BAUs
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Processos Tab */}
              <TabsContent value="processos" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Scale className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.processos.total || 0}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.processos.em_andamento || 0}</p>
                          <p className="text-xs text-muted-foreground">Em Andamento</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.processos.sentenciados || 0}</p>
                          <p className="text-xs text-muted-foreground">Sentenciados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.processos.audiencias_agendadas || 0}</p>
                          <p className="text-xs text-muted-foreground">Audiências</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{relatorio?.processos.prazos_proximos || 0}</p>
                          <p className="text-xs text-muted-foreground">Prazos Próximos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Produção Tab */}
              <TabsContent value="producao">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Produção por Funcionário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead className="text-center">BAUs Solicitados</TableHead>
                          <TableHead className="text-center">BAUs Recebidos</TableHead>
                          <TableHead className="text-center">Incompletos</TableHead>
                          <TableHead className="text-center">Comunicações</TableHead>
                          <TableHead className="text-center">Alertas Resolvidos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorio?.producao_por_funcionario.map((p) => (
                          <TableRow key={p.funcionario_id}>
                            <TableCell className="font-medium">{p.funcionario_nome}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{p.baus_solicitados}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-100 text-green-800">{p.baus_recebidos}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-red-100 text-red-800">{p.baus_incompletos}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-100 text-blue-800">{p.comunicacoes}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-orange-100 text-orange-800">{p.alertas_resolvidos}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!relatorio?.producao_por_funcionario || relatorio.producao_por_funcionario.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Nenhum dado de produção no período</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
