import { Case, STATUS_LABELS, STATUS_COLORS, CASE_TYPE_ICONS } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface RecentCasesProps {
  cases: Case[];
}

export function RecentCases({ cases }: RecentCasesProps) {
  return (
    <div className="space-y-3">
      {cases.map((caseItem) => (
        <div
          key={caseItem.id}
          className="group flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-lg shadow-sm">
            {CASE_TYPE_ICONS[caseItem.type]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{caseItem.client?.name}</p>
              <Badge
                variant="secondary"
                className={cn('shrink-0 text-[10px]', STATUS_COLORS[caseItem.macroStatus])}
              >
                {STATUS_LABELS[caseItem.macroStatus]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {caseItem.title}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {caseItem.assignedUser && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {caseItem.assignedUser.name.split(' ')[0]}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(caseItem.updatedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
