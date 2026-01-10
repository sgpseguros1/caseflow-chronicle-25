import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useAddUserRole, useRemoveUserRole, useToggleUserActive } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  ShieldCheck, 
  UserCog,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ROLES = [
  { value: 'admin', label: 'Administrador', icon: ShieldCheck, color: 'bg-red-500' },
  { value: 'gestor', label: 'Gestor', icon: Shield, color: 'bg-blue-500' },
  { value: 'funcionario', label: 'Funcionário', icon: UserCog, color: 'bg-green-500' },
] as const;

export default function UsersAdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const toggleActive = useToggleUserActive();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'funcionario' as 'admin' | 'gestor' | 'funcionario' });

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // Create user via Supabase Auth Admin (requires service role, so we use signUp)
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { name: newUser.name },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Add role to user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: newUser.role });

        if (roleError) {
          console.error('Error adding role:', roleError);
        }
      }

      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso!' });
      setCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'funcionario' });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao criar usuário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRole = (userId: string, role: 'admin' | 'gestor' | 'funcionario', hasRole: boolean) => {
    if (hasRole) {
      removeRole.mutate({ userId, role });
    } else {
      addRole.mutate({ userId, role });
    }
  };

  const getRoleBadges = (roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }>) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">Sem role</Badge>;
    }

    return roles.map(({ role }) => {
      const roleConfig = ROLES.find(r => r.value === role);
      if (!roleConfig) return null;
      
      return (
        <Badge key={role} className={`${roleConfig.color} text-white`}>
          {roleConfig.label}
        </Badge>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Administração de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie contas de usuários e atribua permissões
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova conta de usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map((role) => (
                    <Button
                      key={role.value}
                      type="button"
                      variant={newUser.role === role.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewUser({ ...newUser, role: role.value })}
                      className="gap-2"
                    >
                      <role.icon className="h-4 w-4" />
                      {role.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Usuários Cadastrados</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuário(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getRoleBadges(user.roles)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(checked) => toggleActive.mutate({ userId: user.id, isActive: checked })}
                          />
                          <span className={user.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Gerenciar Roles</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ROLES.map((role) => {
                              const hasRole = user.roles?.some(r => r.role === role.value);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={role.value}
                                  checked={hasRole}
                                  onCheckedChange={() => handleToggleRole(user.id, role.value, hasRole)}
                                >
                                  <role.icon className="h-4 w-4 mr-2" />
                                  {role.label}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {users?.filter(u => u.is_active).length || 0} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.roles?.some(r => r.role === 'admin')).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Acesso completo ao sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.roles?.some(r => r.role === 'gestor')).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Supervisão de equipe</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
