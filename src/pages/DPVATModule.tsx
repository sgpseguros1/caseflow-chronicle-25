import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, FileText, FolderOpen, Tag, Clock, DollarSign, BarChart3, History,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, FileSearch, Briefcase
} from 'lucide-react';
import { DPVATStatCard } from '@/components/dpvat/DPVATStatCard';
import { DPVATProcessesTable } from '@/components/dpvat/DPVATProcessesTable';
import { DPVATAlertsList } from '@/components/dpvat/DPVATAlertsList';
import { DPVATTimeline } from '@/components/dpvat/DPVATTimeline';
import { 
  dpvatProcesses, 
  dpvatAlerts, 
  dpvatTimeline, 
  dpvatDashboardStats,
  dpvatClients,
  dpvatTags,
  dpvatDocuments 
} from '@/data/dpvatMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function DPVATModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const stats = dpvatDashboardStats;

  const statusChartData = [
    { name: 'Doc. Pendente', value: stats.processesByStatus.DOCUMENTACAO_PENDENTE, color: '#f59e0b' },
    { name: 'Protocolado', value: stats.processesByStatus.ADMINISTRATIVO_PROTOCOLADO, color: '#0ea5e9' },
    { name: 'Judicial', value: stats.processesByStatus.JUDICIAL_PROTOCOLADO, color: '#8b5cf6' },
    { name: 'Perícia', value: stats.processesByStatus.EM_PERICIA, color: '#f97316' },
    { name: 'Finalizado', value: stats.processesByStatus.FINALIZADO_ADMINISTRATIVO, color: '#10b981' },
  ].filter(d => d.value > 0);

  const responsibleChartData = stats.processesByResponsible.map(r => ({
    name: r.name,
    total: r.count,
    parados: r.stoppedCount,
  }));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Módulo DPVAT</h1>
        <p className="text-muted-foreground">Gestão completa de processos DPVAT</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="processos" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="etiquetas" className="gap-2">
            <Tag className="h-4 w-4" />
            Etiquetas
          </TabsTrigger>
          <TabsTrigger value="prazos" className="gap-2">
            <Clock className="h-4 w-4" />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <History className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <DPVATStatCard
              title="Total Clientes"
              value={stats.totalClients}
              icon={Users}
              variant="primary"
            />
            <DPVATStatCard
              title="Cadastro Incompleto"
              value={stats.incompleteRegistration}
              icon={AlertTriangle}
              variant="warning"
            />
            <DPVATStatCard
              title="Docs Pendentes"
              value={stats.pendingDocuments}
              icon={FileSearch}
              variant="warning"
            />
            <DPVATStatCard
              title="Em Análise ADM"
              value={stats.adminInAnalysis + stats.adminProtocoled}
              icon={FileText}
              variant="default"
            />
            <DPVATStatCard
              title="Em Perícia"
              value={stats.inExpertise}
              icon={Briefcase}
              variant="warning"
            />
            <DPVATStatCard
              title="Judicializados"
              value={stats.judicialProtocoled}
              icon={Briefcase}
              variant="primary"
            />
            <DPVATStatCard
              title="Parados +30 dias"
              value={stats.stoppedOver30Days}
              icon={AlertTriangle}
              variant="danger"
            />
            <DPVATStatCard
              title="Finalizados"
              value={stats.finalizedAdmin + stats.finalizedJudicial}
              icon={CheckCircle}
              variant="success"
            />
            <DPVATStatCard
              title="Valor Estimado"
              value={formatCurrency(stats.estimatedTotal)}
              icon={TrendingUp}
              variant="primary"
            />
            <DPVATStatCard
              title="Valor Recebido"
              value={formatCurrency(stats.receivedTotal)}
              icon={DollarSign}
              variant="success"
            />
          </div>

          {/* Charts and Alerts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Responsible Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={responsibleChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(214, 90%, 44%)" name="Total" radius={4} />
                    <Bar dataKey="parados" fill="hsl(0, 84%, 60%)" name="Parados" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alerts */}
            <DPVATAlertsList alerts={dpvatAlerts} maxItems={4} />
          </div>

          {/* Recent Processes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Processos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DPVATProcessesTable processes={dpvatProcesses.slice(0, 5)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Clientes DPVAT</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Lista de {dpvatClients.length} clientes cadastrados.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processos Tab */}
        <TabsContent value="processos">
          <DPVATProcessesTable processes={dpvatProcesses} />
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{dpvatDocuments.length} documentos anexados.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Etiquetas Tab */}
        <TabsContent value="etiquetas">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {dpvatTags.map(tag => (
                  <span key={tag.id} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prazos Tab */}
        <TabsContent value="prazos">
          <DPVATAlertsList alerts={dpvatAlerts} maxItems={20} />
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro">
          <div className="grid md:grid-cols-3 gap-4">
            <DPVATStatCard title="Valor Estimado" value={formatCurrency(stats.estimatedTotal)} icon={TrendingUp} variant="primary" />
            <DPVATStatCard title="Valor Recebido" value={formatCurrency(stats.receivedTotal)} icon={DollarSign} variant="success" />
            <DPVATStatCard title="Valor Pendente" value={formatCurrency(stats.pendingTotal)} icon={TrendingDown} variant="warning" />
          </div>
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="relatorios">
          <Card>
            <CardHeader><CardTitle>Relatórios Gerenciais</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Em desenvolvimento</p></CardContent>
          </Card>
        </TabsContent>

        {/* Auditoria Tab */}
        <TabsContent value="auditoria">
          <DPVATTimeline events={dpvatTimeline} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
