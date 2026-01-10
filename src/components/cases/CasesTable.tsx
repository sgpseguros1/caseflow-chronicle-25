import { Case, CASE_TYPE_LABELS, CASE_TYPE_ICONS } from '@/types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Eye, Edit, FileText, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CasesTableProps {
  cases: Case[];
  onViewCase?: (caseId: string) => void;
}

export function CasesTable({ cases, onViewCase }: CasesTableProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[80px]">Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Responsável</TableHead>
            <TableHead className="hidden lg:table-cell">Atualizado</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => (
            <TableRow
              key={caseItem.id}
              className="data-table-row cursor-pointer"
              onClick={() => onViewCase?.(caseItem.id)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CASE_TYPE_ICONS[caseItem.type]}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {CASE_TYPE_LABELS[caseItem.type]}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{caseItem.client?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {caseItem.client?.cpf}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {caseItem.title}
                </p>
              </TableCell>
              <TableCell>
                <CaseStatusBadge status={caseItem.macroStatus} size="sm" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {caseItem.assignedUser && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {caseItem.assignedUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="text-sm">
                      {caseItem.assignedUser.name.split(' ')[0]}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {format(new Date(caseItem.updatedAt), "dd/MM/yy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewCase?.(caseItem.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Documentos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
