import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, AlertCircle, User } from 'lucide-react';

interface PendingTasksProps {
  tasks: Task[];
}

const priorityColors = {
  BAIXA: 'text-muted-foreground',
  NORMAL: 'text-info',
  ALTA: 'text-warning',
  URGENTE: 'text-destructive',
};

export function PendingTasks({ tasks }: PendingTasksProps) {
  const pendingTasks = tasks.filter((t) => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA');

  return (
    <div className="space-y-2">
      {pendingTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-success/10 p-3 mb-3">
            <Checkbox checked className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Todas as tarefas concluídas!</p>
        </div>
      ) : (
        pendingTasks.map((task) => {
          const isOverdue = task.dueAt && isBefore(new Date(task.dueAt), new Date());
          const isDueSoon =
            task.dueAt &&
            !isOverdue &&
            isBefore(new Date(task.dueAt), addDays(new Date(), 2));

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30',
                isOverdue && 'border-destructive/30 bg-destructive/5',
                isDueSoon && !isOverdue && 'border-warning/30 bg-warning/5'
              )}
            >
              <Checkbox className="mt-0.5" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', priorityColors[task.priority])}>
                    {task.title}
                  </p>
                  {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                </div>
                
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {task.dueAt && (
                    <span className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.dueAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                  {task.assignedUser && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignedUser.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
