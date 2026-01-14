import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTarefasRafael, useCreateTarefaRafael, useResponderTarefa } from '@/hooks/useTarefasRafael';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { Plus, CheckCircle, Clock, AlertTriangle, MessageSquare, User, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: AlertTriangle },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
};

export default function PainelRafaelPage() {
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [respostaDialog, setRespostaDialog] = useState<{ open: boolean; tarefaId: string; resposta: string }>({ open: false, tarefaId: '', resposta: '' });
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', descricao: '', prioridade: 'normal', cliente_id: '', prazo: '' });

  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const { data: tarefas, isLoading } = useTarefasRafael(statusFilter);
  const { data: clients } = useClients();
  const createTarefa = useCreateTarefaRafael();
  const responderTarefa = useResponderTarefa();

  const handleCreateTarefa = async () => {
    if (!novaTarefa.titulo) return;
    await createTarefa.mutateAsync({
      titulo: novaTarefa.titulo,
      descricao: novaTarefa.descricao || undefined,
      prioridade: novaTarefa.prioridade,
      cliente_id: novaTarefa.cliente_id || undefined,
      prazo: novaTarefa.prazo || undefined,
    });
    setNovaTarefa({ titulo: '', descricao: '', prioridade: 'normal', cliente_id: '', prazo: '' });
    setDialogOpen(false);
  };

  const handleResponder = async (status: string) => {
    await responderTarefa.mutateAsync({
      id: respostaDialog.tarefaId,
      resposta: respostaDialog.resposta,
      status,
    });
    setRespostaDialog({ open: false, tarefaId: '', resposta: '' });
  };

  const stats = {
    pendentes: tarefas?.filter(t => t.status === 'pendente').length || 0,
    emAndamento: tarefas?.filter(t => t.status === 'em_andamento').length || 0,
    concluidas: tarefas?.filter(t => t.status === 'concluida').length || 0,
    urgentes: tarefas?.filter(t => t.prioridade === 'urgente' && t.status === 'pendente').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? 'Painel de Tarefas' : 'Enviar para Rafael'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Gerencie as solicitações recebidas' : 'Envie solicitações e acompanhe as respostas'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Solicitação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Solicitação para Rafael</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
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
                  placeholder="Descreva detalhadamente o que precisa..."
                  rows={4}
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                />
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
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
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
              <div>
                <Label>Cliente Relacionado (opcional)</Label>
                <Select 
                  value={novaTarefa.cliente_id} 
                  onValueChange={(v) => setNovaTarefa({ ...novaTarefa, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTarefa} disabled={createTarefa.isPending || !novaTarefa.titulo} className="w-full">
                {createTarefa.isPending ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.concluidas}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgentes}</p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
          <TabsTrigger value="concluida">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : !tarefas?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tarefas.map((tarefa) => {
                const StatusIcon = STATUS_CONFIG[tarefa.status]?.icon || Clock;
                return (
                  <Card key={tarefa.id} className={tarefa.prioridade === 'urgente' && tarefa.status === 'pendente' ? 'border-red-500' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={PRIORIDADE_CONFIG[tarefa.prioridade]?.color}>
                              {PRIORIDADE_CONFIG[tarefa.prioridade]?.label}
                            </Badge>
                            <Badge className={STATUS_CONFIG[tarefa.status]?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[tarefa.status]?.label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{tarefa.titulo}</h3>
                          {tarefa.descricao && (
                            <p className="text-muted-foreground mt-1">{tarefa.descricao}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {tarefa.profiles?.name || 'Usuário'}
                            </span>
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
                              <span className="text-primary">Cliente: {tarefa.clients.name}</span>
                            )}
                          </div>
                          {tarefa.resposta && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Resposta:</p>
                              <p className="text-sm">{tarefa.resposta}</p>
                              {tarefa.respondido_em && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Respondido {formatDistanceToNow(new Date(tarefa.respondido_em), { addSuffix: true, locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {isAdmin && tarefa.status === 'pendente' && (
                          <Button 
                            variant="outline"
                            onClick={() => setRespostaDialog({ open: true, tarefaId: tarefa.id, resposta: '' })}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" /> Responder
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Resposta */}
      <Dialog open={respostaDialog.open} onOpenChange={(open) => setRespostaDialog({ ...respostaDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Resposta</Label>
              <Textarea 
                placeholder="Digite sua resposta..."
                rows={4}
                value={respostaDialog.resposta}
                onChange={(e) => setRespostaDialog({ ...respostaDialog, resposta: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleResponder('em_andamento')}
                disabled={responderTarefa.isPending}
              >
                Em Andamento
              </Button>
              <Button 
                className="flex-1"
                onClick={() => handleResponder('concluida')}
                disabled={responderTarefa.isPending}
              >
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
