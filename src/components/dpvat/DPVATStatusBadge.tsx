import { cn } from '@/lib/utils';
import { DPVATStatus, DPVAT_STATUS_LABELS, DPVAT_STATUS_COLORS } from '@/types/dpvat';

interface DPVATStatusBadgeProps {
  status: DPVATStatus;
  size?: 'sm' | 'md';
}

export function DPVATStatusBadge({ status, size = 'md' }: DPVATStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        DPVAT_STATUS_COLORS[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {DPVAT_STATUS_LABELS[status]}
    </span>
  );
}
