import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Users,
  LayoutGrid,
  List,
  Plus,
  DollarSign,
  BarChart3,
  Info
} from 'lucide-react';
import { useDashboardProtocolos } from '@/hooks/useDashboardProtocolos';
import { ProtocolosKanbanBoard } from '@/components/protocolos/ProtocolosKanbanBoard';
import { ProtocoloCard } from '@/components/protocolos/ProtocoloCard';
import { TIPO_PROTOCOLO_LABELS, STATUS_PROTOCOLO_LABELS } from '@/types/protocolo';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProtocolosDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardProtocolos();
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [showNewProtocolDialog, setShowNewProtocolDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Prepare chart data
  const porTipoData = stats?.porTipo.slice(0, 6) || [];
  const porStatusData = stats?.porStatus.slice(0, 6).map(s => ({
    name: STATUS_PROTOCOLO_LABELS[s.status] || s.status,
    value: s.quantidade,
  })) || [];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#e11d48', '#f59e0b', '#06b6d4'];

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Dashboard de Protocolos
          </h1>
          <p className="text-muted-foreground">Centro de inteligência e controle de protocolos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')}>
            <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
          </Button>
          <Button variant={viewMode === 'lista' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('lista')}>
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
          <Button onClick={() => setShowNewProtocolDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Novo Protocolo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProtocolos || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.protocolosAtivos || 0}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats?.paradosMais7Dias || 0}</p>
                <p className="text-xs text-muted-foreground">+7 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats?.paradosMais15Dias || 0}</p>
                <p className="text-xs text-muted-foreground">+15 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats?.paradosMais30Dias || 0}</p>
                <p className="text-xs text-muted-foreground">+30 dias</p>
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
                <p className="text-2xl font-bold text-green-600">{stats?.pagos || 0}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats?.valorPendente || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Por Tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Protocolos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porTipoData.map(t => ({ name: TIPO_PROTOCOLO_LABELS[t.tipo], value: t.quantidade }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {porTipoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Protocolos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porStatusData.slice(0, 5)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por Responsável */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats?.porFuncionario.slice(0, 6).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{f.nome}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{f.quantidade}</Badge>
                    {f.paradosMais30 > 0 && (
                      <Badge variant="destructive" className="text-xs">{f.paradosMais30} atrasados</Badge>
                    )}
                  </div>
                </div>
              ))}
              {(!stats?.porFuncionario || stats.porFuncionario.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban / Lista */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'lista')}>
        <TabsContent value="kanban" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Visão Kanban por Tema</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.protocolos && stats.protocolos.length > 0 ? (
                <ProtocolosKanbanBoard protocolos={stats.protocolos} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum protocolo cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lista de Protocolos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {stats?.protocolos
                  .filter(p => !['pago', 'encerrado_sucesso', 'encerrado_prejuizo', 'arquivado'].includes(p.status))
                  .slice(0, 20)
                  .map(protocolo => (
                    <ProtocoloCard key={protocolo.id} protocolo={protocolo as any} />
                  ))}
                {(!stats?.protocolos || stats.protocolos.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum protocolo ativo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas */}
      {stats?.alertasPendentes && stats.alertasPendentes.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Alertas Ativos ({stats.alertasAtivos})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.alertasPendentes.slice(0, 5).map((alerta: any) => (
                <div key={alerta.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{alerta.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Protocolo #{alerta.protocolo?.codigo} - {alerta.protocolo?.cliente?.name}
                    </p>
                  </div>
                  <Badge variant={alerta.nivel === 'urgente' ? 'destructive' : 'secondary'}>
                    {alerta.nivel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
