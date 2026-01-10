import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMetricasDiarias } from '@/hooks/useMetricasDiarias';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { Plus, Search, Users, FileText, FolderOpen, Clock, BarChart3 } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MetricasDiariasPage() {
  const navigate = useNavigate();
  const { data: metricas, isLoading } = useMetricasDiarias();
  const { data: funcionarios } = useFuncionarios();
  const [search, setSearch] = useState('');
  const [funcionarioFilter, setFuncionarioFilter] = useState('all');
  const [periodoFilter, setPeriodoFilter] = useState('all');

  const filteredMetricas = metricas?.filter((m) => {
    const funcionarioNome = m.funcionarios?.nome?.toLowerCase() || '';
    const matchSearch = funcionarioNome.includes(search.toLowerCase()) ||
      m.descricao?.toLowerCase().includes(search.toLowerCase());
    
    const matchFuncionario = funcionarioFilter === 'all' || m.funcionario_id === funcionarioFilter;
    
    let matchPeriodo = true;
    if (periodoFilter === 'mes_atual') {
      const dataMetrica = parseISO(m.data);
      const hoje = new Date();
      matchPeriodo = isWithinInterval(dataMetrica, {
        start: startOfMonth(hoje),
        end: endOfMonth(hoje)
      });
    }
    
    return matchSearch && matchFuncionario && matchPeriodo;
  });

  // Calcular totais
  const totais = filteredMetricas?.reduce((acc, m) => ({
    clientes: acc.clientes + (m.clientes_atendidos || 0),
    processos: acc.processos + (m.processos_movidos || 0),
    pastas: acc.pastas + (m.pastas_liberadas || 0),
  }), { clientes: 0, processos: 0, pastas: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas Diárias</h1>
          <p className="text-muted-foreground">Registro de produtividade dos funcionários</p>
        </div>
        <Button onClick={() => navigate('/metricas/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Métrica
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMetricas?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.clientes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Movidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.processos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pastas Liberadas</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.pastas || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por funcionário ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={funcionarioFilter} onValueChange={setFuncionarioFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {funcionarios?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="mes_atual">Mês atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-center">Processos</TableHead>
                <TableHead className="text-center">Pastas</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Pendências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : filteredMetricas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma métrica registrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMetricas?.map((metrica) => (
                  <TableRow key={metrica.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(metrica.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{metrica.funcionarios?.nome || '-'}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 font-medium">
                        {metrica.clientes_atendidos || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-green-700 font-medium">
                        {metrica.processos_movidos || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-700 font-medium">
                        {metrica.pastas_liberadas || 0}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {metrica.descricao || '-'}
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      {metrica.pendencias ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{metrica.pendencias}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
