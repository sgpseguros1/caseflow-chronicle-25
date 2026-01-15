import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  User,
  Building2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TIPO_PROTOCOLO_LABELS, 
  TIPO_PROTOCOLO_COLORS,
  STATUS_PROTOCOLO_LABELS,
  STATUS_PROTOCOLO_COLORS,
  type TipoProtocolo 
} from '@/types/protocolo';
import type { ProtocoloComMetricas } from '@/hooks/useDashboardProtocolos';

interface ProtocolosKanbanBoardProps {
  protocolos: ProtocoloComMetricas[];
  onProtocoloClick?: (id: string) => void;
}

const TEMAS_KANBAN: TipoProtocolo[] = [
  'SEGURO_VIDA',
  'AUXILIO_ACIDENTE',
  'DPVAT',
  'INSS',
  'PREVIDENCIARIO',
  'DANOS_ADMINISTRATIVO',
  'JUDICIAL',
  'JUDICIAL_CIVEL',
  'SEGURO_VIDA_EMPRESARIAL',
  'ADMINISTRATIVO_SEGURADORA',
  'RAFAEL_PROTOCOLAR',
];

function ProtocoloCard({ protocolo }: { protocolo: ProtocoloComMetricas }) {
  const diasParado = protocolo.dias_parado || 0;
  const isCritico = diasParado >= 15;
  const isAtrasado = diasParado >= 7;

  return (
    <Card className={`mb-2 hover:shadow-md transition-shadow cursor-pointer ${
      isCritico ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' :
      isAtrasado ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {protocolo.cliente?.name || 'Cliente não vinculado'}
            </p>
            <p className="text-xs text-muted-foreground">
              #{protocolo.codigo}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className={`text-xs shrink-0 ${STATUS_PROTOCOLO_COLORS[protocolo.status]} text-white`}
          >
            {STATUS_PROTOCOLO_LABELS[protocolo.status]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3" />
          <span className={`font-medium ${
            isCritico ? 'text-red-600' :
            isAtrasado ? 'text-orange-600' : ''
          }`}>
            {diasParado}d parado
          </span>
          {isCritico && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>

        {protocolo.funcionario && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{protocolo.funcionario.nome}</span>
          </div>
        )}

        {protocolo.seguradora && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{protocolo.seguradora.razao_social}</span>
          </div>
        )}

        <div className="flex justify-end mt-2">
          <Button size="sm" variant="ghost" className="h-6 text-xs" asChild>
            <Link to={`/protocolos/${protocolo.id}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  tema, 
  protocolos 
}: { 
  tema: TipoProtocolo; 
  protocolos: ProtocoloComMetricas[];
}) {
  const filtrados = protocolos.filter(p => p.tipo === tema);
  const ativos = filtrados.filter(p => 
    !['pago', 'encerrado_sucesso', 'encerrado_prejuizo', 'arquivado'].includes(p.status)
  );
  const atrasados = ativos.filter(p => (p.dias_parado || 0) >= 7).length;

  return (
    <div className="flex-shrink-0 w-72">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${TIPO_PROTOCOLO_COLORS[tema]}`} />
              <CardTitle className="text-sm font-medium">
                {TIPO_PROTOCOLO_LABELS[tema]}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {ativos.length}
              </Badge>
              {atrasados > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {atrasados} atrasados
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[500px] pr-2">
            {ativos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhum protocolo ativo
              </div>
            ) : (
              ativos
                .sort((a, b) => (b.dias_parado || 0) - (a.dias_parado || 0))
                .map(protocolo => (
                  <ProtocoloCard key={protocolo.id} protocolo={protocolo} />
                ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtocolosKanbanBoard({ protocolos }: ProtocolosKanbanBoardProps) {
  // Filter only themes that have protocols
  const temasComProtocolos = useMemo(() => {
    const temasAtivos = new Set(protocolos.map(p => p.tipo));
    return TEMAS_KANBAN.filter(tema => temasAtivos.has(tema));
  }, [protocolos]);

  // Add remaining themes at the end
  const temasOrdenados = useMemo(() => {
    const restantes = TEMAS_KANBAN.filter(tema => !temasComProtocolos.includes(tema));
    return [...temasComProtocolos, ...restantes];
  }, [temasComProtocolos]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {temasOrdenados.map(tema => (
          <KanbanColumn 
            key={tema} 
            tema={tema} 
            protocolos={protocolos} 
          />
        ))}
      </div>
    </div>
  );
}
