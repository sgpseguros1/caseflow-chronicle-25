import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  useTarefasUsuario, 
  useTodasTarefas,
  useCreateTarefaUsuario, 
  useIniciarTarefa,
  useConcluirTarefa,
  useTarefaMensagens,
  useEnviarMensagemTarefa,
  useMetricasTempoReal,
  useMetricasTodosUsuarios,
  useTarefaHistorico,
  useUsuariosDisponiveis,
  TarefaUsuario
} from '@/hooks/useTarefasUsuario';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, CheckCircle, Clock, AlertTriangle, MessageSquare, User, Calendar,
  Play, Target, TrendingUp, Users, BarChart3, Send, Timer, Award, Zap,
  UserCircle, Building2, History
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateUtils';

const PRIORIDADE_CONFIG = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Play },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
};

// Componente de Timer em tempo real
function TaskTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const start = new Date(startTime);
    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), start));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOvertime = elapsed > 300; // 5 minutos

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-blue-600'}`}>
      <Timer className="w-4 h-4" />
      {minutes}:{seconds.toString().padStart(2, '0')}
      {isOvertime && <span className="text-xs ml-1">(Atrasado!)</span>}
    </div>
  );
}

// Dialog de Chat da Tarefa
function TarefaChatDialog({ 
  tarefa, 
  open, 
  onOpenChange 
}: { 
  tarefa: TarefaUsuario; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [mensagem, setMensagem] = useState('');
  const { data: mensagens } = useTarefaMensagens(tarefa?.id);
  const { data: historico } = useTarefaHistorico(tarefa?.id);
  const enviarMensagem = useEnviarMensagemTarefa();

  const handleEnviar = async () => {
    if (!mensagem.trim()) return;
    await enviarMensagem.mutateAsync({ tarefa_id: tarefa.id, conteudo: mensagem });
    setMensagem('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {tarefa?.titulo}
          </DialogTitle>
          <DialogDescription>
            Chat interno e histórico da tarefa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {mensagens?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda</p>
              ) : (
                <div className="space-y-3">
                  {mensagens?.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.profiles?.name || 'Usuário'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{msg.conteudo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Input 
                placeholder="Digite sua mensagem..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              />
              <Button onClick={handleEnviar} disabled={enviarMensagem.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <ScrollArea className="h-[350px]">
              {historico?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum histórico</p>
              ) : (
                <div className="space-y-3">
                  {historico?.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <History className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm">{item.descricao}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{item.profiles?.name || 'Sistema'}</span>
                          <span>•</span>
                          <span>{format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function PainelTarefasUsuarioPage() {
  // Estado do fluxo de criação
  const [step, setStep] = useState<'tipo' | 'cliente' | 'form'>('tipo');
  const [tipoSolicitacao, setTipoSolicitacao] = useState<'cliente' | 'conversa_interna' | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [searchCliente, setSearchCliente] = useState('');
  
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatTarefa, setChatTarefa] = useState<TarefaUsuario | null>(null);
  const [concluirDialog, setConcluirDialog] = useState<{ open: boolean; tarefa: TarefaUsuario | null; resposta: string }>({ 
    open: false, tarefa: null, resposta: '' 
  });
  const [novaTarefa, setNovaTarefa] = useState({ 
    titulo: '', descricao: '', prioridade: 'normal', responsavel_id: '', prazo: '' 
  });
  const [activeTab, setActiveTab] = useState<string>('minhas-tarefas');
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { hasRole, user } = useAuth();
  const isAdminOrGestor = hasRole('admin') || hasRole('gestor');
  
  const { data: minhasTarefas, isLoading } = useTarefasUsuario(statusFilter);
  const { data: todasTarefas } = useTodasTarefas(statusFilter);
  const { data: clients } = useClients();
  const { data: usuarios } = useUsuariosDisponiveis();
  const { data: minhasMetricas } = useMetricasTempoReal();
  const { data: metricasTodos } = useMetricasTodosUsuarios();
  
  const createTarefa = useCreateTarefaUsuario();
  const iniciarTarefa = useIniciarTarefa();
  const concluirTarefa = useConcluirTarefa();

  // Filtrar clientes para busca
  const clientesFiltrados = clients?.filter(c => 
    c.name.toLowerCase().includes(searchCliente.toLowerCase())
  ) || [];

  const handleSelectTipo = (tipo: 'cliente' | 'conversa_interna') => {
    setTipoSolicitacao(tipo);
    if (tipo === 'cliente') {
      setStep('cliente');
    } else {
      setStep('form');
    }
  };

  const handleSelectCliente = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    setStep('form');
  };

  const handleCreateTarefa = async () => {
    if (!novaTarefa.titulo || !tipoSolicitacao) return;
    
    await createTarefa.mutateAsync({
      titulo: novaTarefa.titulo,
      descricao: novaTarefa.descricao || undefined,
      prioridade: novaTarefa.prioridade,
      tipo_solicitacao: tipoSolicitacao,
      cliente_id: clienteSelecionado || undefined,
      responsavel_id: novaTarefa.responsavel_id || undefined,
      prazo: novaTarefa.prazo || undefined,
    });
    
    // Reset
    setNovaTarefa({ titulo: '', descricao: '', prioridade: 'normal', responsavel_id: '', prazo: '' });
    setTipoSolicitacao(null);
    setClienteSelecionado('');
    setSearchCliente('');
    setStep('tipo');
    setDialogOpen(false);
  };

  const handleIniciarTarefa = async (tarefa: TarefaUsuario) => {
    await iniciarTarefa.mutateAsync(tarefa.id);
  };

  const handleConcluirTarefa = async () => {
    if (!concluirDialog.tarefa) return;
    await concluirTarefa.mutateAsync({ 
      id: concluirDialog.tarefa.id, 
      resposta: concluirDialog.resposta 
    });
    
    // Verificar se demorou mais de 5 minutos e exibir feedback
    const tarefa = concluirDialog.tarefa;
    if (tarefa.iniciado_em) {
      const tempoDecorrido = differenceInSeconds(new Date(), new Date(tarefa.iniciado_em));
      if (tempoDecorrido > 300) {
        setFeedbackDialog({
          open: true,
          message: 'Você demorou mais do que o esperado. Essa tarefa poderia ser resolvida mais rápido. Você é melhor do que isso. Vamos melhorar o ritmo!'
        });
      }
    }
    
    setConcluirDialog({ open: false, tarefa: null, resposta: '' });
  };

  const tarefasExibidas = activeTab === 'todas-tarefas' && isAdminOrGestor ? todasTarefas : minhasTarefas;

  const stats = {
    pendentes: tarefasExibidas?.filter(t => t.status === 'pendente').length || 0,
    emAndamento: tarefasExibidas?.filter(t => t.status === 'em_andamento').length || 0,
    concluidas: tarefasExibidas?.filter(t => t.status === 'concluida').length || 0,
    urgentes: tarefasExibidas?.filter(t => t.prioridade === 'urgente' && t.status !== 'concluida').length || 0,
  };

  const formatTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    if (segundos < 3600) return `${Math.floor(segundos / 60)}min`;
    return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel de Tarefas do Usuário</h1>
          <p className="text-muted-foreground">
            Organize seu trabalho, gerencie solicitações e acompanhe seu desempenho
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setStep('tipo');
            setTipoSolicitacao(null);
            setClienteSelecionado('');
            setSearchCliente('');
          }
        }}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
          </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {step === 'tipo' && 'Qual o tipo de solicitação?'}
                {step === 'cliente' && 'Selecione o Cliente'}
                {step === 'form' && 'Criar Solicitação'}
              </DialogTitle>
              <DialogDescription>
                {step === 'tipo' && 'Escolha se a solicitação é sobre um cliente ou uma conversa interna'}
                {step === 'cliente' && 'Busque e selecione o cliente relacionado'}
                {step === 'form' && 'Preencha os dados da solicitação'}
              </DialogDescription>
            </DialogHeader>

            {/* Step 1: Tipo de Solicitação */}
            {step === 'tipo' && (
              <div className="grid grid-cols-1 gap-4 py-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleSelectTipo('cliente')}
                >
                  <Building2 className="w-8 h-8 text-primary" />
                  <span className="font-medium">Quero falar sobre um CLIENTE</span>
                  <span className="text-xs text-muted-foreground">Tarefa vinculada a um cliente cadastrado</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleSelectTipo('conversa_interna')}
                >
                  <MessageSquare className="w-8 h-8 text-primary" />
                  <span className="font-medium">Quero apenas conversar / alinhar algo</span>
                  <span className="text-xs text-muted-foreground">Comunicação interna sem vínculo com cliente</span>
                </Button>
              </div>
            )}

            {/* Step 2: Seleção de Cliente */}
            {step === 'cliente' && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Buscar Cliente *</Label>
                  <Input 
                    placeholder="Digite o nome do cliente..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[250px] border rounded-lg">
                  {clientesFiltrados.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchCliente ? 'Nenhum cliente encontrado' : 'Digite para buscar...'}
                    </p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {clientesFiltrados.map((client) => (
                        <Button
                          key={client.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleSelectCliente(client.id)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          {client.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <Button variant="outline" onClick={() => setStep('tipo')} className="w-full">
                  Voltar
                </Button>
              </div>
            )}

            {/* Step 3: Formulário */}
            {step === 'form' && (
              <div className="space-y-4 pt-4">
                {tipoSolicitacao === 'cliente' && clienteSelecionado && (
                  <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      Cliente: {clients?.find(c => c.id === clienteSelecionado)?.name}
                    </span>
                  </div>
                )}
                {tipoSolicitacao === 'conversa_interna' && (
                  <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Comunicação Interna</span>
                  </div>
                )}
                
                <div>
                  <Label>Título *</Label>
                  <Input 
                    placeholder="Resumo da solicitação"
                    value={novaTarefa.titulo}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Descreva detalhadamente..."
                    rows={3}
                    value={novaTarefa.descricao}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Select 
                    value={novaTarefa.responsavel_id} 
                    onValueChange={(v) => setNovaTarefa({ ...novaTarefa, responsavel_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridade</Label>
                    <Select 
                      value={novaTarefa.prioridade} 
                      onValueChange={(v) => setNovaTarefa({ ...novaTarefa, prioridade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input 
                      type="date"
                      value={novaTarefa.prazo}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    if (tipoSolicitacao === 'cliente') {
                      setStep('cliente');
                    } else {
                      setStep('tipo');
                    }
                  }} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleCreateTarefa} 
                    disabled={createTarefa.isPending || !novaTarefa.titulo} 
                    className="flex-1"
                  >
                    {createTarefa.isPending ? 'Criando...' : 'Criar Tarefa'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard de Métricas Pessoais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.emAndamento}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.concluidas}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.urgentes}</p>
                <p className="text-xs text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Timer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {minhasMetricas?.tempo_medio_resolucao_segundos 
                    ? formatTempo(minhasMetricas.tempo_medio_resolucao_segundos) 
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {minhasMetricas?.percentual_em_5_minutos?.toFixed(0) || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Em 5 min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Automático */}
      {minhasMetricas?.feedback_gerado && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <p className="font-medium">{minhasMetricas.feedback_gerado}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="minhas-tarefas">Minhas Tarefas</TabsTrigger>
          {isAdminOrGestor && <TabsTrigger value="todas-tarefas">Todas as Tarefas</TabsTrigger>}
          <TabsTrigger value="metricas">Dashboard Métricas</TabsTrigger>
        </TabsList>

        {/* Minhas Tarefas / Todas as Tarefas */}
        <TabsContent value="minhas-tarefas" className="space-y-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
              <TabsTrigger value="concluida">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>
          <TarefasList 
            tarefas={minhasTarefas || []} 
            isLoading={isLoading}
            onIniciar={handleIniciarTarefa}
            onConcluir={(tarefa) => setConcluirDialog({ open: true, tarefa, resposta: '' })}
            onChat={(tarefa) => setChatTarefa(tarefa)}
          />
        </TabsContent>

        <TabsContent value="todas-tarefas" className="space-y-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
              <TabsTrigger value="concluida">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>
          <TarefasList 
            tarefas={todasTarefas || []} 
            isLoading={isLoading}
            onIniciar={handleIniciarTarefa}
            onConcluir={(tarefa) => setConcluirDialog({ open: true, tarefa, resposta: '' })}
            onChat={(tarefa) => setChatTarefa(tarefa)}
            showResponsavel
          />
        </TabsContent>

        {/* Dashboard de Métricas */}
        <TabsContent value="metricas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Minhas Métricas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Minhas Métricas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{minhasMetricas?.total_recebidas || 0}</p>
                    <p className="text-sm text-muted-foreground">Tarefas Recebidas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{minhasMetricas?.total_concluidas || 0}</p>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">% Resolvidas em até 5 min</span>
                    <span className="text-sm font-medium">{minhasMetricas?.percentual_em_5_minutos?.toFixed(0) || 0}%</span>
                  </div>
                  <Progress value={minhasMetricas?.percentual_em_5_minutos || 0} />
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm">{minhasMetricas?.feedback_gerado || 'Nenhuma métrica disponível'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Métricas da Equipe (Admin/Gestor) */}
            {isAdminOrGestor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Desempenho da Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {metricasTodos?.map((m) => (
                        <div key={m.usuario_id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{m.nome}</span>
                            <Badge variant={m.percentual_em_5_minutos >= 60 ? 'default' : 'destructive'}>
                              {m.percentual_em_5_minutos.toFixed(0)}% em 5min
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <p className="font-medium text-foreground">{m.total_recebidas}</p>
                              <p>Recebidas</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{m.total_concluidas}</p>
                              <p>Concluídas</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{m.total_pendentes}</p>
                              <p>Pendentes</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{formatTempo(m.tempo_medio_resolucao_segundos)}</p>
                              <p>Tempo Médio</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!metricasTodos || metricasTodos.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Nenhuma métrica disponível</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Concluir Tarefa */}
      <Dialog open={concluirDialog.open} onOpenChange={(open) => setConcluirDialog({ ...concluirDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Tarefa</DialogTitle>
            <DialogDescription>Adicione uma resposta ou observação final (opcional)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea 
              placeholder="Resposta ou observação..."
              rows={4}
              value={concluirDialog.resposta}
              onChange={(e) => setConcluirDialog({ ...concluirDialog, resposta: e.target.value })}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setConcluirDialog({ open: false, tarefa: null, resposta: '' })}>
                Cancelar
              </Button>
              <Button onClick={handleConcluirTarefa} disabled={concluirTarefa.isPending}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {concluirTarefa.isPending ? 'Concluindo...' : 'Concluir Tarefa'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Feedback de Atraso */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Feedback de Desempenho
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg">{feedbackDialog.message}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setFeedbackDialog({ open: false, message: '' })}>
              Entendi, vou melhorar!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Chat */}
      {chatTarefa && (
        <TarefaChatDialog 
          tarefa={chatTarefa} 
          open={!!chatTarefa} 
          onOpenChange={(open) => !open && setChatTarefa(null)} 
        />
      )}
    </div>
  );
}

// Componente de Lista de Tarefas
function TarefasList({ 
  tarefas, 
  isLoading, 
  onIniciar, 
  onConcluir, 
  onChat,
  showResponsavel = false
}: { 
  tarefas: TarefaUsuario[]; 
  isLoading: boolean;
  onIniciar: (tarefa: TarefaUsuario) => void;
  onConcluir: (tarefa: TarefaUsuario) => void;
  onChat: (tarefa: TarefaUsuario) => void;
  showResponsavel?: boolean;
}) {
  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Carregando...</p>;
  }

  if (!tarefas?.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tarefas.map((tarefa) => {
        const StatusIcon = STATUS_CONFIG[tarefa.status]?.icon || Clock;
        const isEmAndamento = tarefa.status === 'em_andamento';
        
        return (
          <Card key={tarefa.id} className={tarefa.prioridade === 'urgente' && tarefa.status !== 'concluida' ? 'border-red-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={PRIORIDADE_CONFIG[tarefa.prioridade]?.color}>
                      {PRIORIDADE_CONFIG[tarefa.prioridade]?.label}
                    </Badge>
                    <Badge className={STATUS_CONFIG[tarefa.status]?.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {STATUS_CONFIG[tarefa.status]?.label}
                    </Badge>
                    <Badge variant="outline">
                      {tarefa.tipo_solicitacao === 'cliente' ? 'Cliente' : 'Comunicação Interna'}
                    </Badge>
                    {isEmAndamento && tarefa.iniciado_em && (
                      <TaskTimer startTime={tarefa.iniciado_em} />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{tarefa.titulo}</h3>
                  {tarefa.descricao && (
                    <p className="text-muted-foreground mt-1 line-clamp-2">{tarefa.descricao}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      De: {tarefa.profiles?.name || 'Usuário'}
                    </span>
                    {showResponsavel && tarefa.responsavel && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Para: {tarefa.responsavel.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(tarefa.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    {tarefa.prazo && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Prazo: {formatDateOnly(tarefa.prazo)}
                      </span>
                    )}
                    {tarefa.clients?.name && (
                      <span className="flex items-center gap-1 text-primary">
                        <Building2 className="w-3 h-3" />
                        {tarefa.clients.name}
                      </span>
                    )}
                  </div>
                  {tarefa.resposta && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Resposta:</p>
                      <p className="text-sm">{tarefa.resposta}</p>
                    </div>
                  )}
                  {tarefa.tempo_resolucao_segundos && tarefa.status === 'concluida' && (
                    <div className="mt-2 text-sm">
                      <span className={tarefa.atrasada ? 'text-red-600' : 'text-green-600'}>
                        Resolvida em {Math.floor(tarefa.tempo_resolucao_segundos / 60)}min {tarefa.tempo_resolucao_segundos % 60}s
                        {tarefa.atrasada && ' (Ultrapassou 5 min)'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => onChat(tarefa)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  {tarefa.status === 'pendente' && (
                    <Button size="sm" onClick={() => onIniciar(tarefa)}>
                      <Play className="w-4 h-4 mr-1" /> Iniciar
                    </Button>
                  )}
                  {tarefa.status === 'em_andamento' && (
                    <Button size="sm" variant="default" onClick={() => onConcluir(tarefa)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Concluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
