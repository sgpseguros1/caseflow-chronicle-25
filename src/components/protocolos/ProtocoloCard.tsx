import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, User, Building2, Clock, DollarSign } from 'lucide-react';
import { ProtocoloStatusBadge } from './ProtocoloStatusBadge';
import { ProtocoloTipoBadge } from './ProtocoloTipoBadge';
import { ProtocoloEtiquetas } from './ProtocoloEtiquetas';
import { PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/protocolo';
import type { Protocolo } from '@/types/protocolo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProtocoloCardProps {
  protocolo: Protocolo;
  className?: string;
}

export function ProtocoloCard({ protocolo, className }: ProtocoloCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  return (
    <Link to={`/protocolos/${protocolo.id}`}>
      <Card className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        protocolo.dias_parado && protocolo.dias_parado >= 60 && 'border-red-500 border-2',
        protocolo.dias_parado && protocolo.dias_parado >= 45 && protocolo.dias_parado < 60 && 'border-orange-500 border-2',
        className
      )}>
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
              
              {/* Cliente */}
              <div className="flex items-center gap-2 text-sm mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{protocolo.cliente?.name || 'Cliente não informado'}</span>
              </div>
              
              {/* Info */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {protocolo.seguradora && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{protocolo.seguradora.razao_social}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(protocolo.data_protocolo), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                {protocolo.dias_parado !== undefined && protocolo.dias_parado > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{protocolo.dias_parado} dias parado</span>
                  </div>
                )}
                {protocolo.financeiro && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(protocolo.financeiro.valor_estimado)}</span>
                  </div>
                )}
              </div>
              
              {/* Etiquetas */}
              <ProtocoloEtiquetas 
                etiquetas={protocolo.etiquetas || []} 
                diasParado={protocolo.dias_parado}
                className="mt-2"
              />
            </div>
            
            {/* Responsável */}
            {protocolo.funcionario && (
              <div className="text-right text-xs text-muted-foreground">
                <span className="block">Responsável:</span>
                <span className="font-medium">{protocolo.funcionario.nome}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
