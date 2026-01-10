import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TipoProtocolo, 
  TIPO_PROTOCOLO_LABELS, 
  TIPO_PROTOCOLO_COLORS 
} from '@/types/protocolo';

interface ProtocoloTipoBadgeProps {
  tipo: TipoProtocolo;
  className?: string;
}

export function ProtocoloTipoBadge({ tipo, className }: ProtocoloTipoBadgeProps) {
  return (
    <Badge 
      className={cn(
        'text-white border-0',
        TIPO_PROTOCOLO_COLORS[tipo],
        className
      )}
    >
      {TIPO_PROTOCOLO_LABELS[tipo]}
    </Badge>
  );
}
