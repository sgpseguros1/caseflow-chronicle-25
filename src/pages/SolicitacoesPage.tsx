import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Clock, AlertTriangle, CheckCircle, XCircle, MessageSquare, User, Calendar, Send, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  useSolicitacoesRecebidas, 
  useSolicitacoesEnviadas, 
  useCreateSolicitacao, 
  useResponderSolicitacao,
  useUsuariosDisponiveis,
  Solicitacao 
} from '@/hooks/useSolicitacoes';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700', icon: Clock },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700', icon: Clock },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: AlertTriangle },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function SolicitacoesPage() {
  const [statusFilter, setStatusFilter] = useState('todas');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [activeTab, setActiveTab] = useState('recebidas');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're in browser before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('normal');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [prazo, setPrazo] = useState('');

  // Response state
  const [resposta, setResposta] = useState('');
  const [novoStatus, setNovoStatus] = useState('concluida');

  const { user } = useAuth();
  const { data: recebidas = [], isLoading: loadingRecebidas } = useSolicitacoesRecebidas(statusFilter);
  const { data: enviadas = [], isLoading: loadingEnviadas } = useSolicitacoesEnviadas(statusFilter);
  const { data: usuarios = [] } = useUsuariosDisponiveis();
  const { data: clientes = [] } = useClients();
  const createMutation = useCreateSolicitacao();
  const responderMutation = useResponderSolicitacao();

  const handleCreate = () => {
    if (!titulo || !destinatarioId) return;
    
    createMutation.mutate({
      titulo,
      descricao: descricao || undefined,
      prioridade,
      destinatario_id: destinatarioId,
      cliente_id: clienteId || undefined,
      prazo: prazo || undefined,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setTitulo('');
        setDescricao('');
        setPrioridade('normal');
        setDestinatarioId('');
        setClienteId('');
        setPrazo('');
      },
    });
  };

  const handleResponder = () => {
    if (!selectedSolicitacao || !resposta) return;
    
    responderMutation.mutate({
      id: selectedSolicitacao.id,
      resposta,
      status: novoStatus,
    }, {
      onSuccess: () => {
        setIsRespondOpen(false);
        setSelectedSolicitacao(null);
        setResposta('');
        setNovoStatus('concluida');
      },
    });
  };

  const openResponder = (sol: Solicitacao) => {
    setSelectedSolicitacao(sol);
    setIsRespondOpen(true);
  };

  // Estatísticas
  const pendentesRecebidas = recebidas.filter(s => s.status === 'pendente').length;
  const emAndamentoRecebidas = recebidas.filter(s => s.status === 'em_andamento').length;
  const concluidasRecebidas = recebidas.filter(s => s.status === 'concluida').length;
  const urgentesRecebidas = recebidas.filter(s => s.prioridade === 'urgente' && s.status === 'pendente').length;

  const renderSolicitacaoCard = (sol: Solicitacao, isRecebida: boolean) => {
    const prioConfig = PRIORIDADE_CONFIG[sol.prioridade] || PRIORIDADE_CONFIG.normal;
    const statusConfig = STATUS_CONFIG[sol.status] || STATUS_CONFIG.pendente;
    const PrioIcon = prioConfig.icon;
    const StatusIcon = statusConfig.icon;

    return (
      <Card key={sol.id} className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={prioConfig.color}>
                <PrioIcon className="w-3 h-3 mr-1" />
                {prioConfig.label}
              </Badge>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            {isRecebida && sol.status === 'pendente' && (
              <Button size="sm" onClick={() => openResponder(sol)}>
                <Send className="w-4 h-4 mr-1" />
                Responder
              </Button>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-2">{sol.titulo}</h3>
          {sol.descricao && (
            <p className="text-muted-foreground text-sm mb-3">{sol.descricao}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{isRecebida ? `De: ${sol.remetente?.name || 'Desconhecido'}` : `Para: ${sol.destinatario?.name || 'Desconhecido'}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{sol.created_at ? format(new Date(sol.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</span>
            </div>
            {sol.prazo && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Prazo: {format(new Date(sol.prazo), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          {sol.cliente && (
            <Badge variant="outline" className="mb-3">
              Cliente: {sol.cliente.name}
            </Badge>
          )}

          {sol.resposta && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Resposta:</p>
              <p className="text-sm">{sol.resposta}</p>
              {sol.respondido_em && (
                <p className="text-xs text-muted-foreground mt-2">
                  Respondido em: {format(new Date(sol.respondido_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Show loading while not in client
  if (!isClient) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Solicitações</h1>
            <p className="text-muted-foreground">Gerencie solicitações entre usuários e funcionários</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Solicitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Destinatário *</Label>
                  <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da solicitação" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a solicitação..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Cliente (opcional)</Label>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendentesRecebidas}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emAndamentoRecebidas}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{concluidasRecebidas}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentesRecebidas}</p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="recebidas">Recebidas ({recebidas.length})</TabsTrigger>
              <TabsTrigger value="enviadas">Enviadas ({enviadas.length})</TabsTrigger>
            </TabsList>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pendente">Pendentes</TabsTrigger>
                <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                <TabsTrigger value="concluida">Concluídas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TabsContent value="recebidas" className="mt-4">
            <ScrollArea className="h-[600px]">
              {loadingRecebidas ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : recebidas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação recebida</p>
                  </CardContent>
                </Card>
              ) : (
                recebidas.map((sol) => renderSolicitacaoCard(sol, true))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="enviadas" className="mt-4">
            <ScrollArea className="h-[600px]">
              {loadingEnviadas ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : enviadas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação enviada</p>
                  </CardContent>
                </Card>
              ) : (
                enviadas.map((sol) => renderSolicitacaoCard(sol, false))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Dialog de Resposta */}
        <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Solicitação</DialogTitle>
            </DialogHeader>
            {selectedSolicitacao && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedSolicitacao.titulo}</p>
                  {selectedSolicitacao.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedSolicitacao.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    De: {selectedSolicitacao.remetente?.name}
                  </p>
                </div>
                <div>
                  <Label>Resposta *</Label>
                  <Textarea 
                    value={resposta} 
                    onChange={(e) => setResposta(e.target.value)} 
                    placeholder="Digite sua resposta..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={novoStatus} onValueChange={setNovoStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleResponder} disabled={responderMutation.isPending}>
                  {responderMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
