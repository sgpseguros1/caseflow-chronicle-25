import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Bell, Clock, FileX, DollarSign, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DPVATAlert } from '@/types/dpvat';
import { cn } from '@/lib/utils';

interface DPVATAlertsListProps {
  alerts: DPVATAlert[];
  maxItems?: number;
  onViewProcess?: (processId: string) => void;
}

const alertIcons = {
  PRAZO: Clock,
  DOCUMENTO: FileX,
  ETIQUETA: Tag,
  PARADO: AlertTriangle,
  FINANCEIRO: DollarSign,
};

const severityStyles = {
  INFO: 'border-l-info bg-info/5',
  WARNING: 'border-l-warning bg-warning/5',
  CRITICAL: 'border-l-destructive bg-destructive/5',
};

const severityIconStyles = {
  INFO: 'text-info',
  WARNING: 'text-warning',
  CRITICAL: 'text-destructive',
};

export function DPVATAlertsList({ alerts, maxItems = 5, onViewProcess }: DPVATAlertsListProps) {
  const displayedAlerts = alerts.slice(0, maxItems);
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Alertas
          </CardTitle>
          {unreadCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum alerta no momento
          </p>
        ) : (
          displayedAlerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:opacity-80',
                  severityStyles[alert.severity]
                )}
                onClick={() => onViewProcess?.(alert.processId)}
              >
                <Icon className={cn('h-5 w-5 mt-0.5', severityIconStyles[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(alert.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!alert.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            );
          })
        )}
        {alerts.length > maxItems && (
          <button className="w-full text-sm text-primary hover:underline pt-2">
            Ver todos os {alerts.length} alertas
          </button>
        )}
      </CardContent>
    </Card>
  );
}
