import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  UserX, 
  Eye,
  ExternalLink,
  FileWarning,
  TrendingDown,
  Timer,
  User,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProtocolos, useProtocoloAlertas, useResolverProtocoloAlerta } from '@/hooks/useProtocolos';
import { useAuth } from '@/hooks/useAuth';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { TIPO_PROTOCOLO_LABELS, STATUS_PROTOCOLO_LABELS } from '@/types/protocolo';
import { toast } from 'sonner';

// Helper function to calculate days stopped
const calcularDiasParado = (dataUltimaMovimentacao: string | null) => {
  if (!dataUltimaMovimentacao) return 0;
  return differenceInDays(new Date(), parseISO(dataUltimaMovimentacao));
};

// Alert severity based on days stopped
const getAlertaNivel = (dias: number) => {
  if (dias >= 60) return { nivel: 'critico_maximo', cor: 'bg-black text-white', label: 'CRÍTICO MÁXIMO' };
  if (dias >= 45) return { nivel: 'critico', cor: 'bg-red-600 text-white', label: 'CRÍTICO' };
  if (dias >= 30) return { nivel: 'atencao', cor: 'bg-orange-500 text-white', label: 'ATENÇÃO' };
  return { nivel: 'normal', cor: 'bg-green-500 text-white', label: 'NORMAL' };
};

export default function AlertasCriticosPage() {
  const { data: protocolos, isLoading: loadingProtocolos } = useProtocolos();
  const { data: alertas, isLoading: loadingAlertas } = useProtocoloAlertas();
  const { data: funcionarios } = useFuncionarios();
  const { isAdminOrGestor } = useAuth();
  const resolverAlerta = useResolverProtocoloAlerta();

  const [tab, setTab] = useState('tempo');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroDias, setFiltroDias] = useState<string>('todos');

  // ========== BLOCO 1: ALERTAS DE TEMPO ==========
  const alertasTempo = useMemo(() => {
    if (!protocolos) return [];
    
    return protocolos
      .filter(p => {
        const dias = p.dias_parado || 0;
        if (dias < 30) return false;
        
        // Apply filters
        if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false;
        if (filtroResponsavel !== 'todos' && p.funcionario_id !== filtroResponsavel) return false;
        if (filtroDias !== 'todos') {
          if (filtroDias === '30' && (dias < 30 || dias >= 45)) return false;
          if (filtroDias === '45' && (dias < 45 || dias >= 60)) return false;
          if (filtroDias === '60' && dias < 60) return false;
        }
        
        return true;
      })
      .sort((a, b) => (b.dias_parado || 0) - (a.dias_parado || 0));
  }, [protocolos, filtroTipo, filtroResponsavel, filtroDias]);

  // ========== BLOCO 2: ALERTAS DE RISCO OPERACIONAL ==========
  const alertasRisco = useMemo(() => {
    if (!protocolos) return [];
    
    const riscos: Array<{
      protocolo: typeof protocolos[0];
      tipoRisco: string;
      diasEmRisco: number;
      acaoSugerida: string;
    }> = [];

    protocolos.forEach(p => {
      // Protocolo sem responsável
      if (!p.funcionario_id) {
        riscos.push({
          protocolo: p,
          tipoRisco: 'Sem Responsável',
          diasEmRisco: p.dias_parado || 0,
          acaoSugerida: 'Atribuir um responsável imediatamente'
        });
      }

      // SLA estourado
      if (p.sla_dias && p.dias_parado && p.dias_parado > p.sla_dias) {
        riscos.push({
          protocolo: p,
          tipoRisco: 'SLA Estourado',
          diasEmRisco: (p.dias_parado || 0) - (p.sla_dias || 0),
          acaoSugerida: 'Verificar urgentemente e atualizar status'
        });
      }
    });

    return riscos.sort((a, b) => b.diasEmRisco - a.diasEmRisco);
  }, [protocolos]);

  // ========== BLOCO 3: ALERTAS FINANCEIROS ==========
  const alertasFinanceiros = useMemo(() => {
    if (!protocolos) return [];
    
    return protocolos
      .filter(p => {
        // Protocolos com valor estimado alto e parados
        const temValorAlto = (p.financeiro?.valor_estimado || 0) > 10000;
        const estaPaado = (p.dias_parado || 0) > 30;
        const temPrejuizo = (p.financeiro?.prejuizo_registrado || 0) > 0;
        
        return (temValorAlto && estaPaado) || temPrejuizo;
      })
      .sort((a, b) => (b.financeiro?.valor_estimado || 0) - (a.financeiro?.valor_estimado || 0));
  }, [protocolos]);

  // ========== BLOCO 4: ALERTAS DE RESPONSABILIDADE ==========
  const alertasResponsabilidade = useMemo(() => {
    if (!protocolos || !funcionarios) return [];

    const responsaveisMap = new Map<string, {
      funcionario: typeof funcionarios[0] | undefined;
      protocolosCriticos: number;
      tipos: Set<string>;
      tempoMedioParado: number;
    }>();

    protocolos.forEach(p => {
      if (!p.funcionario_id) return;
      if ((p.dias_parado || 0) < 30) return; // Only critical

      const atual = responsaveisMap.get(p.funcionario_id) || {
        funcionario: funcionarios.find(f => f.id === p.funcionario_id),
        protocolosCriticos: 0,
        tipos: new Set<string>(),
        tempoMedioParado: 0
      };

      atual.protocolosCriticos++;
      atual.tipos.add(p.tipo);
      atual.tempoMedioParado = ((atual.tempoMedioParado * (atual.protocolosCriticos - 1)) + (p.dias_parado || 0)) / atual.protocolosCriticos;

      responsaveisMap.set(p.funcionario_id, atual);
    });

    // Protocolos sem responsável
    const semResponsavel = protocolos.filter(p => !p.funcionario_id && (p.dias_parado || 0) >= 30).length;
    if (semResponsavel > 0) {
      responsaveisMap.set('sem-responsavel', {
        funcionario: undefined,
        protocolosCriticos: semResponsavel,
        tipos: new Set(['Variados']),
        tempoMedioParado: 0
      });
    }

    return Array.from(responsaveisMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.protocolosCriticos - a.protocolosCriticos);
  }, [protocolos, funcionarios]);

  // ========== CONTADORES PARA MINI-RESUMO ==========
  const contadores = useMemo(() => {
    if (!protocolos) return { criticos: 0, parados30: 0, dinheiroParado: 0, riscosAtivos: 0, gargalos: 0 };

    const criticos = protocolos.filter(p => (p.dias_parado || 0) >= 45).length;
    const parados30 = protocolos.filter(p => (p.dias_parado || 0) >= 30).length;
    const dinheiroParado = protocolos
      .filter(p => (p.dias_parado || 0) >= 30)
      .reduce((acc, p) => acc + (p.financeiro?.valor_estimado || 0), 0);
    const riscosAtivos = alertasRisco.length;
    const gargalos = alertasResponsabilidade.filter(a => a.protocolosCriticos >= 5).length;

    return { criticos, parados30, dinheiroParado, riscosAtivos, gargalos };
  }, [protocolos, alertasRisco, alertasResponsabilidade]);

  const handleResolverAlerta = (alertaId: string) => {
    if (!isAdminOrGestor) {
      toast.error('Apenas gestores podem resolver alertas');
      return;
    }
    
    resolverAlerta.mutate({ id: alertaId, observacao: 'Alerta tratado pelo gestor' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loadingProtocolos || loadingAlertas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          Painel de Alertas Críticos
        </h1>
        <p className="text-muted-foreground">Centro de vigilância do sistema — ações obrigatórias</p>
      </div>

      {/* Mini-Resumo Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{contadores.criticos}</p>
                <p className="text-xs text-muted-foreground">Alertas Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{contadores.parados30}</p>
                <p className="text-xs text-muted-foreground">Protocolos +30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(contadores.dinheiroParado)}</p>
                <p className="text-xs text-muted-foreground">Dinheiro Parado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                <FileWarning className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{contadores.riscosAtivos}</p>
                <p className="text-xs text-muted-foreground">Riscos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/50">
                <UserX className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{contadores.gargalos}</p>
                <p className="text-xs text-muted-foreground">Gargalos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo de Protocolo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_PROTOCOLO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Faixa de Dias</label>
              <Select value={filtroDias} onValueChange={setFiltroDias}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="30">30-44 dias</SelectItem>
                  <SelectItem value="45">45-59 dias</SelectItem>
                  <SelectItem value="60">60+ dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tempo" className="gap-2">
            <Clock className="h-4 w-4" />
            Tempo ({alertasTempo.length})
          </TabsTrigger>
          <TabsTrigger value="risco" className="gap-2">
            <FileWarning className="h-4 w-4" />
            Risco ({alertasRisco.length})
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro ({alertasFinanceiros.length})
          </TabsTrigger>
          <TabsTrigger value="responsabilidade" className="gap-2">
            <User className="h-4 w-4" />
            Responsabilidade ({alertasResponsabilidade.length})
          </TabsTrigger>
        </TabsList>

        {/* BLOCO 1: ALERTAS DE TEMPO */}
        <TabsContent value="tempo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-destructive" />
                Alertas de Tempo (Protocolos Parados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertasTempo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum protocolo parado há mais de 30 dias</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nível</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dias Parado</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Última Mov.</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasTempo.map(protocolo => {
                      const nivel = getAlertaNivel(protocolo.dias_parado || 0);
                      return (
                        <TableRow key={protocolo.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Badge className={nivel.cor}>{nivel.label}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {protocolo.cliente?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{TIPO_PROTOCOLO_LABELS[protocolo.tipo as keyof typeof TIPO_PROTOCOLO_LABELS]}</Badge>
                          </TableCell>
                          <TableCell>{STATUS_PROTOCOLO_LABELS[protocolo.status as keyof typeof STATUS_PROTOCOLO_LABELS]}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${(protocolo.dias_parado || 0) >= 60 ? 'text-black dark:text-white' : (protocolo.dias_parado || 0) >= 45 ? 'text-red-600' : 'text-orange-500'}`}>
                              {protocolo.dias_parado} dias
                            </span>
                          </TableCell>
                          <TableCell>{protocolo.funcionario?.nome || <span className="text-red-500">Sem responsável</span>}</TableCell>
                          <TableCell>
                            {protocolo.data_ultima_movimentacao 
                              ? format(parseISO(protocolo.data_ultima_movimentacao), 'dd/MM/yyyy', { locale: ptBR })
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/protocolos/${protocolo.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Protocolo
                                </Link>
                              </Button>
                              <Button size="sm" variant="default" asChild>
                                <Link to={`/clientes/${protocolo.cliente_id}`}>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Cliente
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCO 2: ALERTAS DE RISCO OPERACIONAL */}
        <TabsContent value="risco" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-purple-600" />
                Alertas de Risco Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertasRisco.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum risco operacional identificado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Risco</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Dias em Risco</TableHead>
                      <TableHead>Ação Sugerida</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasRisco.map((risco, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="destructive">{risco.tipoRisco}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {risco.protocolo.cliente?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">#{risco.protocolo.codigo}</span>
                        </TableCell>
                        <TableCell>
                          {risco.protocolo.funcionario?.nome || <span className="text-red-500">Sem responsável</span>}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">{risco.diasEmRisco} dias</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {risco.acaoSugerida}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="default" asChild>
                            <Link to={`/clientes/${risco.protocolo.cliente_id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Ir para Cliente
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCO 3: ALERTAS FINANCEIROS */}
        <TabsContent value="financeiro" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-amber-600" />
                Alertas Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertasFinanceiros.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta financeiro ativo</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Estimado</TableHead>
                      <TableHead>Valor Parado</TableHead>
                      <TableHead>Dias Aguardando</TableHead>
                      <TableHead>Status Financeiro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasFinanceiros.map(protocolo => (
                      <TableRow key={protocolo.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {protocolo.cliente?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{TIPO_PROTOCOLO_LABELS[protocolo.tipo as keyof typeof TIPO_PROTOCOLO_LABELS]}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-amber-600">
                          {formatCurrency(protocolo.financeiro?.valor_estimado || 0)}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {formatCurrency((protocolo.financeiro?.valor_estimado || 0) - (protocolo.financeiro?.valor_recebido || 0))}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{protocolo.dias_parado} dias</span>
                        </TableCell>
                        <TableCell>
                          {(protocolo.financeiro?.prejuizo_registrado || 0) > 0 ? (
                            <Badge variant="destructive">Prejuízo Registrado</Badge>
                          ) : (
                            <Badge variant="secondary">Aguardando</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="default" asChild>
                            <Link to={`/clientes/${protocolo.cliente_id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Cliente
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCO 4: ALERTAS DE RESPONSABILIDADE */}
        <TabsContent value="responsabilidade" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-rose-600" />
                Alertas de Responsabilidade (Gargalos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertasResponsabilidade.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum gargalo de responsabilidade identificado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Protocolos Críticos</TableHead>
                      <TableHead>Tipos de Protocolo</TableHead>
                      <TableHead>Tempo Médio Parado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasResponsabilidade.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {item.id === 'sem-responsavel' ? (
                            <span className="text-red-500 font-bold">⚠️ SEM RESPONSÁVEL</span>
                          ) : (
                            item.funcionario?.nome || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.protocolosCriticos >= 5 ? 'destructive' : 'secondary'}>
                            {item.protocolosCriticos} protocolos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {Array.from(item.tipos).slice(0, 3).map(tipo => (
                            <Badge key={tipo} variant="outline" className="mr-1 mb-1">
                              {TIPO_PROTOCOLO_LABELS[tipo as keyof typeof TIPO_PROTOCOLO_LABELS] || tipo}
                            </Badge>
                          ))}
                          {item.tipos.size > 3 && <Badge variant="outline">+{item.tipos.size - 3}</Badge>}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{Math.round(item.tempoMedioParado)} dias</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdminOrGestor && item.id !== 'sem-responsavel' && (
                            <Button size="sm" variant="outline">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Redistribuir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Notice */}
      {!isAdminOrGestor && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Você está no modo visualização. Apenas gestores podem resolver ou redistribuir alertas.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
