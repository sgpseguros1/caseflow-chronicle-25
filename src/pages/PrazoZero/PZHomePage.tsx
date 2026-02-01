import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  RefreshCw, 
  Plus, 
  Filter,
  Inbox,
  FileText,
  Scale,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePZDashboardStats, usePZTarefas, PZTarefa } from '@/hooks/usePrazoZero';
import { format, differenceInHours, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const categoriaLabels: Record<string, string> = {
  prazo_processual: 'Prazo Processual',
  intimacao: 'Intimação',
  audiencia: 'Audiência',
  pagamento: 'Pagamento',
  cobranca: 'Cobrança',
  cliente_retorno: 'Cliente',
  documentacao_pendente: 'Documentação',
  nao_classificado: 'Não Classificado',
};

const prioridadeCores: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
};

function ContadorPrazo({ dataPrazo }: { dataPrazo?: string }) {
  if (!dataPrazo) return <span className="text-muted-foreground text-sm">Sem prazo</span>;

  const prazo = new Date(dataPrazo);
  const agora = new Date();
  const horasRestantes = differenceInHours(prazo, agora);
  const diasRestantes = differenceInDays(prazo, agora);
  const vencido = isPast(prazo);

  if (vencido) {
    return <Badge variant="destructive">VENCIDO</Badge>;
  }

  if (horasRestantes <= 2) {
    return <Badge variant="destructive">⚠️ {horasRestantes}h restantes</Badge>;
  }

  if (horasRestantes <= 12) {
    return <Badge className="bg-red-500">{horasRestantes}h restantes</Badge>;
  }

  if (diasRestantes <= 1) {
    return <Badge className="bg-orange-500">{horasRestantes}h restantes</Badge>;
  }

  if (diasRestantes <= 3) {
    return <Badge className="bg-yellow-500 text-black">{diasRestantes} dias</Badge>;
  }

  if (diasRestantes <= 7) {
    return <Badge variant="secondary">{diasRestantes} dias</Badge>;
  }

  return <span className="text-sm text-muted-foreground">{format(prazo, 'dd/MM/yyyy', { locale: ptBR })}</span>;
}

function TarefaCard({ tarefa }: { tarefa: PZTarefa }) {
  return (
    <Link to={`/prazo-zero/tarefas/${tarefa.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{tarefa.titulo}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {tarefa.categoria && (
                  <Badge variant="outline" className="text-xs">
                    {categoriaLabels[tarefa.categoria] || tarefa.categoria}
                  </Badge>
                )}
                {tarefa.cliente?.name && (
                  <span className="text-xs text-muted-foreground">
                    #{tarefa.cliente.code} - {tarefa.cliente.name}
                  </span>
                )}
              </div>
              {tarefa.responsavel?.name && (
                <p className="text-xs text-muted-foreground mt-1">
                  👤 {tarefa.responsavel.name}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn('text-xs', prioridadeCores[tarefa.prioridade])}>
                {tarefa.prioridade}
              </Badge>
              <ContadorPrazo dataPrazo={tarefa.data_prazo} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PZHomePage() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = usePZDashboardStats();
  const { data: tarefasUrgentes, isLoading: tarefasLoading } = usePZTarefas({ status: 'pendente' });

  // Separar tarefas por urgência
  const agora = new Date();
  const em48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000);
  const em7d = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const urgentes = tarefasUrgentes?.filter(t => 
    t.data_prazo && new Date(t.data_prazo) <= em48h
  ).slice(0, 5) || [];

  const proximos7d = tarefasUrgentes?.filter(t => 
    t.data_prazo && new Date(t.data_prazo) > em48h && new Date(t.data_prazo) <= em7d
  ).slice(0, 5) || [];

  const pagamentos = tarefasUrgentes?.filter(t => 
    t.categoria === 'pagamento'
  ).slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PRAZO ZERO</h1>
          <p className="text-muted-foreground">
            Olá, {profile?.name?.split(' ')[0]}! Aqui está seu painel de hoje.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <Link to="/prazo-zero/tarefas/nova">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Urgente (48h)
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.urgentes || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Próximos 7 dias
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.proximos7d || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              Pendências Gerais
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.pendentes || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Pagamentos
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.pagamentos || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-purple-500" />
              Triagem Pendente
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.triagem || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/prazo-zero/tarefas">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Ver Tarefas</p>
                <p className="text-sm text-muted-foreground">Lista completa</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/prazo-zero/agenda">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Agenda</p>
                <p className="text-sm text-muted-foreground">Calendário</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/prazo-zero/triagem">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Inbox className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Triagem</p>
                <p className="text-sm text-muted-foreground">E-mails pendentes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/prazo-zero/relatorios">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Relatórios</p>
                <p className="text-sm text-muted-foreground">Produtividade</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Task Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Urgentes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                🔴 Urgente (até 48h)
              </CardTitle>
              <Link to="/prazo-zero/tarefas?filtro=urgente">
                <Button variant="ghost" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : urgentes.length > 0 ? (
              urgentes.map(tarefa => <TarefaCard key={tarefa.id} tarefa={tarefa} />)
            ) : (
              <p className="text-center text-muted-foreground py-6">
                ✅ Nenhuma tarefa urgente!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Próximos 7 dias */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                🟠 Próximos 7 dias
              </CardTitle>
              <Link to="/prazo-zero/tarefas?filtro=7dias">
                <Button variant="ghost" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : proximos7d.length > 0 ? (
              proximos7d.map(tarefa => <TarefaCard key={tarefa.id} tarefa={tarefa} />)
            ) : (
              <p className="text-center text-muted-foreground py-6">
                Nenhuma tarefa nos próximos 7 dias
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                💰 Pagamentos
              </CardTitle>
              <Link to="/prazo-zero/tarefas?categoria=pagamento">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : pagamentos.length > 0 ? (
              pagamentos.map(tarefa => <TarefaCard key={tarefa.id} tarefa={tarefa} />)
            ) : (
              <p className="text-center text-muted-foreground py-6">
                Nenhum pagamento pendente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Extras */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Processos com Pendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/processos-judiciais?filtro=pendencias">
              <Button variant="outline" className="w-full">
                Ver processos pendentes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Andamentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/processos-judiciais?tab=andamentos">
              <Button variant="outline" className="w-full">
                Ver andamentos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
