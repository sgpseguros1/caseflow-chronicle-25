import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  MessageSquare,
  RefreshCw,
  Tag,
  Receipt,
  DollarSign,
  PenLine,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DPVATTimelineEvent } from '@/types/dpvat';
import { cn } from '@/lib/utils';

interface DPVATTimelineProps {
  events: DPVATTimelineEvent[];
  maxItems?: number;
}

const eventIcons = {
  CRIACAO: Plus,
  STATUS_CHANGE: RefreshCw,
  DOCUMENTO: FileText,
  NOTA: MessageSquare,
  ETIQUETA: Tag,
  PROTOCOLO: Receipt,
  PAGAMENTO: DollarSign,
  EDICAO: PenLine,
};

const eventColors = {
  CRIACAO: 'bg-success text-success-foreground',
  STATUS_CHANGE: 'bg-info text-info-foreground',
  DOCUMENTO: 'bg-primary text-primary-foreground',
  NOTA: 'bg-muted text-muted-foreground',
  ETIQUETA: 'bg-warning text-warning-foreground',
  PROTOCOLO: 'bg-primary text-primary-foreground',
  PAGAMENTO: 'bg-success text-success-foreground',
  EDICAO: 'bg-muted text-muted-foreground',
};

export function DPVATTimeline({ events, maxItems }: DPVATTimelineProps) {
  const displayedEvents = maxItems ? events.slice(0, maxItems) : events;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {displayedEvents.map((event, index) => {
              const Icon = eventIcons[event.kind];
              return (
                <div key={event.id} className="relative flex gap-4 pl-10">
                  {/* Icon */}
                  <div
                    className={cn(
                      'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full',
                      eventColors[event.kind]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {event.message}
                      </p>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.createdAt), "dd/MM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </time>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      por {event.userName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {maxItems && events.length > maxItems && (
          <button className="w-full text-sm text-primary hover:underline mt-4">
            Ver histórico completo
          </button>
        )}
      </CardContent>
    </Card>
  );
}
