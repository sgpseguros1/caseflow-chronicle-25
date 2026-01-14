import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConversas, useMensagensConversa, useEnviarMensagem, useMarcarMensagensLidas, useUsuariosParaChat } from '@/hooks/useChatInterno';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Plus, User, Clock, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return `Ontem ${format(date, 'HH:mm')}`;
  }
  return format(date, 'dd/MM HH:mm');
}

export default function ChatInternoPage() {
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [novaConversaOpen, setNovaConversaOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { data: conversas, isLoading: loadingConversas } = useConversas();
  const { data: mensagens, isLoading: loadingMensagens } = useMensagensConversa(conversaSelecionada || undefined);
  const { data: usuarios } = useUsuariosParaChat();
  const enviarMensagem = useEnviarMensagem();
  const marcarLidas = useMarcarMensagensLidas();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Marcar mensagens como lidas ao abrir conversa
  useEffect(() => {
    if (conversaSelecionada) {
      marcarLidas.mutate(conversaSelecionada);
    }
  }, [conversaSelecionada]);

  const handleEnviar = async () => {
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

  const conversaAtual = conversas?.find(c => c.usuarioId === conversaSelecionada);
  const totalNaoLidas = conversas?.reduce((acc, c) => acc + c.naoLidas, 0) || 0;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat Interno</h1>
          <p className="text-muted-foreground">Comunicação privada entre usuários</p>
        </div>
        {totalNaoLidas > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {totalNaoLidas} não lidas
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        {/* Lista de Conversas */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Conversas</CardTitle>
              <Dialog open={novaConversaOpen} onOpenChange={setNovaConversaOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px] mt-4">
                    <div className="space-y-2">
                      {usuarios?.map((usuario) => (
                        <Button
                          key={usuario.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleNovaConversa(usuario.id)}
                        >
                          <Avatar className="w-8 h-8 mr-3">
                            <AvatarFallback>{usuario.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium">{usuario.name}</p>
                            <p className="text-xs text-muted-foreground">{usuario.email}</p>
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
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
                  <p className="text-xs text-muted-foreground">Clique em + para iniciar</p>
                </div>
              ) : (
                <div>
                  {conversas.map((conversa) => (
                    <button
                      key={conversa.usuarioId}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b ${
                        conversaSelecionada === conversa.usuarioId ? 'bg-muted' : ''
                      }`}
                      onClick={() => setConversaSelecionada(conversa.usuarioId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{conversa.nome?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{conversa.nome}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageDate(conversa.dataUltimaMensagem)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground truncate">{conversa.ultimaMensagem}</p>
                            {conversa.naoLidas > 0 && (
                              <Badge variant="destructive" className="text-xs ml-2">{conversa.naoLidas}</Badge>
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
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Selecione uma conversa</p>
                <p className="text-sm text-muted-foreground">ou inicie uma nova</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header da conversa */}
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{conversaAtual?.nome?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{conversaAtual?.nome || 'Usuário'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{conversaAtual?.email}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {loadingMensagens ? (
                    <p className="text-center py-8 text-muted-foreground">Carregando mensagens...</p>
                  ) : !mensagens?.length ? (
                    <p className="text-center py-8 text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
                  ) : (
                    <div className="space-y-4">
                      {mensagens.map((msg) => {
                        const isMe = msg.remetente_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                              <div className={`px-4 py-2 rounded-2xl ${
                                isMe 
                                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                                  : 'bg-muted rounded-bl-md'
                              }`}>
                                <p className="text-sm">{msg.conteudo}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                                <span>{formatMessageDate(msg.created_at)}</span>
                                {isMe && (
                                  msg.lida 
                                    ? <CheckCheck className="w-3 h-3 text-blue-500" />
                                    : <Check className="w-3 h-3" />
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

              {/* Input de mensagem */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
                  />
                  <Button onClick={handleEnviar} disabled={enviarMensagem.isPending || !mensagem.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
