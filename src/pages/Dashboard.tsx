import { 
  Briefcase, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Banknote,
  TrendingUp,
  Users
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { CasesByTypeChart } from '@/components/dashboard/CasesByTypeChart';
import { ProductionChart } from '@/components/dashboard/ProductionChart';
import { RecentCases } from '@/components/dashboard/RecentCases';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDashboardStats, mockCases, mockTasks } from '@/data/mockData';

export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do escritório • Atualizado agora
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total de Processos"
          value={stats.totalCases}
          icon={<Briefcase className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="Protocolados"
          value={stats.protocolados}
          icon={<FileCheck className="h-6 w-6" />}
          variant="info"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Em Andamento"
          value={stats.emAndamento}
          icon={<Clock className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
        />
        <StatCard
          title="Pagos"
          value={stats.pagos}
          icon={<Banknote className="h-6 w-6" />}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Finalizados"
          value={stats.finalizados}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="default"
        />
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
            <CasesByTypeChart data={stats.byType} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Produção por Analista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionChart data={stats.byAnalyst} />
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
            <RecentCases cases={mockCases.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Tarefas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingTasks tasks={mockTasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
