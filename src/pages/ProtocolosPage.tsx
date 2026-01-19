import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Clock, AlertTriangle, TrendingUp, DollarSign, Users, CheckCircle2, XCircle, Briefcase, Scale, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProtocoloCard } from '@/components/protocolos/ProtocoloCard';
import { useProtocolos } from '@/hooks/useProtocolos';
import { useDashboardProtocolos } from '@/hooks/useDashboardProtocolos';
import { TIPO_PROTOCOLO_LABELS, STATUS_PROTOCOLO_LABELS, TipoProtocolo, StatusProtocolo } from '@/types/protocolo';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProtocolosPage() {
  const navigate = useNavigate();
  const { data: protocolos, isLoading } = useProtocolos();
  const { data: stats, isLoading: loadingStats } = useDashboardProtocolos();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showMetrics, setShowMetrics] = useState(true);
  const [showNewProtocolDialog, setShowNewProtocolDialog] = useState(false);

  const filteredProtocolos = protocolos?.filter(p => {
    const matchSearch = !search || 
      p.cliente?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toString().includes(search);
    const matchTipo = tipoFilter === 'todos' || p.tipo === tipoFilter;
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchSearch && matchTipo && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading || loadingStats) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#e11d48', '#f59e0b', '#14b8a6', '#06b6d4'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Dialog para explicar criação via Cliente */}
      <Dialog open={showNewProtocolDialog} onOpenChange={setShowNewProtocolDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Criar Novo Protocolo
            </DialogTitle>
            <DialogDescription className="pt-2">
              Para garantir a integridade dos dados, novos protocolos devem ser criados através do cadastro do <strong>Cliente</strong>.
              <br /><br />
              Acesse a aba "Protocolos" dentro da ficha de edição do cliente desejado para criar um novo protocolo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNewProtocolDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => navigate('/clientes')}>
              Ir para Clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Protocolos</h1>
          <p className="text-muted-foreground">Gestão centralizada de todos os protocolos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMetrics(!showMetrics)}>
            {showMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
          </Button>
          <Button onClick={() => setShowNewProtocolDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Novo Protocolo
          </Button>
        </div>
      </div>

      {showMetrics && stats && (
        <div className="space-y-6">
          {/* KPIs Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.totalProtocolos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">{stats.protocolosAtivos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-info/30 bg-info/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/20">
                    <CheckCircle2 className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Encerrados</p>
                    <p className="text-2xl font-bold">{stats.protocolosEncerrados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">+7 dias</p>
                    <p className="text-2xl font-bold">{stats.paradosMais7Dias}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">+30 dias</p>
                    <p className="text-2xl font-bold">{stats.paradosMais30Dias}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Risco (+45d)</p>
                    <p className="text-2xl font-bold">{stats.comRisco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(stats.valorTotalEstimado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Recebido</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(stats.valorTotalRecebido)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pendente</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(stats.valorPendente)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prejuízo</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(stats.prejuizoAcumulado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.valorTotalEstimado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Recebido</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(stats.valorTotalRecebido)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pendente</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.valorPendente)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prejuízo</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(stats.prejuizoAcumulado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos e Detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Por Tipo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Protocolos por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.porTipo}
                        dataKey="quantidade"
                        nameKey="tipo"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ tipo, quantidade }) => `${quantidade}`}
                      >
                        {stats.porTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, TIPO_PROTOCOLO_LABELS[name as TipoProtocolo] || name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto">
                  {stats.porTipo.slice(0, 5).map((item, index) => (
                    <div key={item.tipo} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                        <span className="truncate text-xs">{TIPO_PROTOCOLO_LABELS[item.tipo] || item.tipo}</span>
                      </div>
                      <span className="font-medium">{item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Natureza */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Natureza dos Protocolos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Administrativos</span>
                      <span className="font-medium">{stats.administrativos}</span>
                    </div>
                    <Progress value={(stats.administrativos / stats.totalProtocolos) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Judiciais</span>
                      <span className="font-medium">{stats.judiciais}</span>
                    </div>
                    <Progress value={(stats.judiciais / stats.totalProtocolos) * 100} className="h-2 [&>div]:bg-red-500" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.taxaSucesso.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{stats.taxaJudicializacao.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Judicialização</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Por Responsável */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Por Responsável (Ativos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.porFuncionario.slice(0, 6).map((func, index) => (
                    <div key={func.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {func.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[120px]">{func.nome}</p>
                          <p className="text-xs text-muted-foreground">{func.quantidade} protocolos</p>
                        </div>
                      </div>
                      {func.paradosMais30 > 0 && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                          {func.paradosMais30} atrasados
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filtros e Lista */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou código..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(TIPO_PROTOCOLO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_PROTOCOLO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredProtocolos?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum protocolo encontrado
          </div>
        ) : (
          filteredProtocolos?.map(protocolo => (
            <ProtocoloCard key={protocolo.id} protocolo={protocolo} />
          ))
        )}
      </div>
    </div>
  );
}
