import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TIPO_PROTOCOLO_LABELS, TIPO_PROTOCOLO_COLORS, TipoProtocolo } from '@/types/protocolo';
import { 
  Accessibility, 
  Car, 
  Shield, 
  Building2, 
  Scale, 
  FileText 
} from 'lucide-react';

interface ProtocoloCount {
  tipo: TipoProtocolo;
  count: number;
}

interface ClientProtocoloTagsProps {
  protocoloCounts: ProtocoloCount[];
  className?: string;
}

const TIPO_ICONS: Record<TipoProtocolo, React.ComponentType<{ className?: string }>> = {
  AUXILIO_ACIDENTE: Accessibility,
  DPVAT: Car,
  SEGURO_VIDA: Shield,
  PREVIDENCIARIO: Building2,
  JUDICIAL_CIVEL: Scale,
  ADMINISTRATIVO_SEGURADORA: FileText,
};

export function ClientProtocoloTags({ protocoloCounts, className }: ClientProtocoloTagsProps) {
  if (protocoloCounts.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {protocoloCounts.map(({ tipo, count }) => {
        const Icon = TIPO_ICONS[tipo];
        return (
          <Badge 
            key={tipo} 
            variant="secondary"
            className={cn(
              'text-white border-0 gap-1.5 px-3 py-1',
              TIPO_PROTOCOLO_COLORS[tipo]
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{TIPO_PROTOCOLO_LABELS[tipo]}</span>
            <span className="ml-1 font-bold bg-white/20 px-1.5 rounded">{count}</span>
          </Badge>
        );
      })}
    </div>
  );
}
