import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Coins,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  History,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import {
  useComissoes,
  useCreateComissao,
  useUpdateComissaoStatus,
  useDeleteComissao,
  useComissoesStats,
  useComissaoHistorico,
  useComissoesPagas,
  usePagarComissao,
  TIPOS_INDENIZACAO,
  STATUS_COMISSAO,
  Comissao,
} from '@/hooks/useComissoes';
import { useAuth } from '@/hooks/useAuth';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function ComissoesPage() {
  const { isAdmin, isAdminOrGestor } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPagarDialog, setShowPagarDialog] = useState(false);
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [deleteMotivo, setDeleteMotivo] = useState('');
  const [beneficiarioNome, setBeneficiarioNome] = useState('');

  // Form state
  const [formClienteId, setFormClienteId] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formDataAcidente, setFormDataAcidente] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');

  const { data: comissoes, isLoading } = useComissoes({
    status: statusFilter || undefined,
    tipo: tipoFilter || undefined,
  });
  const { data: clients } = useClients();
  const { data: stats } = useComissoesStats();
  const { data: historico } = useComissaoHistorico(selectedComissao?.id);
  const { data: comissoesPagas } = useComissoesPagas();

  const createComissao = useCreateComissao();
  const updateStatus = useUpdateComissaoStatus();
  const deleteComissao = useDeleteComissao();
  const pagarComissao = usePagarComissao();

  // Verificar permissão - apenas Admin e Gestor podem acessar o conteúdo
  // Esta verificação deve vir DEPOIS de todos os hooks
  if (!isAdminOrGestor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground max-w-md">
          Você não possui permissão para acessar este módulo. 
          Entre em contato com o administrador se precisar de acesso.
        </p>
      </div>
    );
  }

  // Filter comissões by search term
  const filteredComissoes = comissoes?.filter((c) => {
    const clientName = c.clients?.name?.toLowerCase() || '';
    const tipo = c.tipo_indenizacao?.toLowerCase() || '';
    const cadastradoPor = c.created_by_profile?.name?.toLowerCase() || '';
    return (
      clientName.includes(searchTerm.toLowerCase()) ||
      tipo.includes(searchTerm.toLowerCase()) ||
      cadastradoPor.includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateComissao = async () => {
    if (!formClienteId || !formTipo || !formDataAcidente) {
      return;
    }

    await createComissao.mutateAsync({
      cliente_id: formClienteId,
      tipo_indenizacao: formTipo,
      data_acidente: formDataAcidente,
      valor: formValor ? parseFloat(formValor) : undefined,
      observacoes: formObservacoes || undefined,
    });

    setShowNewDialog(false);
    resetForm();
  };

  const handlePagarComissao = async () => {
    if (!selectedComissao || !beneficiarioNome.trim()) return;

    await pagarComissao.mutateAsync({
      id: selectedComissao.id,
      beneficiario_nome: beneficiarioNome.trim(),
    });

    setShowPagarDialog(false);
    setSelectedComissao(null);
    setBeneficiarioNome('');
  };

  const handleUpdateStatus = async (comissao: Comissao, newStatus: 'pendente' | 'paga' | 'bloqueada') => {
    if (newStatus === 'paga') {
      setSelectedComissao(comissao);
      setBeneficiarioNome(comissao.clients?.name || '');
      setShowPagarDialog(true);
      return;
    }
    await updateStatus.mutateAsync({
      id: comissao.id,
      status: newStatus,
    });
  };

  const handleDelete = async () => {
    if (!selectedComissao || !deleteMotivo) return;

    await deleteComissao.mutateAsync({
      id: selectedComissao.id,
      motivo: deleteMotivo,
    });

    setShowDeleteDialog(false);
    setSelectedComissao(null);
    setDeleteMotivo('');
  };

  const resetForm = () => {
    setFormClienteId('');
    setFormTipo('');
    setFormDataAcidente('');
    setFormValor('');
    setFormObservacoes('');
  };

  const handleClienteSelect = (clienteId: string) => {
    setFormClienteId(clienteId);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!isAdminOrGestor) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar este módulo.
              Apenas Administradores e Gestores podem visualizar Comissões.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Comissões
          </h1>
          <p className="text-muted-foreground">
            Gestão de comissões e pagamentos
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="listagem">Listagem</TabsTrigger>
          <TabsTrigger value="pagas">
            <CheckCircle className="h-4 w-4 mr-1" />
            Pagas
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">comissões cadastradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats?.valorTotalPendente || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pagas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.pagas || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats?.valorTotalPago || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.bloqueadas || 0}</div>
                <p className="text-xs text-muted-foreground">comissões com bloqueio</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comissões por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendentes', value: stats?.pendentes || 0 },
                          { name: 'Pagas', value: stats?.pagas || 0 },
                          { name: 'Bloqueadas', value: stats?.bloqueadas || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#eab308" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Por Funcionário (Quem Cadastrou)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porUsuario || []}>
                      <XAxis dataKey="nome" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Comissões" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pendentes List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Comissões Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredComissoes?.filter(c => c.status === 'pendente').slice(0, 5).map((comissao) => (
                  <div key={comissao.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{comissao.clients?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {comissao.tipo_indenizacao} • {format(new Date(comissao.data_acidente), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Cadastrado por: {comissao.created_by_profile?.name || 'Desconhecido'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(comissao.valor)}</p>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!filteredComissoes || filteredComissoes.filter(c => c.status === 'pendente').length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma comissão pendente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listagem Tab */}
        <TabsContent value="listagem" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, tipo ou funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="bloqueada">Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter || "__all__"} onValueChange={(v) => setTipoFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os Tipos</SelectItem>
                    {TIPOS_INDENIZACAO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Acidente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Cadastrado por</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredComissoes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma comissão encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComissoes?.map((comissao) => (
                      <TableRow key={comissao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comissao.clients?.name}</p>
                            <p className="text-xs text-muted-foreground">{comissao.clients?.cpf}</p>
                          </div>
                        </TableCell>
                        <TableCell>{comissao.tipo_indenizacao}</TableCell>
                        <TableCell>
                          {format(new Date(comissao.data_acidente), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{formatCurrency(comissao.valor)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{comissao.created_by_profile?.name || 'Desconhecido'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COMISSAO[comissao.status].color}>
                            {STATUS_COMISSAO[comissao.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {comissao.status === 'pendente' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateStatus(comissao, 'paga')}
                                title="Marcar como paga"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {comissao.status !== 'bloqueada' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateStatus(comissao, 'bloqueada')}
                                title="Bloquear"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedComissao(comissao);
                                setShowHistoricoDialog(true);
                              }}
                              title="Ver histórico"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedComissao(comissao);
                                  setShowDeleteDialog(true);
                                }}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagas Tab */}
        <TabsContent value="pagas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Comissões Pagas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Pago por</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Cadastrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesPagas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma comissão paga encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    comissoesPagas?.map((comissao) => (
                      <TableRow key={comissao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comissao.clients?.name}</p>
                            <p className="text-xs text-muted-foreground">{comissao.clients?.cpf}</p>
                          </div>
                        </TableCell>
                        <TableCell>{comissao.tipo_indenizacao}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(comissao.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {comissao.beneficiario_nome || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{comissao.pago_por_profile?.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {comissao.pago_em 
                                ? format(new Date(comissao.pago_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                : '-'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {comissao.created_by_profile?.name || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resumo mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fluxo Mensal (Meta: R$ 600,00)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total pago este mês</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.valorTotalPago || 0)}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Meta mensal</p>
                  <p className="text-2xl font-bold">R$ 600,00</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((stats?.valorTotalPago || 0) / 600) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(((stats?.valorTotalPago || 0) / 600) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Comissao Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Comissão</DialogTitle>
            <DialogDescription>
              Cadastre uma nova comissão vinculada a um cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={formClienteId || "__none__"} onValueChange={(v) => handleClienteSelect(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione um cliente</SelectItem>
                  {clients?.sort((a, b) => a.name.localeCompare(b.name)).map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.name} {cliente.cpf ? `(${cliente.cpf})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Indenização *</Label>
              <Select value={formTipo || "__none__"} onValueChange={(v) => setFormTipo(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {TIPOS_INDENIZACAO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data do Acidente *</Label>
              <Input
                type="date"
                value={formDataAcidente}
                onChange={(e) => setFormDataAcidente(e.target.value)}
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateComissao}
              disabled={!formClienteId || !formTipo || !formDataAcidente || createComissao.isPending}
            >
              {createComissao.isPending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagar Comissao Dialog */}
      <Dialog open={showPagarDialog} onOpenChange={setShowPagarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Comissão</DialogTitle>
            <DialogDescription>
              Informe o nome da pessoa que recebeu a comissão
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Input value={selectedComissao?.clients?.name || ''} disabled />
            </div>
            <div>
              <Label>Valor</Label>
              <Input value={formatCurrency(selectedComissao?.valor || 0)} disabled />
            </div>
            <div>
              <Label>Nome do Beneficiário (quem recebeu) *</Label>
              <Input
                placeholder="Nome de quem recebeu a comissão..."
                value={beneficiarioNome}
                onChange={(e) => setBeneficiarioNome(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagarDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handlePagarComissao}
              disabled={!beneficiarioNome.trim() || pagarComissao.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {pagarComissao.isPending ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historico Dialog */}
      <Dialog open={showHistoricoDialog} onOpenChange={setShowHistoricoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico da Comissão</DialogTitle>
            <DialogDescription>
              {selectedComissao?.clients?.name} - {selectedComissao?.tipo_indenizacao}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {historico?.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <History className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium capitalize">{item.acao}</p>
                  {item.campo_alterado && (
                    <p className="text-sm text-muted-foreground">
                      {item.campo_alterado}: {item.valor_anterior} → {item.valor_novo}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.profiles?.name && <span>Por: {item.profiles.name} • </span>}
                    {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
            {(!historico || historico.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum histórico registrado
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Comissão</DialogTitle>
            <DialogDescription>
              Esta ação irá marcar a comissão como excluída. Informe o motivo.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo da exclusão *</Label>
            <Textarea
              placeholder="Informe o motivo da exclusão..."
              value={deleteMotivo}
              onChange={(e) => setDeleteMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!deleteMotivo || deleteComissao.isPending}
            >
              {deleteComissao.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
