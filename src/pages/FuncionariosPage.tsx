import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useFuncionarios, useDeleteFuncionario } from '@/hooks/useFuncionarios';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const cargoLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  funcionario: 'Funcionário',
};

export default function FuncionariosPage() {
  const [search, setSearch] = useState('');
  const [cargoFilter, setCargoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: funcionarios, isLoading } = useFuncionarios();
  const deleteFuncionario = useDeleteFuncionario();
  const { isAdmin } = useAuth();

  const filtered = funcionarios?.filter((f) => {
    const matchesSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.cpf && f.cpf.includes(search));
    const matchesCargo = cargoFilter === 'todos' || f.cargo === cargoFilter;
    const matchesStatus = statusFilter === 'todos' || f.status === statusFilter;
    return matchesSearch && matchesCargo && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie os funcionários do escritório</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
          <Button asChild><Link to="/funcionarios/novo"><Plus className="mr-2 h-4 w-4" />Novo Funcionário</Link></Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={cargoFilter} onValueChange={setCargoFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cargos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="funcionario">Funcionário</SelectItem>
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
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum funcionário encontrado</TableCell></TableRow>
            ) : (
              paginated.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>{f.telefone || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{cargoLabels[f.cargo] || f.cargo}</Badge></TableCell>
                  <TableCell>{f.departamento || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={f.status === 'ativo' ? 'default' : 'secondary'} className={f.status === 'ativo' ? 'bg-green-100 text-green-700' : ''}>
                      {f.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(f.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link to={`/funcionarios/${f.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir funcionário?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Somente administradores podem excluir.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFuncionario.mutate(f.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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
