import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle, Flame, Skull, DollarSign, FileWarning } from 'lucide-react';
import type { ProtocoloEtiqueta } from '@/types/protocolo';

interface ProtocoloEtiquetasProps {
  etiquetas: ProtocoloEtiqueta[];
  diasParado?: number;
  className?: string;
}

// Gerar etiquetas automáticas baseadas em regras
export function gerarEtiquetasAutomaticas(diasParado: number, documentosPendentes: boolean = false): ProtocoloEtiqueta[] {
  const etiquetas: ProtocoloEtiqueta[] = [];
  
  if (diasParado >= 60) {
    etiquetas.push({
      id: 'auto-60',
      protocolo_id: '',
      tipo: 'tempo',
      codigo: 'CRITICO_60',
      nome: `Parado há ${diasParado} dias`,
      cor: '#dc2626',
      gerado_automaticamente: true,
      regra_aplicada: 'dias_parado >= 60',
      ativo: true,
      created_at: '',
      updated_at: '',
    });
  } else if (diasParado >= 45) {
    etiquetas.push({
      id: 'auto-45',
      protocolo_id: '',
      tipo: 'risco',
      codigo: 'RISCO_45',
      nome: `Parado há ${diasParado} dias`,
      cor: '#f97316',
      gerado_automaticamente: true,
      regra_aplicada: 'dias_parado >= 45',
      ativo: true,
      created_at: '',
      updated_at: '',
    });
  } else if (diasParado >= 30) {
    etiquetas.push({
      id: 'auto-30',
      protocolo_id: '',
      tipo: 'tempo',
      codigo: 'ALERTA_30',
      nome: `Parado há ${diasParado} dias`,
      cor: '#eab308',
      gerado_automaticamente: true,
      regra_aplicada: 'dias_parado >= 30',
      ativo: true,
      created_at: '',
      updated_at: '',
    });
  } else if (diasParado >= 15) {
    etiquetas.push({
      id: 'auto-15',
      protocolo_id: '',
      tipo: 'tempo',
      codigo: 'ATENCAO_15',
      nome: `Parado há ${diasParado} dias`,
      cor: '#a3a3a3',
      gerado_automaticamente: true,
      regra_aplicada: 'dias_parado >= 15',
      ativo: true,
      created_at: '',
      updated_at: '',
    });
  }
  
  if (documentosPendentes) {
    etiquetas.push({
      id: 'auto-doc',
      protocolo_id: '',
      tipo: 'sistema',
      codigo: 'DOC_PENDENTE',
      nome: 'Documentação pendente',
      cor: '#f59e0b',
      gerado_automaticamente: true,
      regra_aplicada: 'documentos_obrigatorios_pendentes',
      ativo: true,
      created_at: '',
      updated_at: '',
    });
  }
  
  return etiquetas;
}

const ICON_MAP: Record<string, React.ElementType> = {
  CRITICO_60: Skull,
  RISCO_45: Flame,
  ALERTA_30: AlertTriangle,
  ATENCAO_15: Clock,
  DOC_PENDENTE: FileWarning,
  PAGO: DollarSign,
  SUCESSO: CheckCircle,
};

export function ProtocoloEtiquetas({ etiquetas, diasParado = 0, className }: ProtocoloEtiquetasProps) {
  // Combinar etiquetas do banco com automáticas
  const etiquetasAutomaticas = gerarEtiquetasAutomaticas(diasParado);
  const todasEtiquetas = [...etiquetasAutomaticas, ...etiquetas.filter(e => e.ativo)];
  
  if (todasEtiquetas.length === 0) return null;
  
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {todasEtiquetas.map((etiqueta) => {
        const Icon = ICON_MAP[etiqueta.codigo] || Clock;
        return (
          <Badge
            key={etiqueta.id}
            style={{ backgroundColor: etiqueta.cor }}
            className="text-white text-xs flex items-center gap-1 border-0"
          >
            <Icon className="h-3 w-3" />
            {etiqueta.nome}
          </Badge>
        );
      })}
    </div>
  );
}
