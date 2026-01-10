import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Eye, Edit, AlertTriangle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DPVATStatusBadge } from './DPVATStatusBadge';
import { DPVATTagBadge } from './DPVATTagBadge';
import { DPVATProcess } from '@/types/dpvat';
import { dpvatTags, getUserById } from '@/data/dpvatMockData';
import { cn } from '@/lib/utils';

interface DPVATProcessesTableProps {
  processes: DPVATProcess[];
  onViewProcess?: (id: string) => void;
  onEditProcess?: (id: string) => void;
}

export function DPVATProcessesTable({
  processes,
  onViewProcess,
  onEditProcess,
}: DPVATProcessesTableProps) {
  const navigate = useNavigate();

  const getTagById = (tagId: string) => dpvatTags.find(t => t.id === tagId);

  const getPriorityBadge = (priority: string) => {
    const styles = {
      BAIXA: 'bg-muted text-muted-foreground',
      NORMAL: 'bg-info/10 text-info',
      ALTA: 'bg-warning/10 text-warning',
      URGENTE: 'bg-destructive/10 text-destructive',
    };
    return styles[priority as keyof typeof styles] || styles.NORMAL;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Etiquetas</TableHead>
            <TableHead>Última Mov.</TableHead>
            <TableHead className="text-right">Valor Est.</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processes.map((process) => {
            const adminResponsible = process.adminResponsibleId
              ? getUserById(process.adminResponsibleId)
              : null;
            const isStoppedLong = process.stoppedDays > 7;

            return (
              <TableRow
                key={process.id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  isStoppedLong && 'bg-destructive/5'
                )}
                onClick={() => onViewProcess?.(process.id)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {process.client?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {process.client?.cpf}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <DPVATStatusBadge status={process.status} size="sm" />
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', getPriorityBadge(process.priority))}>
                    {process.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {adminResponsible?.name || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {process.tags.slice(0, 2).map((tagId) => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return <DPVATTagBadge key={tagId} tag={tag} size="sm" />;
                    })}
                    {process.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{process.tags.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {isStoppedLong && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm">
                        {format(new Date(process.lastMovementAt), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                      <p className={cn(
                        'text-xs',
                        isStoppedLong ? 'text-destructive font-medium' : 'text-muted-foreground'
                      )}>
                        {process.stoppedDays === 0
                          ? 'Hoje'
                          : `${process.stoppedDays} dias parado`}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">
                    {process.estimatedValue
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(process.estimatedValue)
                      : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewProcess?.(process.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditProcess?.(process.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
