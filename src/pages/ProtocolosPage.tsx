import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtocoloCard } from '@/components/protocolos/ProtocoloCard';
import { useProtocolos } from '@/hooks/useProtocolos';
import { TIPO_PROTOCOLO_LABELS, STATUS_PROTOCOLO_LABELS, TipoProtocolo, StatusProtocolo } from '@/types/protocolo';

export default function ProtocolosPage() {
  const { data: protocolos, isLoading } = useProtocolos();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredProtocolos = protocolos?.filter(p => {
    const matchSearch = !search || 
      p.cliente?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toString().includes(search);
    const matchTipo = tipoFilter === 'todos' || p.tipo === tipoFilter;
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchSearch && matchTipo && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Protocolos</h1>
          <p className="text-muted-foreground">Gestão centralizada de todos os protocolos</p>
        </div>
        <Link to="/protocolos/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Protocolo</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou código..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(TIPO_PROTOCOLO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_PROTOCOLO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredProtocolos?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum protocolo encontrado
          </div>
        ) : (
          filteredProtocolos?.map(protocolo => (
            <ProtocoloCard key={protocolo.id} protocolo={protocolo} />
          ))
        )}
      </div>
    </div>
  );
}
