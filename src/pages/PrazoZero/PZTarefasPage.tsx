import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePZTarefas, useConcluirPZTarefa, usePZUsuarios, PZTarefa } from '@/hooks/usePrazoZero';
import { format, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Circle, color: 'text-gray-500' },
  em_andamento: { label: 'Em Andamento', icon: Clock, color: 'text-blue-500' },
  aguardando: { label: 'Aguardando', icon: Clock, color: 'text-yellow-500' },
  concluida: { label: 'Concluída', icon: CheckCircle2, color: 'text-green-500' },
  cancelada: { label: 'Cancelada', icon: Circle, color: 'text-red-500' },
};

const prioridadeCores: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-800 border-gray-300',
  media: 'bg-blue-100 text-blue-800 border-blue-300',
  alta: 'bg-orange-100 text-orange-800 border-orange-300',
  urgente: 'bg-red-100 text-red-800 border-red-300',
};

const categoriaLabels: Record<string, string> = {
  prazo_processual: 'Prazo Processual',
  intimacao: 'Intimação',
  audiencia: 'Audiência',
  pagamento: 'Pagamento',
  cobranca: 'Cobrança',
  cliente_retorno: 'Cliente',
  documentacao_pendente: 'Documentação',
  nao_classificado: 'Não Classificado',
};

function TarefaRow({ tarefa, onConcluir }: { tarefa: PZTarefa; onConcluir: (id: string) => void }) {
  const StatusIcon = statusConfig[tarefa.status]?.icon || Circle;
  const prazo = tarefa.data_prazo ? new Date(tarefa.data_prazo) : null;
  const vencido = prazo && isPast(prazo) && tarefa.status !== 'concluida';
  const horasRestantes = prazo ? differenceInHours(prazo, new Date()) : null;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors",
      vencido && "border-red-300 bg-red-50"
    )}>
      <button
        onClick={() => onConcluir(tarefa.id)}
        disabled={tarefa.status === 'concluida'}
        className="flex-shrink-0"
      >
        <StatusIcon className={cn(
          "h-6 w-6",
          statusConfig[tarefa.status]?.color,
          tarefa.status !== 'concluida' && "hover:text-green-500 cursor-pointer"
        )} />
      </button>

      <Link to={`/prazo-zero/tarefas/${tarefa.id}`} className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium truncate",
              tarefa.status === 'concluida' && "line-through text-muted-foreground"
            )}>
              {tarefa.titulo}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {tarefa.categoria && (
                <Badge variant="outline" className="text-xs">
                  {categoriaLabels[tarefa.categoria] || tarefa.categoria}
                </Badge>
              )}
              {tarefa.cliente?.name && (
                <span className="text-xs text-muted-foreground">
                  #{tarefa.cliente.code} - {tarefa.cliente.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge className={cn('text-xs', prioridadeCores[tarefa.prioridade])}>
              {tarefa.prioridade}
            </Badge>
            {prazo && (
              <span className={cn(
                "text-xs",
                vencido ? "text-red-600 font-bold" :
                horasRestantes && horasRestantes <= 24 ? "text-orange-600" :
                "text-muted-foreground"
              )}>
                {vencido ? '⚠️ VENCIDO' : format(prazo, 'dd/MM HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {tarefa.responsavel?.name && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {tarefa.responsavel.name}
          </div>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/prazo-zero/tarefas/${tarefa.id}`}>Editar</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConcluir(tarefa.id)}>
            Marcar como concluída
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function PZTarefasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState(searchParams.get('status') || 'todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('categoria') || '');
  const [responsavelFiltro, setResponsavelFiltro] = useState('');

  const { data: tarefas, isLoading } = usePZTarefas({
    status: statusFiltro !== 'todas' ? statusFiltro : undefined,
    categoria: categoriaFiltro || undefined,
    responsavel: responsavelFiltro || undefined,
  });

  const { data: usuarios } = usePZUsuarios();
  const concluirTarefa = useConcluirPZTarefa();

  const tarefasFiltradas = tarefas?.filter(t => 
    !busca || 
    t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    t.cliente?.name?.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const handleConcluir = (id: string) => {
    concluirTarefa.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">
            {tarefasFiltradas.length} tarefa(s) encontrada(s)
          </p>
        </div>
        <Link to="/prazo-zero/tarefas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="prazo_processual">Prazo Processual</SelectItem>
                <SelectItem value="intimacao">Intimação</SelectItem>
                <SelectItem value="audiencia">Audiência</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="cobranca">Cobrança</SelectItem>
                <SelectItem value="cliente_retorno">Cliente</SelectItem>
                <SelectItem value="documentacao_pendente">Documentação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={responsavelFiltro} onValueChange={setResponsavelFiltro}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {usuarios?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : tarefasFiltradas.length > 0 ? (
          tarefasFiltradas.map(tarefa => (
            <TarefaRow key={tarefa.id} tarefa={tarefa} onConcluir={handleConcluir} />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground text-center mt-1">
                Tente ajustar os filtros ou crie uma nova tarefa.
              </p>
              <Link to="/prazo-zero/tarefas/nova" className="mt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Tarefa
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
