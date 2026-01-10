import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  StatusProtocolo, 
  STATUS_PROTOCOLO_LABELS, 
  STATUS_PROTOCOLO_COLORS 
} from '@/types/protocolo';

interface ProtocoloStatusBadgeProps {
  status: StatusProtocolo;
  className?: string;
}

export function ProtocoloStatusBadge({ status, className }: ProtocoloStatusBadgeProps) {
  return (
    <Badge 
      className={cn(
        'text-white border-0',
        STATUS_PROTOCOLO_COLORS[status],
        className
      )}
    >
      {STATUS_PROTOCOLO_LABELS[status]}
    </Badge>
  );
}
