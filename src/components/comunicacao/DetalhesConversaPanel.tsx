import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  Tag,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Conversa, STATUS_LABELS } from '@/hooks/useComunicacaoCentral';
import { useExtendedClient } from '@/hooks/useExtendedClients';

interface DetalhesConversaPanelProps {
  conversa: Conversa;
  onClose: () => void;
}

export function DetalhesConversaPanel({ conversa, onClose }: DetalhesConversaPanelProps) {
  const { data: cliente } = useExtendedClient(conversa.cliente_id || undefined);

  return (
    <div className="w-80 border-l flex flex-col bg-muted/20">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Detalhes</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Status */}
          <div>
            <h4 className="text-sm font-medium mb-2">Status</h4>
            <Badge className={STATUS_LABELS[conversa.status]?.color}>
              {STATUS_LABELS[conversa.status]?.label}
            </Badge>
          </div>

          {/* Prioridade */}
          <div>
            <h4 className="text-sm font-medium mb-2">Prioridade</h4>
            <Badge variant="outline" className="capitalize">
              {conversa.prioridade}
            </Badge>
          </div>

          {/* Cliente */}
          {cliente && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{cliente.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Código:</span>
                    <p>#{cliente.code}</p>
                  </div>
                  {cliente.phone1 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{cliente.phone1}</span>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Informações da Conversa */}
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Criada em:</span>
                <span>{format(new Date(conversa.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {conversa.ultima_mensagem_em && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Última msg:</span>
                  <span>{format(new Date(conversa.ultima_mensagem_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Mensagens:</span>
                <span>{conversa.total_mensagens}</span>
              </div>
            </div>
          </div>

          {/* Etiquetas */}
          {conversa.etiquetas && conversa.etiquetas.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </h4>
                <div className="flex flex-wrap gap-1">
                  {conversa.etiquetas.map((etiqueta, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {etiqueta}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
