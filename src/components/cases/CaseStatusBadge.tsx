import { MacroStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface CaseStatusBadgeProps {
  status: MacroStatus;
  size?: 'sm' | 'md';
}

export function CaseStatusBadge({ status, size = 'md' }: CaseStatusBadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        STATUS_COLORS[status],
        size === 'sm' && 'text-[10px] px-2 py-0.5'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'CONCLUIDO_EXITO' || status === 'ENCERRADO'
            ? 'bg-success'
            : status === 'CONCLUIDO_SEM_EXITO'
            ? 'bg-destructive'
            : status === 'EXIGENCIA' || status === 'PERICIA' || status === 'A_PROTOCOLAR'
            ? 'bg-warning'
            : status === 'PROTOCOLADO' || status === 'EM_ANDAMENTO'
            ? 'bg-info'
            : status === 'JUDICIALIZADO' || status === 'SENTENCIADO'
            ? 'bg-primary'
            : 'bg-muted-foreground'
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
