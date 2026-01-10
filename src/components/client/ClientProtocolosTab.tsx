import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText, DollarSign, AlertTriangle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProtocolosByCliente } from '@/hooks/useProtocolos';
import { ProtocoloStatusBadge } from '@/components/protocolos/ProtocoloStatusBadge';
import { ProtocoloTipoBadge } from '@/components/protocolos/ProtocoloTipoBadge';
import { ProtocoloEtiquetas } from '@/components/protocolos/ProtocoloEtiquetas';
import { ClientProtocoloTags } from './ClientProtocoloTags';
import { ClientProtocoloForm } from './ClientProtocoloForm';
import { ClientProtocoloEdit } from './ClientProtocoloEdit';
import { PRIORIDADE_LABELS, PRIORIDADE_COLORS, TipoProtocolo } from '@/types/protocolo';
import { cn } from '@/lib/utils';
import type { Protocolo } from '@/types/protocolo';

interface ClientProtocolosTabProps {
  clienteId: string;
  clienteName: string;
  canEdit: boolean;
}

export function ClientProtocolosTab({ clienteId, clienteName, canEdit }: ClientProtocolosTabProps) {
  const navigate = useNavigate();
  const { data: protocolos = [], isLoading } = useProtocolosByCliente(clienteId);
  const [selectedProtocolo, setSelectedProtocolo] = useState<Protocolo | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Calcular etiquetas automáticas por tipo
  const protocoloCounts = Object.entries(
    protocolos.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {} as Record<TipoProtocolo, number>)
  ).map(([tipo, count]) => ({ tipo: tipo as TipoProtocolo, count }));

  // Calcular dias parado para cada protocolo
  const protocolosComDias = protocolos.map(p => ({
    ...p,
    dias_parado: p.data_ultima_movimentacao 
      ? Math.floor((Date.now() - new Date(p.data_ultima_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }));

  const handleOpenEdit = (protocolo: Protocolo) => {
    setSelectedProtocolo(protocolo);
    setIsEditOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando protocolos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seção de Etiquetas Automáticas do Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🏷️ Etiquetas do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {protocoloCounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum protocolo cadastrado</p>
          ) : (
            <ClientProtocoloTags protocoloCounts={protocoloCounts} />
          )}
        </CardContent>
      </Card>

      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Protocolos ({protocolos.length})</h3>
          <p className="text-sm text-muted-foreground">
            Gerenciar todos os protocolos deste cliente
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Protocolo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Protocolo para {clienteName}</DialogTitle>
              </DialogHeader>
              <ClientProtocoloForm 
                clienteId={clienteId} 
                onSuccess={() => setIsCreateOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Protocolos */}
      {protocolosComDias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum protocolo vinculado a este cliente</p>
            {canEdit && (
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Protocolo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {protocolosComDias.map((protocolo) => (
            <Card 
              key={protocolo.id}
              className={cn(
                'hover:shadow-md transition-shadow',
                protocolo.dias_parado >= 60 && 'border-red-500 border-2',
                protocolo.dias_parado >= 45 && protocolo.dias_parado < 60 && 'border-orange-500 border-2',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono font-semibold text-sm">#{protocolo.codigo}</span>
                      <ProtocoloTipoBadge tipo={protocolo.tipo} />
                      <ProtocoloStatusBadge status={protocolo.status} />
                      <Badge className={cn('text-white border-0', PRIORIDADE_COLORS[protocolo.prioridade])}>
                        {PRIORIDADE_LABELS[protocolo.prioridade]}
                      </Badge>
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                      {protocolo.funcionario && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{protocolo.funcionario.nome}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Criado em {format(new Date(protocolo.data_protocolo), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      {protocolo.dias_parado > 0 && (
                        <div className={cn(
                          "flex items-center gap-1",
                          protocolo.dias_parado >= 45 && 'text-destructive font-medium'
                        )}>
                          <AlertTriangle className="h-3 w-3" />
                          <span>{protocolo.dias_parado} dias parado</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Etiquetas */}
                    <ProtocoloEtiquetas 
                      etiquetas={protocolo.etiquetas || []} 
                      diasParado={protocolo.dias_parado}
                    />
                  </div>
                  
                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => navigate(`/protocolos/${protocolo.id}`)}
                      title="Ver Dashboard"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleOpenEdit(protocolo)}
                        title="Editar Protocolo"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Protocolo #{selectedProtocolo?.codigo}
            </DialogTitle>
          </DialogHeader>
          {selectedProtocolo && (
            <ClientProtocoloEdit 
              protocolo={selectedProtocolo}
              onSuccess={() => {
                setIsEditOpen(false);
                setSelectedProtocolo(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
