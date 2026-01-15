import { useState, useMemo } from 'react';
import { format, addDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Calendar as CalendarIcon, AlertTriangle, Clock, Users, CheckCircle2, XCircle, Loader2, Eye, Edit, Filter, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { usePericias, usePericiaStats, useCreatePericia, useUpdatePericia, useUpdatePericiaStatus, usePericiaLogs, TIPO_PERICIA_LABELS, STATUS_PERICIA_LABELS, STATUS_PERICIA_COLORS, Pericia, JuntaMedico } from '@/hooks/usePericias';
import { useClients } from '@/hooks/useClients';
import { cn } from '@/lib/utils';

const TIPO_PERICIA_OPTIONS = Object.entries(TIPO_PERICIA_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_PERICIA_LABELS).map(([value, label]) => ({ value, label }));

const emptyMedico = { nome_medico: '', crm: '', especialidade: '', endereco_profissional: '', telefone: '' };

export default function PericiasAgendadasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedPericia, setSelectedPericia] = useState<Pericia | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [juntaMedicos, setJuntaMedicos] = useState<Omit<JuntaMedico, 'id' | 'junta_id' | 'created_at'>[]>([emptyMedico, emptyMedico, emptyMedico]);
  const [statusObservacao, setStatusObservacao] = useState('');
  const itemsPerPage = 10;

  const { data: pericias = [], isLoading } = usePericias();
  const { data: stats } = usePericiaStats();
  const { data: clients = [] } = useClients();
  const { data: logs = [] } = usePericiaLogs(selectedPericia?.id);
  const createPericia = useCreatePericia();
  const updatePericia = useUpdatePericia();
  const updateStatus = useUpdatePericiaStatus();

  // Filtros
  const filteredPericias = useMemo(() => {
    return pericias.filter(p => {
      const matchesSearch = !search || 
        p.cliente?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.medico_responsavel?.toLowerCase().includes(search.toLowerCase()) ||
        p.clinica_nome?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
      const matchesTipo = tipoFilter === 'todos' || p.tipo_pericia === tipoFilter;
      return matchesSearch && matchesStatus && matchesTipo;
    });
  }, [pericias, search, statusFilter, tipoFilter]);

  const paginatedPericias = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPericias.slice(start, start + itemsPerPage);
  }, [filteredPericias, currentPage]);

  const totalPages = Math.ceil(filteredPericias.length / itemsPerPage);

  // Eventos do calendário
  const calendarEvents = useMemo(() => {
    const events: Record<string, Pericia[]> = {};
    pericias.forEach(p => {
      const dateKey = p.data_pericia;
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push(p);
    });
    return events;
  }, [pericias]);

  const openNewForm = () => {
    setSelectedPericia(null);
    setFormData({
      cliente_id: '',
      tipo_pericia: '',
      status: 'agendada',
      data_pericia: '',
      hora_pericia: '',
      medico_responsavel: '',
      crm_medico: '',
      clinica_nome: '',
      clinica_endereco: '',
      clinica_numero: '',
      clinica_bairro: '',
      clinica_cidade: '',
      clinica_cep: '',
      clinica_telefone: '',
      observacoes: '',
      junta_local: '',
      junta_endereco: '',
      junta_data: '',
      junta_hora: '',
      junta_observacoes: ''
    });
    setJuntaMedicos([emptyMedico, emptyMedico, emptyMedico]);
    setShowFormDialog(true);
  };

  const openEditForm = (pericia: Pericia) => {
    setSelectedPericia(pericia);
    setFormData({
      cliente_id: pericia.cliente_id,
      tipo_pericia: pericia.tipo_pericia,
      status: pericia.status,
      data_pericia: pericia.data_pericia,
      hora_pericia: pericia.hora_pericia || '',
      medico_responsavel: pericia.medico_responsavel || '',
      crm_medico: pericia.crm_medico || '',
      clinica_nome: pericia.clinica_nome || '',
      clinica_endereco: pericia.clinica_endereco || '',
      clinica_numero: pericia.clinica_numero || '',
      clinica_bairro: pericia.clinica_bairro || '',
      clinica_cidade: pericia.clinica_cidade || '',
      clinica_cep: pericia.clinica_cep || '',
      clinica_telefone: pericia.clinica_telefone || '',
      observacoes: pericia.observacoes || '',
      junta_local: pericia.junta_medica?.local_junta || '',
      junta_endereco: pericia.junta_medica?.endereco_junta || '',
      junta_data: pericia.junta_medica?.data_junta || '',
      junta_hora: pericia.junta_medica?.hora_junta || '',
      junta_observacoes: pericia.junta_medica?.observacoes || ''
    });
    setJuntaMedicos(
      pericia.junta_medica?.medicos?.map(m => ({
        nome_medico: m.nome_medico,
        crm: m.crm,
        especialidade: m.especialidade || '',
        endereco_profissional: m.endereco_profissional || '',
        telefone: m.telefone || ''
      })) || [emptyMedico, emptyMedico, emptyMedico]
    );
    setShowFormDialog(true);
  };

  const handleSavePericia = async () => {
    const payload: any = {
      cliente_id: formData.cliente_id,
      tipo_pericia: formData.tipo_pericia,
      status: formData.status,
      data_pericia: formData.data_pericia,
      hora_pericia: formData.hora_pericia || null,
      medico_responsavel: formData.medico_responsavel || null,
      crm_medico: formData.crm_medico || null,
      clinica_nome: formData.clinica_nome || null,
      clinica_endereco: formData.clinica_endereco || null,
      clinica_numero: formData.clinica_numero || null,
      clinica_bairro: formData.clinica_bairro || null,
      clinica_cidade: formData.clinica_cidade || null,
      clinica_cep: formData.clinica_cep || null,
      clinica_telefone: formData.clinica_telefone || null,
      observacoes: formData.observacoes || null
    };

    // Junta Médica é um TIPO de perícia, não STATUS
    if (formData.tipo_pericia === 'junta_medica') {
      payload.junta_medica = {
        local_junta: formData.junta_local,
        endereco_junta: formData.junta_endereco,
        data_junta: formData.junta_data || formData.data_pericia,
        hora_junta: formData.junta_hora || null,
        observacoes: formData.junta_observacoes || null,
        medicos: juntaMedicos.filter(m => m.nome_medico && m.crm)
      };
    }

    try {
      if (selectedPericia) {
        await updatePericia.mutateAsync({ id: selectedPericia.id, ...payload });
      } else {
        await createPericia.mutateAsync(payload);
      }
      setShowFormDialog(false);
    } catch (error) {}
  };

  const handleStatusChange = async () => {
    if (!selectedPericia) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedPericia.id,
        status: formData.newStatus,
        observacoes: statusObservacao || undefined
      });
      setShowStatusDialog(false);
      setStatusObservacao('');
    } catch (error) {}
  };

  const openStatusDialog = (pericia: Pericia) => {
    setSelectedPericia(pericia);
    setFormData({ newStatus: pericia.status });
    setStatusObservacao('');
    setShowStatusDialog(true);
  };

  const renderStatusBadge = (status: string) => {
    const colorClass = STATUS_PERICIA_COLORS[status] || 'bg-gray-500';
    return (
      <Badge className={cn('text-white', colorClass)}>
        {STATUS_PERICIA_LABELS[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perícias Agendadas</h1>
          <p className="text-muted-foreground">Centro de controle de eventos periciais</p>
        </div>
        <Button onClick={openNewForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cadastro
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter('todos')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setStatusFilter('agendada')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.agendadas || 0}</p>
                <p className="text-xs text-muted-foreground">Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500 transition-colors" onClick={() => setStatusFilter('realizada_aguardando_pagamento')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.aguardandoPagamento || 0}</p>
                <p className="text-xs text-muted-foreground">Aguardando Pgto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStatusFilter('cliente_faltou')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.clientesFaltosos || 0}</p>
                <p className="text-xs text-muted-foreground">Faltaram</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-purple-500 transition-colors" onClick={() => setTipoFilter('junta_medica')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.juntasMedicas || 0}</p>
                <p className="text-xs text-muted-foreground">Juntas Médicas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.proximos3Dias.length || 0}</p>
                <p className="text-xs text-muted-foreground">Próx. 3 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Próximos 3 dias */}
      {stats?.proximos3Dias && stats.proximos3Dias.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Perícias nos próximos 3 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.proximos3Dias.map((p: any) => (
                <Badge key={p.id} variant="outline" className="py-1">
                  {p.cliente?.name} - {format(parseISO(p.data_pericia), 'dd/MM')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Tabela e Calendário */}
      <Tabs defaultValue="tabela" className="w-full">
        <TabsList>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente, médico ou clínica..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                {TIPO_PERICIA_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedPericias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma perícia encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPericias.map((pericia) => (
                      <TableRow key={pericia.id}>
                        <TableCell className="font-medium">{pericia.cliente?.name || '-'}</TableCell>
                        <TableCell>
                          <span className="text-sm">{TIPO_PERICIA_LABELS[pericia.tipo_pericia]}</span>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(pericia.data_pericia), 'dd/MM/yyyy', { locale: ptBR })}
                          {pericia.hora_pericia && ` ${pericia.hora_pericia.slice(0, 5)}`}
                        </TableCell>
                        <TableCell>{pericia.medico_responsavel || '-'}</TableCell>
                        <TableCell>{pericia.clinica_nome || '-'}</TableCell>
                        <TableCell>{renderStatusBadge(pericia.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedPericia(pericia); setShowDetailsDialog(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditForm(pericia)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openStatusDialog(pericia)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPericias.length)} de {filteredPericias.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendario">
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={(d) => d && setCalendarDate(d)}
                locale={ptBR}
                className="rounded-md border"
                modifiers={{
                  hasEvent: (date) => {
                    const key = format(date, 'yyyy-MM-dd');
                    return !!calendarEvents[key];
                  }
                }}
                modifiersStyles={{
                  hasEvent: { backgroundColor: 'hsl(var(--primary))', color: 'white', borderRadius: '50%' }
                }}
              />
              {calendarEvents[format(calendarDate, 'yyyy-MM-dd')] && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Perícias em {format(calendarDate, "dd 'de' MMMM", { locale: ptBR })}</h4>
                  {calendarEvents[format(calendarDate, 'yyyy-MM-dd')].map(p => (
                    <div key={p.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.cliente?.name}</p>
                        <p className="text-sm text-muted-foreground">{TIPO_PERICIA_LABELS[p.tipo_pericia]} {p.hora_pericia && `- ${p.hora_pericia.slice(0, 5)}`}</p>
                      </div>
                      {renderStatusBadge(p.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Formulário */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPericia ? 'Editar Perícia' : 'Nova Perícia'}</DialogTitle>
            <DialogDescription>
              {selectedPericia ? 'Atualize os dados da perícia' : 'Cadastre uma nova perícia vinculada a um cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente <span className="text-red-500">*</span></Label>
              <Select value={formData.cliente_id} onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}>
                <SelectTrigger className={!formData.cliente_id ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Perícia <span className="text-red-500">*</span></Label>
                <Select value={formData.tipo_pericia} onValueChange={(v) => setFormData({ ...formData, tipo_pericia: v })}>
                  <SelectTrigger className={!formData.tipo_pericia ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_PERICIA_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status <span className="text-red-500">*</span></Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Perícia <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={formData.data_pericia} 
                  onChange={(e) => setFormData({ ...formData, data_pericia: e.target.value })} 
                  className={!formData.data_pericia ? 'border-red-300' : ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horário <span className="text-red-500">*</span></Label>
                <Input 
                  type="time" 
                  value={formData.hora_pericia} 
                  onChange={(e) => setFormData({ ...formData, hora_pericia: e.target.value })} 
                  className={!formData.hora_pericia ? 'border-red-300' : ''}
                  required
                />
              </div>
            </div>

            {/* Médico */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Médico Responsável <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.medico_responsavel} 
                  onChange={(e) => setFormData({ ...formData, medico_responsavel: e.target.value })} 
                  placeholder="Nome do médico"
                  className={!formData.medico_responsavel ? 'border-red-300' : ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CRM <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.crm_medico} 
                  onChange={(e) => setFormData({ ...formData, crm_medico: e.target.value })} 
                  placeholder="CRM do médico"
                  className={!formData.crm_medico ? 'border-red-300' : ''}
                  required
                />
              </div>
            </div>

            {/* Clínica */}
            <div className="space-y-4">
              <h4 className="font-medium">Dados da Clínica/Hospital <span className="text-red-500">*</span></h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Clínica <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_nome} 
                    onChange={(e) => setFormData({ ...formData, clinica_nome: e.target.value })} 
                    className={!formData.clinica_nome ? 'border-red-300' : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_telefone} 
                    onChange={(e) => setFormData({ ...formData, clinica_telefone: e.target.value })} 
                    className={!formData.clinica_telefone ? 'border-red-300' : ''}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Endereço <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_endereco} 
                    onChange={(e) => setFormData({ ...formData, clinica_endereco: e.target.value })} 
                    className={!formData.clinica_endereco ? 'border-red-300' : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_numero} 
                    onChange={(e) => setFormData({ ...formData, clinica_numero: e.target.value })} 
                    className={!formData.clinica_numero ? 'border-red-300' : ''}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_bairro} 
                    onChange={(e) => setFormData({ ...formData, clinica_bairro: e.target.value })} 
                    className={!formData.clinica_bairro ? 'border-red-300' : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_cidade} 
                    onChange={(e) => setFormData({ ...formData, clinica_cidade: e.target.value })} 
                    className={!formData.clinica_cidade ? 'border-red-300' : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.clinica_cep} 
                    onChange={(e) => setFormData({ ...formData, clinica_cep: e.target.value })} 
                    className={!formData.clinica_cep ? 'border-red-300' : ''}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Junta Médica - mostrar quando TIPO for junta_medica */}
            {formData.tipo_pericia === 'junta_medica' && (
              <div className="space-y-4 p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <h4 className="font-medium text-purple-700 dark:text-purple-300">Dados da Junta Médica (Obrigatório: 3 médicos)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Local da Junta <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.junta_local} 
                      onChange={(e) => setFormData({ ...formData, junta_local: e.target.value })} 
                      className={!formData.junta_local ? 'border-red-300' : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.junta_endereco} 
                      onChange={(e) => setFormData({ ...formData, junta_endereco: e.target.value })} 
                      className={!formData.junta_endereco ? 'border-red-300' : ''}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Junta <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={formData.junta_data} 
                      onChange={(e) => setFormData({ ...formData, junta_data: e.target.value })} 
                      className={!formData.junta_data ? 'border-red-300' : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário <span className="text-red-500">*</span></Label>
                    <Input 
                      type="time" 
                      value={formData.junta_hora} 
                      onChange={(e) => setFormData({ ...formData, junta_hora: e.target.value })} 
                      className={!formData.junta_hora ? 'border-red-300' : ''}
                      required
                    />
                  </div>
                </div>

                <h5 className="font-medium mt-4">Médicos da Junta (obrigatório 3 médicos com Nome e CRM)</h5>
                {juntaMedicos.map((medico, idx) => (
                  <div key={idx} className="p-3 border rounded bg-background space-y-3">
                    <p className="text-sm font-medium">Médico {idx + 1} <span className="text-red-500">*</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Nome *" 
                        value={medico.nome_medico} 
                        onChange={(e) => {
                          const updated = [...juntaMedicos];
                          updated[idx] = { ...updated[idx], nome_medico: e.target.value };
                          setJuntaMedicos(updated);
                        }} 
                        className={!medico.nome_medico ? 'border-red-300' : ''}
                        required
                      />
                      <Input 
                        placeholder="CRM *" 
                        value={medico.crm} 
                        onChange={(e) => {
                          const updated = [...juntaMedicos];
                          updated[idx] = { ...updated[idx], crm: e.target.value };
                          setJuntaMedicos(updated);
                        }} 
                        className={!medico.crm ? 'border-red-300' : ''}
                        required
                      />
                      <Input 
                        placeholder="Especialidade *" 
                        value={medico.especialidade} 
                        onChange={(e) => {
                          const updated = [...juntaMedicos];
                          updated[idx] = { ...updated[idx], especialidade: e.target.value };
                          setJuntaMedicos(updated);
                        }} 
                        className={!medico.especialidade ? 'border-red-300' : ''}
                        required
                      />
                      <Input 
                        placeholder="Telefone *" 
                        value={medico.telefone} 
                        onChange={(e) => {
                          const updated = [...juntaMedicos];
                          updated[idx] = { ...updated[idx], telefone: e.target.value };
                          setJuntaMedicos(updated);
                        }} 
                        className={!medico.telefone ? 'border-red-300' : ''}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleSavePericia} 
              disabled={
                !formData.cliente_id || 
                !formData.tipo_pericia || 
                !formData.data_pericia || 
                !formData.hora_pericia ||
                !formData.medico_responsavel ||
                !formData.crm_medico ||
                !formData.clinica_nome ||
                !formData.clinica_telefone ||
                !formData.clinica_endereco ||
                !formData.clinica_numero ||
                !formData.clinica_bairro ||
                !formData.clinica_cidade ||
                !formData.clinica_cep ||
                (formData.tipo_pericia === 'junta_medica' && (
                  !formData.junta_local ||
                  !formData.junta_endereco ||
                  !formData.junta_data ||
                  !formData.junta_hora ||
                  juntaMedicos.some(m => !m.nome_medico || !m.crm || !m.especialidade || !m.telefone)
                )) ||
                createPericia.isPending || 
                updatePericia.isPending
              }
            >
              {(createPericia.isPending || updatePericia.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPericia ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Perícia</DialogTitle>
          </DialogHeader>

          {selectedPericia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedPericia.cliente?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p>{TIPO_PERICIA_LABELS[selectedPericia.tipo_pericia]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p>{format(parseISO(selectedPericia.data_pericia), 'dd/MM/yyyy')} {selectedPericia.hora_pericia?.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {renderStatusBadge(selectedPericia.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Médico</p>
                  <p>{selectedPericia.medico_responsavel || '-'} {selectedPericia.crm_medico && `(CRM: ${selectedPericia.crm_medico})`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p>{selectedPericia.clinica_nome || '-'}</p>
                </div>
              </div>

              {/* Histórico */}
              <div className="border-t pt-4">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <History className="h-4 w-4" />
                  Histórico de Alterações
                </h4>
                <ScrollArea className="h-[200px]">
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum registro</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map(log => (
                        <div key={log.id} className="p-2 border rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">{log.acao.replace('_', ' ')}</span>
                            <span className="text-muted-foreground">{format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          {log.status_anterior && log.status_novo && (
                            <p className="text-muted-foreground">
                              {STATUS_PERICIA_LABELS[log.status_anterior]} → {STATUS_PERICIA_LABELS[log.status_novo]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Alterar Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Perícia</DialogTitle>
            <DialogDescription>
              Selecione o novo status e adicione uma observação se necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Status</Label>
              <Select value={formData.newStatus} onValueChange={(v) => setFormData({ ...formData, newStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.newStatus === 'cliente_faltou' && (
              <div className="space-y-2">
                <Label>Observação (obrigatória)</Label>
                <Textarea 
                  value={statusObservacao} 
                  onChange={(e) => setStatusObservacao(e.target.value)}
                  placeholder="Descreva o motivo da falta..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleStatusChange}
              disabled={(formData.newStatus === 'cliente_faltou' && !statusObservacao) || updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
