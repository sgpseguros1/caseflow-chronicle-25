import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  MessageSquare,
  Mail,
  Phone,
  Zap,
  PhoneCall,
  Facebook,
  Instagram,
  Send,
  Search,
  Filter,
  User,
  Clock,
  CheckCheck,
  Check,
  MoreVertical,
  UserPlus,
  Tag,
  Archive,
  AlertCircle,
  Paperclip,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useConversas,
  useMensagensConversa,
  useEnviarMensagem,
  useAtualizarConversa,
  useComunicacaoStats,
  Conversa,
  Mensagem,
  STATUS_LABELS,
} from '@/hooks/useComunicacaoCentral';
import { useAuth } from '@/hooks/useAuth';
import { NovaConversaDialog } from './NovaConversaDialog';
import { DetalhesConversaPanel } from './DetalhesConversaPanel';

const CANAL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  whatsapp: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-green-600', bg: 'bg-green-100', label: 'WhatsApp' },
  email: { icon: <Mail className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'E-mail' },
  sms: { icon: <Phone className="h-4 w-4" />, color: 'text-purple-600', bg: 'bg-purple-100', label: 'SMS' },
  interno: { icon: <Zap className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Interno' },
  telefone: { icon: <PhoneCall className="h-4 w-4" />, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Telefone' },
  facebook: { icon: <Facebook className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-blue-50', label: 'Facebook' },
  instagram: { icon: <Instagram className="h-4 w-4" />, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Instagram' },
};

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem';
  return format(date, 'dd/MM', { locale: ptBR });
}

function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function CaixaEntradaUnificada() {
  const { user } = useAuth();
  const [selectedConversaId, setSelectedConversaId] = useState<string | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [canalFilter, setCanalFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversas = [], isLoading: loadingConversas } = useConversas({
    canal: canalFilter,
    status: statusFilter,
  });
  const { data: mensagens = [], isLoading: loadingMensagens } = useMensagensConversa(selectedConversaId || undefined);
  const { data: stats } = useComunicacaoStats();
  const enviarMensagem = useEnviarMensagem();
  const atualizarConversa = useAtualizarConversa();

  const conversaSelecionada = conversas.find(c => c.id === selectedConversaId);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Filter by search
  const conversasFiltradas = conversas.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.titulo?.toLowerCase().includes(search) ||
      c.cliente?.name?.toLowerCase().includes(search) ||
      c.ultima_mensagem?.toLowerCase().includes(search)
    );
  });

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !selectedConversaId || !conversaSelecionada) return;

    await enviarMensagem.mutateAsync({
      conversa_id: selectedConversaId,
      canal: conversaSelecionada.canal,
      conteudo: novaMensagem.trim(),
      cliente_id: conversaSelecionada.cliente_id || undefined,
    });

    setNovaMensagem('');
  };

  const handleResolverConversa = () => {
    if (!selectedConversaId) return;
    atualizarConversa.mutate({ id: selectedConversaId, status: 'resolvido' });
  };

  const handleArquivarConversa = () => {
    if (!selectedConversaId) return;
    atualizarConversa.mutate({ id: selectedConversaId, status: 'arquivado' });
  };

  return (
    <div className="flex h-[calc(100vh-180px)] border rounded-lg overflow-hidden bg-card">
      {/* Lista de Conversas - Lado Esquerdo */}
      <div className="w-80 border-r flex flex-col">
        {/* Header da lista */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Caixa de Entrada</h2>
            <Button size="sm" onClick={() => setShowNovaConversa(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={canalFilter} onValueChange={setCanalFilter}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os canais</SelectItem>
                {Object.entries(CANAL_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span className={config.color}>{config.icon}</span>
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {stats?.abertas || 0} abertos
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {stats?.emAtendimento || 0} em atend.
            </Badge>
            {(stats?.naoLidas || 0) > 0 && (
              <Badge variant="destructive">{stats?.naoLidas} não lidas</Badge>
            )}
          </div>
        </div>

        {/* Lista de Conversas */}
        <ScrollArea className="flex-1">
          {loadingConversas ? (
            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma conversa encontrada</p>
              <Button variant="link" size="sm" onClick={() => setShowNovaConversa(true)}>
                Iniciar nova conversa
              </Button>
            </div>
          ) : (
            conversasFiltradas.map((conversa) => {
              const canalConfig = CANAL_CONFIG[conversa.canal] || CANAL_CONFIG.interno;
              const isSelected = conversa.id === selectedConversaId;

              return (
                <div
                  key={conversa.id}
                  onClick={() => setSelectedConversaId(conversa.id)}
                  className={cn(
                    'p-3 border-b cursor-pointer transition-colors hover:bg-muted/50',
                    isSelected && 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar com ícone do canal */}
                    <div className={cn('p-2 rounded-full', canalConfig.bg, canalConfig.color)}>
                      {canalConfig.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {conversa.cliente?.name || conversa.titulo || 'Conversa'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {conversa.ultima_mensagem_em ? formatMessageDate(conversa.ultima_mensagem_em) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {conversa.cliente && (
                          <Badge variant="outline" className="text-xs py-0">
                            #{conversa.cliente.code}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs py-0', STATUS_LABELS[conversa.status]?.color)}
                        >
                          {STATUS_LABELS[conversa.status]?.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversa.ultima_mensagem || 'Sem mensagens'}
                      </p>
                    </div>

                    {conversa.nao_lidas > 0 && (
                      <Badge className="bg-primary">{conversa.nao_lidas}</Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Área de Mensagens - Centro */}
      <div className="flex-1 flex flex-col">
        {!selectedConversaId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Selecione uma conversa</p>
              <p className="text-sm">Escolha uma conversa à esquerda para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-full',
                  CANAL_CONFIG[conversaSelecionada?.canal || 'interno'].bg,
                  CANAL_CONFIG[conversaSelecionada?.canal || 'interno'].color
                )}>
                  {CANAL_CONFIG[conversaSelecionada?.canal || 'interno'].icon}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {conversaSelecionada?.cliente?.name || conversaSelecionada?.titulo || 'Conversa'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{CANAL_CONFIG[conversaSelecionada?.canal || 'interno'].label}</span>
                    {conversaSelecionada?.cliente && (
                      <>
                        <span>•</span>
                        <span>#{conversaSelecionada.cliente.code}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={STATUS_LABELS[conversaSelecionada?.status || 'aberto'].color}>
                  {STATUS_LABELS[conversaSelecionada?.status || 'aberto'].label}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDetalhes(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Atribuir responsável
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Tag className="mr-2 h-4 w-4" />
                      Adicionar etiqueta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleResolverConversa}>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como resolvido
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleArquivarConversa}>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {loadingMensagens ? (
                <div className="text-center text-muted-foreground">Carregando mensagens...</div>
              ) : mensagens.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie a primeira mensagem abaixo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mensagens.map((msg) => {
                    const isOutgoing = msg.direcao === 'saida';

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg p-3 shadow-sm',
                            isOutgoing
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {msg.atendente_nome && isOutgoing && (
                            <p className="text-xs opacity-70 mb-1">
                              Enviado por {msg.atendente_nome}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <div className={cn(
                            'flex items-center gap-1 justify-end mt-1 text-xs',
                            isOutgoing ? 'opacity-70' : 'text-muted-foreground'
                          )}>
                            <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                            {isOutgoing && (
                              msg.status === 'lido' ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
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

            {/* Input de mensagem */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleEnviarMensagem}
                  disabled={!novaMensagem.trim() || enviarMensagem.isPending}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Painel de Detalhes - Lado Direito */}
      {showDetalhes && conversaSelecionada && (
        <DetalhesConversaPanel
          conversa={conversaSelecionada}
          onClose={() => setShowDetalhes(false)}
        />
      )}

      {/* Dialog Nova Conversa */}
      <NovaConversaDialog
        open={showNovaConversa}
        onOpenChange={setShowNovaConversa}
        onCreated={(id) => {
          setSelectedConversaId(id);
          setShowNovaConversa(false);
        }}
      />
    </div>
  );
}
