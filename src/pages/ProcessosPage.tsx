import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProcessos } from '@/hooks/useProcessos';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  aguardando_documentos: 'bg-orange-100 text-orange-700',
  aguardando_pagamento: 'bg-purple-100 text-purple-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  aguardando_documentos: 'Aguardando Documentos',
  aguardando_pagamento: 'Aguardando Pagamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export default function ProcessosPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: processos, isLoading } = useProcessos();

  const filtered = processos?.filter((p) => {
    const matchesSearch = (p.numero && p.numero.toLowerCase().includes(search.toLowerCase())) ||
      (p.titulo && p.titulo.toLowerCase().includes(search.toLowerCase()));
    const matchesTipo = tipoFilter === 'todos' || p.tipo === tipoFilter;
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-muted-foreground">Gerencie todos os processos do escritório</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
          <Button asChild><Link to="/processos/novo"><Plus className="mr-2 h-4 w-4" />Novo Processo</Link></Button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por número ou título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="DPVAT">DPVAT</SelectItem>
            <SelectItem value="INSS">INSS</SelectItem>
            <SelectItem value="VIDA">Seguro de Vida</SelectItem>
            <SelectItem value="VIDA_EMPRESARIAL">Vida Empresarial</SelectItem>
            <SelectItem value="DANOS">Danos</SelectItem>
            <SelectItem value="JUDICIAL">Judicial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
            <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Estimado</TableHead>
              <TableHead>Data Abertura</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo encontrado</TableCell></TableRow>
            ) : (
              paginated.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.numero || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                  <TableCell>{p.titulo || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.status] || 'bg-gray-100 text-gray-700'}>
                      {statusLabels[p.status] || p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(p.valor_estimado)}</TableCell>
                  <TableCell>{p.data_abertura ? format(new Date(p.data_abertura), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/processos/${p.id}`}><FileText className="h-4 w-4 mr-1" />Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt; Anterior</Button>
              <Button variant="outline" size="sm" disabled>{currentPage}</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próximo &gt;</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
