import { 
  Users, 
  Briefcase, 
  AlertTriangle, 
  FileText, 
  Stethoscope,
  Banknote,
  Bell,
  Activity,
  Building2,
  Clock,
  CheckCircle2,
  Scale,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  Timer,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { usePainelGeralStats } from '@/hooks/usePainelGeralStats';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Stat Card Component
function StatCardMini({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default',
  subtitle,
  onClick
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
  onClick?: () => void;
}) {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Card 
      className={`${variantStyles[variant]} border cursor-pointer hover:shadow-md transition-all`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
            <Icon className={`h-5 w-5 ${iconStyles[variant]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Large Stat Card
function StatCardLarge({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className={`${color} text-white`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-sm opacity-75 mt-1">{subtitle}</p>}
          </div>
          <Icon className="h-10 w-10 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
}

// Alert Card Component
function AlertCard({ tipo, titulo, descricao, prioridade }: any) {
  const prioridadeColors: Record<string, string> = {
    critica: 'bg-red-500',
    alta: 'bg-orange-500',
    normal: 'bg-blue-500',
    baixa: 'bg-gray-500',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <div className={`w-2 h-2 mt-2 rounded-full ${prioridadeColors[prioridade] || 'bg-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{titulo}</p>
        {descricao && <p className="text-xs text-muted-foreground truncate">{descricao}</p>}
      </div>
      <Badge variant="outline" className="text-xs shrink-0">{tipo}</Badge>
    </div>
  );
}

export default function PainelGeralPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = usePainelGeralStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Painel Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Centro de Controle 360° • Atualização em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Métricas do Dia */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-3 flex items-center gap-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg">{stats?.metricasHoje.protocolosHoje || 0}</p>
                  <p className="text-xs text-muted-foreground">Protocolos</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{stats?.metricasHoje.periciasHoje || 0}</p>
                  <p className="text-xs text-muted-foreground">Perícias</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{stats?.metricasHoje.bausHoje || 0}</p>
                  <p className="text-xs text-muted-foreground">BAUs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{stats?.metricasHoje.clientesHoje || 0}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas Badge */}
          {stats && stats.alertasPendentes > 0 && (
            <div 
              className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => navigate('/alertas')}
            >
              <Bell className="h-5 w-5" />
              <span className="font-medium">{stats.alertasPendentes} alertas</span>
            </div>
          )}
        </div>
      </div>

      {/* BLOCO A - KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCardMini
          title="Total Clientes"
          value={stats?.totalClientes || 0}
          icon={Users}
          variant="primary"
          subtitle={`+${stats?.clientesNovosMes || 0} este mês`}
          onClick={() => navigate('/clients')}
        />
        <StatCardMini
          title="Processos Ativos"
          value={stats?.processosAtivos || 0}
          icon={Briefcase}
          variant="info"
          onClick={() => navigate('/processos')}
        />
        <StatCardMini
          title="Em Alerta"
          value={(stats?.processosEmAlerta || 0) + (stats?.protocolosParados7 || 0)}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => navigate('/alertas')}
        />
        <StatCardMini
          title="Críticos"
          value={(stats?.processosCriticos || 0) + (stats?.bausCriticos || 0)}
          icon={AlertCircle}
          variant="danger"
        />
        <StatCardMini
          title="Concluídos"
          value={stats?.processosConcluidos || 0}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCardMini
          title="Judiciais Ativos"
          value={stats?.processosJudiciaisAtivos || 0}
          icon={Scale}
          variant="default"
          onClick={() => navigate('/processos-judiciais')}
        />
      </div>

      {/* BLOCO B - Alertas de Processos Parados */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Processos em Alerta — Controle de Paralisação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="text-center p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">{stats?.processosJudiciaisParados7 || 0}</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">Processos +7 dias</p>
            </div>
            <div className="text-center p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{stats?.processosJudiciaisParados15 || 0}</p>
              <p className="text-sm text-orange-700 dark:text-orange-400">Processos +15 dias</p>
            </div>
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{stats?.processosJudiciaisParados30 || 0}</p>
              <p className="text-sm text-red-700 dark:text-red-400">Processos +30 dias</p>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{stats?.bausMais10Dias || 0}</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">BAU +10 dias</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats?.periciasAgendadas || 0}</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">Perícias Próximas</p>
            </div>
            <div className="text-center p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <p className="text-3xl font-bold text-cyan-600">{stats?.protocolosSemResposta || 0}</p>
              <p className="text-sm text-cyan-700 dark:text-cyan-400">Aguard. Resposta</p>
            </div>
            <div className="text-center p-4 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
              <p className="text-3xl font-bold text-rose-600">{formatCurrency(stats?.valorEmAtraso || 0).replace('R$', '').trim()}</p>
              <p className="text-sm text-rose-700 dark:text-rose-400">Financeiro Atraso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid principal 2 colunas */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* BLOCO C - BAU Dashboard */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Dashboard de BAU
            </CardTitle>
            <CardDescription>Controle de prontuários e boletins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{stats?.bausTotal || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats?.bausEmAndamento || 0}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats?.bausRecebidosMes || 0}</p>
                <p className="text-xs text-muted-foreground">Recebidos (mês)</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{stats?.bausMais10Dias || 0}</p>
                <p className="text-xs text-muted-foreground">+10 dias</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats?.bausCriticos || 0}</p>
                <p className="text-xs text-muted-foreground">Críticos (+15d)</p>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats?.bausIncompletos || 0}</p>
                <p className="text-xs text-muted-foreground">Incompletos</p>
              </div>
            </div>
            {stats?.hospitaisCriticos && stats.hospitaisCriticos > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {stats.hospitaisCriticos} hospitais críticos
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-destructive" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCO D - Protocolos */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Controle de Protocolos
            </CardTitle>
            <CardDescription>Status e alertas de protocolos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats?.protocolosAtivos || 0}</p>
                <p className="text-xs text-muted-foreground">Protocolos Ativos</p>
              </div>
              <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <p className="text-2xl font-bold text-cyan-600">{stats?.protocolosSemResposta || 0}</p>
                <p className="text-xs text-muted-foreground">Aguard. Seguradora</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                <span className="text-sm">Parados +7 dias</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">{stats?.protocolosParados7 || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span className="text-sm">Parados +15 dias</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">{stats?.protocolosParados15 || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <span className="text-sm">Parados +30 dias</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">{stats?.protocolosParados30 || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO E - Perícias */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              Controle Pericial
            </CardTitle>
            <CardDescription>Perícias e juntas médicas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats?.periciasAgendadas || 0}</p>
                <p className="text-xs text-muted-foreground">Agendadas</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats?.periciasAguardandoPagamento || 0}</p>
                <p className="text-xs text-muted-foreground">Aguard. Pgto</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats?.juntasMedicas || 0}</p>
                <p className="text-xs text-muted-foreground">Juntas Médicas</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats?.periciasClienteFaltou || 0}</p>
                <p className="text-xs text-muted-foreground">Cliente Faltou</p>
              </div>
            </div>
            
            {stats?.periciasProximas && stats.periciasProximas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Próximas 3 dias
                </p>
                {stats.periciasProximas.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="p-2 bg-muted/50 rounded text-sm flex justify-between">
                    <span className="truncate">{p.cliente}</span>
                    <span className="text-muted-foreground shrink-0">{format(new Date(p.data), 'dd/MM')} {p.hora || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCO F - Financeiro */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              Visão Financeira
            </CardTitle>
            <CardDescription>Receitas e pendências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Em Análise</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(stats?.valorTotalEmAnalise || 0)}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(stats?.valorPendente || 0)}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats?.valorRecebido || 0)}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Em Atraso</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(stats?.valorEmAtraso || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Comissões Pendentes</p>
                <p className="text-lg font-bold">{formatCurrency(stats?.comissoesPendentes || 0)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Comissões Pagas</p>
                <p className="text-lg font-bold">{formatCurrency(stats?.comissoesPagas || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Processos por Tipo - Pie Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Processos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.processosPorTipo && stats.processosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.processosPorTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.processosPorTipo.map((entry, index) => (
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

        {/* BLOCO G - Produtividade por Analista */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              Produtividade por Analista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.producaoPorAnalista && stats.producaoPorAnalista.length > 0 ? (
              <div className="space-y-3">
                {stats.producaoPorAnalista.slice(0, 6).map((analista, i) => {
                  const total = analista.processos + analista.protocolos + analista.baus;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 truncate text-sm font-medium">{analista.nome}</div>
                      <div className="flex-1">
                        <Progress 
                          value={Math.min((total / Math.max(...stats.producaoPorAnalista.map(a => a.processos + a.protocolos + a.baus))) * 100, 100)} 
                          className="h-2"
                        />
                      </div>
                      <div className="flex gap-2 text-xs shrink-0">
                        <Badge variant="outline">{analista.processos} proc</Badge>
                        <Badge variant="outline">{analista.protocolos} prot</Badge>
                        <Badge variant="outline">{analista.baus} bau</Badge>
                        {analista.atrasados > 0 && (
                          <Badge variant="destructive">{analista.atrasados} atr</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum analista com trabalho atribuído
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BLOCO H - Alertas Críticos */}
      {stats?.alertasCriticos && stats.alertasCriticos.length > 0 && (
        <Card className="shadow-card border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Bell className="h-5 w-5" />
              Alertas Críticos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {stats.alertasCriticos.map((alerta: any) => (
                <AlertCard key={alerta.id} {...alerta} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer - Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20"
          onClick={() => navigate('/clients')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-semibold">Clientes</p>
              <p className="text-sm text-muted-foreground">{stats?.totalClientes || 0} cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20"
          onClick={() => navigate('/protocolos')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold">Protocolos</p>
              <p className="text-sm text-muted-foreground">{stats?.protocolosAtivos || 0} ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20"
          onClick={() => navigate('/pericias-agendadas')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-semibold">Perícias</p>
              <p className="text-sm text-muted-foreground">{stats?.periciasAgendadas || 0} agendadas</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20"
          onClick={() => navigate('/financeiro-painel')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-semibold">Financeiro</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats?.valorRecebido || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
