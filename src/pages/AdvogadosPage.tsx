import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Search, Pencil, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAdvogados, useDeleteAdvogado } from '@/hooks/useAdvogados';

export default function AdvogadosPage() {
  const [search, setSearch] = useState('');
  const [ufFilter, setUfFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: advogados, isLoading } = useAdvogados();
  const deleteAdvogado = useDeleteAdvogado();

  const filteredAdvogados = advogados?.filter((adv) => {
    const matchesSearch =
      adv.nome.toLowerCase().includes(search.toLowerCase()) ||
      adv.oab.toLowerCase().includes(search.toLowerCase());
    const matchesUf = ufFilter === 'todas' || adv.uf === ufFilter;
    const matchesStatus = statusFilter === 'todos' || adv.status === statusFilter;
    return matchesSearch && matchesUf && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredAdvogados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdvogados = filteredAdvogados.slice(startIndex, startIndex + itemsPerPage);

  const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advogados</h1>
          <p className="text-muted-foreground">Gerencie os advogados parceiros</p>
        </div>
        <Button asChild>
          <Link to="/cadastros/advogados/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Advogado
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou OAB..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={ufFilter} onValueChange={setUfFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todas UFs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas UFs</SelectItem>
            {ufs.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>OAB</TableHead>
              <TableHead>Situação OAB</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : paginatedAdvogados.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum advogado encontrado</TableCell></TableRow>
            ) : (
              paginatedAdvogados.map((adv) => (
                <TableRow key={adv.id}>
                  <TableCell className="font-medium">{adv.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{adv.uf} {adv.oab}</span>
                      {adv.situacao_oab === 'regular' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    {adv.cidade && <p className="text-xs text-muted-foreground">{adv.cidade}</p>}
                    {adv.verificado_em && <p className="text-xs text-muted-foreground">Verificado: {new Date(adv.verificado_em).toLocaleDateString('pt-BR')}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={adv.situacao_oab === 'regular' ? 'default' : 'secondary'} className={adv.situacao_oab === 'regular' ? 'bg-green-100 text-green-700' : ''}>
                      {adv.situacao_oab === 'regular' ? 'Regular' : adv.situacao_oab}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {adv.especialidades?.map((esp, i) => (<Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/20">{esp}</Badge>))}
                    </div>
                  </TableCell>
                  <TableCell>{adv.telefone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={adv.status === 'ativo' ? 'default' : 'secondary'} className={adv.status === 'ativo' ? 'bg-green-100 text-green-700' : ''}>
                      {adv.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link to={`/cadastros/advogados/${adv.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir advogado?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAdvogado.mutate(adv.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filteredAdvogados.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAdvogados.length)} de {filteredAdvogados.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt; Anterior</Button>
              <Button variant="outline" size="sm" disabled>{currentPage}</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Próximo &gt;</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
