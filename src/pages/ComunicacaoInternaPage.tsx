import { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, Send, Plus, User, Clock, Check, CheckCheck, 
  AlertTriangle, CheckCircle, XCircle, Calendar, ListTodo, MessagesSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConversas, useMensagensConversa, useEnviarMensagem, useMarcarMensagensLidas, useUsuariosParaChat } from '@/hooks/useChatInterno';
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

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Ontem ${format(date, 'HH:mm')}`;
  return format(date, 'dd/MM HH:mm');
}

const PRIORIDADE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  baixa: { label: 'Baixa', emoji: '🟢', color: 'bg-muted text-foreground' },
  normal: { label: 'Normal', emoji: '🔵', color: 'bg-info/20 text-info' },
  alta: { label: 'Alta', emoji: '🟠', color: 'bg-warning/20 text-warning' },
  urgente: { label: 'Urgente', emoji: '🔴', color: 'bg-destructive/20 text-destructive' },
};

const STATUS_SOLICITACAO: Record<string, { label: string; emoji: string; color: string }> = {
  pendente: { label: 'Pendente', emoji: '⏳', color: 'bg-primary/20 text-primary' },
  em_andamento: { label: 'Em Andamento', emoji: '🔄', color: 'bg-info/20 text-info' },
  concluida: { label: 'Concluída', emoji: '✅', color: 'bg-success/20 text-success' },
  cancelada: { label: 'Cancelada', emoji: '❌', color: 'bg-muted text-muted-foreground' },
};

export default function ComunicacaoInternaPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [novaConversaOpen, setNovaConversaOpen] = useState(false);
  const [novaSolicitacaoOpen, setNovaSolicitacaoOpen] = useState(false);
  const [respostaOpen, setRespostaOpen] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<Solicitacao | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form state para solicitação
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('normal');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [prazo, setPrazo] = useState('');
  const [resposta, setResposta] = useState('');
  const [novoStatus, setNovoStatus] = useState('concluida');

  const { user } = useAuth();
  const { data: conversas, isLoading: loadingConversas } = useConversas();
  const { data: mensagens, isLoading: loadingMensagens } = useMensagensConversa(conversaSelecionada || undefined);
  const { data: usuariosChat } = useUsuariosParaChat();
  const enviarMensagem = useEnviarMensagem();
  const marcarLidas = useMarcarMensagensLidas();

  const { data: recebidas = [] } = useSolicitacoesRecebidas('todas');
  const { data: enviadas = [] } = useSolicitacoesEnviadas('todas');
  const { data: usuariosSolicitacao = [] } = useUsuariosDisponiveis();
  const { data: clientes = [] } = useClients();
  const createSolicitacao = useCreateSolicitacao();
  const responderSolicitacao = useResponderSolicitacao();

  // Scroll to bottom quando mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Marcar mensagens como lidas
  useEffect(() => {
    if (conversaSelecionada) {
      marcarLidas.mutate(conversaSelecionada);
    }
  }, [conversaSelecionada]);

  const handleEnviarMensagem = async () => {
    if (!mensagem.trim() || !conversaSelecionada) return;
    await enviarMensagem.mutateAsync({
      destinatario_id: conversaSelecionada,
      conteudo: mensagem.trim(),
    });
    setMensagem('');
  };

  const handleNovaConversa = (usuarioId: string) => {
    setConversaSelecionada(usuarioId);
    setNovaConversaOpen(false);
  };

  const handleCriarSolicitacao = () => {
    if (!titulo || !destinatarioId) return;
    createSolicitacao.mutate({
      titulo,
      descricao: descricao || undefined,
      prioridade,
      destinatario_id: destinatarioId,
      cliente_id: clienteId || undefined,
      prazo: prazo || undefined,
    }, {
      onSuccess: () => {
        setNovaSolicitacaoOpen(false);
        setTitulo('');
        setDescricao('');
        setPrioridade('normal');
        setDestinatarioId('');
        setClienteId('');
        setPrazo('');
      },
    });
  };

  const handleResponderSolicitacao = () => {
    if (!solicitacaoSelecionada || !resposta) return;
    responderSolicitacao.mutate({
      id: solicitacaoSelecionada.id,
      resposta,
      status: novoStatus,
    }, {
      onSuccess: () => {
        setRespostaOpen(false);
        setSolicitacaoSelecionada(null);
        setResposta('');
        setNovoStatus('concluida');
      },
    });
  };

  const conversaAtual = conversas?.find(c => c.usuarioId === conversaSelecionada);
  const totalNaoLidas = conversas?.reduce((acc, c) => acc + c.naoLidas, 0) || 0;
  const pendentesRecebidas = recebidas.filter(s => s.status === 'pendente').length;
  const urgentesRecebidas = recebidas.filter(s => s.prioridade === 'urgente' && s.status === 'pendente').length;

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-card to-secondary/30 p-6 rounded-2xl border border-border/50">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-3 bg-primary rounded-xl">
              <MessagesSquare className="h-8 w-8 text-primary-foreground" />
            </div>
            Comunicação Interna
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Chat e Solicitações em um só lugar 💬</p>
        </div>
        <div className="flex gap-3">
          {totalNaoLidas > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              💬 {totalNaoLidas} mensagens
            </Badge>
          )}
          {pendentesRecebidas > 0 && (
            <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
              📋 {pendentesRecebidas} pendentes
            </Badge>
          )}
          {urgentesRecebidas > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              🚨 {urgentesRecebidas} urgentes
            </Badge>
          )}
        </div>
      </div>

      {/* TABS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-7rem)]">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
          <TabsTrigger value="chat" className="text-base gap-2 py-3">
            <MessageSquare className="h-5 w-5" />
            Chat Direto
            {totalNaoLidas > 0 && <Badge variant="destructive" className="ml-1">{totalNaoLidas}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="solicitacoes" className="text-base gap-2 py-3">
            <ListTodo className="h-5 w-5" />
            Solicitações
            {pendentesRecebidas > 0 && <Badge className="bg-yellow-500 ml-1">{pendentesRecebidas}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* TAB: CHAT */}
        <TabsContent value="chat" className="h-full mt-0">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Lista de Conversas */}
            <Card className="col-span-4 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">💬 Conversas</CardTitle>
                  <Dialog open={novaConversaOpen} onOpenChange={setNovaConversaOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>➕ Nova Conversa</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[300px] mt-4">
                        <div className="space-y-2">
                          {usuariosChat?.map((usuario) => (
                            <Button
                              key={usuario.id}
                              variant="ghost"
                              className="w-full justify-start h-16"
                              onClick={() => handleNovaConversa(usuario.id)}
                            >
                              <Avatar className="w-10 h-10 mr-3">
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                                  {usuario.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="font-medium text-base">{usuario.name}</p>
                                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  {loadingConversas ? (
                    <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                  ) : !conversas?.length ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Nenhuma conversa</p>
                      <p className="text-sm text-muted-foreground">Clique em + para iniciar</p>
                    </div>
                  ) : (
                    <div>
                      {conversas.map((conversa) => (
                        <button
                          key={conversa.usuarioId}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${
                            conversaSelecionada === conversa.usuarioId ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                          }`}
                          onClick={() => setConversaSelecionada(conversa.usuarioId)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                                {conversa.nome?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold text-base truncate">{conversa.nome}</p>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageDate(conversa.dataUltimaMensagem)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground truncate">{conversa.ultimaMensagem}</p>
                                {conversa.naoLidas > 0 && (
                                  <Badge variant="destructive" className="ml-2">{conversa.naoLidas}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Área de Mensagens */}
            <Card className="col-span-8 flex flex-col">
              {!conversaSelecionada ? (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">Selecione uma conversa</p>
                    <p className="text-muted-foreground">ou inicie uma nova clicando no +</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-2 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                          {conversaAtual?.nome?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{conversaAtual?.nome || 'Usuário'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{conversaAtual?.email}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                      {loadingMensagens ? (
                        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                      ) : !mensagens?.length ? (
                        <p className="text-center py-8 text-muted-foreground">Nenhuma mensagem. Diga olá! 👋</p>
                      ) : (
                        <div className="space-y-4">
                          {mensagens.map((msg) => {
                            const isMe = msg.remetente_id === user?.id;
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%]`}>
                                  <div className={`px-4 py-3 rounded-2xl text-base ${
                                    isMe 
                                      ? 'bg-blue-500 text-white rounded-br-md' 
                                      : 'bg-muted rounded-bl-md'
                                  }`}>
                                    <p>{msg.conteudo}</p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                                    <span>{formatMessageDate(msg.created_at)}</span>
                                    {isMe && (
                                      msg.lida 
                                        ? <CheckCheck className="w-4 h-4 text-blue-500" />
                                        : <Check className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>

                  <div className="p-4 border-t bg-muted/30">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEnviarMensagem()}
                        className="h-12 text-base"
                      />
                      <Button 
                        onClick={handleEnviarMensagem} 
                        disabled={enviarMensagem.isPending || !mensagem.trim()}
                        className="h-12 px-6 bg-blue-500 hover:bg-blue-600"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* TAB: SOLICITAÇÕES */}
        <TabsContent value="solicitacoes" className="h-full mt-0">
          <div className="space-y-4">
            {/* Botão Nova Solicitação */}
            <div className="flex justify-end">
              <Dialog open={novaSolicitacaoOpen} onOpenChange={setNovaSolicitacaoOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-500 hover:bg-purple-600 h-12 text-base gap-2">
                    <Plus className="w-5 h-5" />
                    Nova Solicitação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">📋 Nova Solicitação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-base">Para quem? *</Label>
                      <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                        <SelectTrigger className="h-12 text-base mt-1">
                          <SelectValue placeholder="Selecione o destinatário" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuariosSolicitacao.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base">O que precisa? *</Label>
                      <Input 
                        value={titulo} 
                        onChange={(e) => setTitulo(e.target.value)} 
                        placeholder="Título da solicitação" 
                        className="h-12 text-base mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-base">Detalhes</Label>
                      <Textarea 
                        value={descricao} 
                        onChange={(e) => setDescricao(e.target.value)} 
                        placeholder="Descreva melhor..."
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base">Urgência</Label>
                        <Select value={prioridade} onValueChange={setPrioridade}>
                          <SelectTrigger className="h-12 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">🟢 Baixa</SelectItem>
                            <SelectItem value="normal">🔵 Normal</SelectItem>
                            <SelectItem value="alta">🟠 Alta</SelectItem>
                            <SelectItem value="urgente">🔴 Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-base">Prazo</Label>
                        <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="h-12 mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base">Cliente relacionado</Label>
                      <Select value={clienteId || "__none__"} onValueChange={(val) => setClienteId(val === "__none__" ? "" : val)}>
                        <SelectTrigger className="h-12 mt-1">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full h-12 text-base bg-purple-500 hover:bg-purple-600" 
                      onClick={handleCriarSolicitacao} 
                      disabled={createSolicitacao.isPending}
                    >
                      {createSolicitacao.isPending ? 'Enviando...' : '📤 Enviar Solicitação'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{recebidas.filter(s => s.status === 'pendente').length}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{recebidas.filter(s => s.status === 'em_andamento').length}</p>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{recebidas.filter(s => s.status === 'concluida').length}</p>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{urgentesRecebidas}</p>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Recebidas/Enviadas */}
            <Tabs defaultValue="recebidas">
              <TabsList>
                <TabsTrigger value="recebidas" className="gap-2">
                  📥 Recebidas ({recebidas.length})
                </TabsTrigger>
                <TabsTrigger value="enviadas" className="gap-2">
                  📤 Enviadas ({enviadas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recebidas">
                <ScrollArea className="h-[400px]">
                  {recebidas.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <ListTodo className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg text-muted-foreground">Nenhuma solicitação recebida</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {recebidas.map((sol) => {
                        const prio = PRIORIDADE_CONFIG[sol.prioridade] || PRIORIDADE_CONFIG.normal;
                        const status = STATUS_SOLICITACAO[sol.status] || STATUS_SOLICITACAO.pendente;
                        return (
                          <Card key={sol.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex gap-2">
                                  <Badge className={prio.color}>{prio.emoji} {prio.label}</Badge>
                                  <Badge className={status.color}>{status.emoji} {status.label}</Badge>
                                </div>
                                {sol.status === 'pendente' && (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => {
                                      setSolicitacaoSelecionada(sol);
                                      setRespostaOpen(true);
                                    }}
                                  >
                                    ✅ Responder
                                  </Button>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg">{sol.titulo}</h3>
                              {sol.descricao && <p className="text-muted-foreground mt-1">{sol.descricao}</p>}
                              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                                <span>👤 De: {sol.remetente?.name || 'Desconhecido'}</span>
                                <span>📅 {sol.created_at ? format(new Date(sol.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
                                {sol.prazo && <span>⏰ Prazo: {format(new Date(sol.prazo), "dd/MM/yyyy", { locale: ptBR })}</span>}
                              </div>
                              {sol.resposta && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                                  <p className="font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                                  <p className="mt-1">{sol.resposta}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="enviadas">
                <ScrollArea className="h-[400px]">
                  {enviadas.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Send className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg text-muted-foreground">Nenhuma solicitação enviada</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {enviadas.map((sol) => {
                        const prio = PRIORIDADE_CONFIG[sol.prioridade] || PRIORIDADE_CONFIG.normal;
                        const status = STATUS_SOLICITACAO[sol.status] || STATUS_SOLICITACAO.pendente;
                        return (
                          <Card key={sol.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex gap-2 mb-2">
                                <Badge className={prio.color}>{prio.emoji} {prio.label}</Badge>
                                <Badge className={status.color}>{status.emoji} {status.label}</Badge>
                              </div>
                              <h3 className="font-semibold text-lg">{sol.titulo}</h3>
                              {sol.descricao && <p className="text-muted-foreground mt-1">{sol.descricao}</p>}
                              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                                <span>👤 Para: {sol.destinatario?.name || 'Desconhecido'}</span>
                                <span>📅 {sol.created_at ? format(new Date(sol.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
                              </div>
                              {sol.resposta && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                                  <p className="font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                                  <p className="mt-1">{sol.resposta}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Responder */}
      <Dialog open={respostaOpen} onOpenChange={setRespostaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">✅ Responder Solicitação</DialogTitle>
          </DialogHeader>
          {solicitacaoSelecionada && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{solicitacaoSelecionada.titulo}</p>
                {solicitacaoSelecionada.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{solicitacaoSelecionada.descricao}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">De: {solicitacaoSelecionada.remetente?.name}</p>
              </div>
              <div>
                <Label className="text-base">Sua Resposta *</Label>
                <Textarea 
                  value={resposta} 
                  onChange={(e) => setResposta(e.target.value)} 
                  placeholder="Digite sua resposta..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-base">Novo Status</Label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger className="h-12 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">🔄 Em Andamento</SelectItem>
                    <SelectItem value="concluida">✅ Concluída</SelectItem>
                    <SelectItem value="cancelada">❌ Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full h-12 text-base bg-green-500 hover:bg-green-600" 
                onClick={handleResponderSolicitacao}
                disabled={responderSolicitacao.isPending}
              >
                {responderSolicitacao.isPending ? 'Enviando...' : '📤 Enviar Resposta'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
