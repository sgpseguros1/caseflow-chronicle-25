import { 
  Briefcase, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Banknote,
  TrendingUp,
  Users,
  Scale,
  Bell,
  Building2
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAlertasPendentes } from '@/hooks/useAlertas';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS: Record<string, string> = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'aguardando_documentos': 'Aguardando Docs',
  'pago': 'Pago',
  'finalizado': 'Finalizado',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  'critica': 'bg-red-500',
  'alta': 'bg-orange-500',
  'normal': 'bg-blue-500',
  'baixa': 'bg-gray-500',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: alertas } = useAlertasPendentes();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do escritório • Dados em tempo real
          </p>
        </div>
        {alertas && alertas.length > 0 && (
          <div 
            className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg cursor-pointer hover:bg-destructive/20 transition-colors"
            onClick={() => navigate('/alertas')}
          >
            <Bell className="h-5 w-5" />
            <span className="font-medium">{alertas.length} alertas pendentes</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total de Processos"
          value={stats?.totalProcessos || 0}
          icon={<Briefcase className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="Judiciais"
          value={stats?.judiciais || 0}
          icon={<Scale className="h-6 w-6" />}
          variant="info"
        />
        <StatCard
          title="Administrativos"
          value={stats?.administrativos || 0}
          icon={<FileCheck className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Pendentes"
          value={stats?.pendentes || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
        />
        <StatCard
          title="Pagos"
          value={stats?.pagos || 0}
          icon={<Banknote className="h-6 w-6" />}
          variant="success"
        />
        <StatCard
          title="Finalizados"
          value={stats?.finalizados || 0}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Financial Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Valor Total Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.valorTotalEstimado || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Valor Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.valorTotalRecebido || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Valor Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.valorPendente || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Processos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.porTipo && stats.porTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.porTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum processo cadastrado
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-muted-foreground" />
              Processos por Advogado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.porAdvogado && stats.porAdvogado.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.porAdvogado} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="processos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum advogado vinculado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              Processos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.processosRecentes && stats.processosRecentes.length > 0 ? (
                stats.processosRecentes.map((processo) => (
                  <div 
                    key={processo.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/processos`)}
                  >
                    <div>
                      <p className="font-medium">{processo.numero}</p>
                      <p className="text-sm text-muted-foreground">{processo.cliente}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{processo.tipo}</Badge>
                      <Badge variant={processo.status === 'pago' ? 'default' : 'secondary'}>
                        {STATUS_LABELS[processo.status] || processo.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum processo cadastrado ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.porSeguradora && stats.porSeguradora.length > 0 ? (
                stats.porSeguradora.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[150px]">{seg.name}</span>
                    <Badge variant="outline">{seg.processos} processos</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma seguradora vinculada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Section */}
      {alertas && alertas.length > 0 && (
        <Card className="shadow-card border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-destructive">
              <Bell className="h-5 w-5" />
              Alertas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.slice(0, 5).map((alerta) => (
                <div 
                  key={alerta.id} 
                  className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${PRIORIDADE_COLORS[alerta.prioridade]}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alerta.titulo}</p>
                    {alerta.descricao && (
                      <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(alerta.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
