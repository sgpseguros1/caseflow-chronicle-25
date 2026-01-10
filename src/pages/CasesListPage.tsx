import { useState } from 'react';
import { CaseType, CASE_TYPE_LABELS, CASE_TYPE_ICONS, MacroStatus, STATUS_LABELS } from '@/types';
import { mockCases } from '@/data/mockData';
import { CasesTable } from '@/components/cases/CasesTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CasesListPageProps {
  caseType?: CaseType;
}

export default function CasesListPage({ caseType }: CasesListPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases = mockCases.filter((c) => {
    const matchesType = !caseType || c.type === caseType;
    const matchesSearch =
      !search ||
      c.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.macroStatus === statusFilter;
    return matchesType && matchesSearch && matchesStatus;
  });

  const pageTitle = caseType ? CASE_TYPE_LABELS[caseType] : 'Todos os Processos';
  const pageIcon = caseType ? CASE_TYPE_ICONS[caseType] : '📁';

  // Quick stats for this type
  const stats = {
    total: filteredCases.length,
    protocolados: filteredCases.filter((c) => c.macroStatus === 'PROTOCOLADO').length,
    pendentes: filteredCases.filter((c) =>
      ['EXIGENCIA', 'PERICIA', 'A_PROTOCOLAR'].includes(c.macroStatus)
    ).length,
    concluidos: filteredCases.filter((c) =>
      ['CONCLUIDO_EXITO', 'ENCERRADO'].includes(c.macroStatus)
    ).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <span className="text-2xl">{pageIcon}</span>
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} processos encontrados
          </p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-info">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-info">{stats.protocolados}</p>
            <p className="text-sm text-muted-foreground">Protocolados</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-warning">{stats.pendentes}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-success">{stats.concluidos}</p>
            <p className="text-sm text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Table */}
      <CasesTable cases={filteredCases} />
    </div>
  );
}
