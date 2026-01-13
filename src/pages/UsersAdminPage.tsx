import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useAddUserRole, useRemoveUserRole, useToggleUserActive, useSoftDeleteUser, useRestoreUser } from '@/hooks/useUsers';
import { useFuncionarios, useCreateFuncionario, useDeleteFuncionario, useUpdateFuncionario, useRestoreFuncionario } from '@/hooks/useFuncionarios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Pencil,
  Trash2,
  UserCheck,
  Briefcase,
  KeyRound,
  UserX,
  History,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const ROLES = [
  { value: 'admin', label: 'Administrador', icon: ShieldCheck, color: 'bg-red-500' },
  { value: 'gestor', label: 'Gestor', icon: Shield, color: 'bg-blue-500' },
  { value: 'funcionario', label: 'Funcionário', icon: UserCog, color: 'bg-green-500' },
] as const;

const CARGOS = [
  'Analista',
  'Assistente',
  'Coordenador',
  'Gerente',
  'Diretor',
  'Estagiário',
  'Outro',
];

const DEPARTAMENTOS = [
  'Administrativo',
  'Jurídico',
  'Financeiro',
  'Atendimento',
  'Operacional',
  'Comercial',
];

interface EditingUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }>;
}

export default function UsersAdminPage() {
  const navigate = useNavigate();
  const { isAdmin, isGestor, isAdminOrGestor, user: currentUser } = useAuth();
  
  // Determine if current user is Rafael (master admin)
  const isRafael = currentUser?.email === 'rafaelneves.adv2026@gmail.com';
  
  // State for showing deleted items
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [showDeletedFuncionarios, setShowDeletedFuncionarios] = useState(false);
  
  const { data: users, isLoading, error } = useUsers(showDeletedUsers);
  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios(showDeletedFuncionarios);
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const toggleActive = useToggleUserActive();
  const softDeleteUser = useSoftDeleteUser();
  const restoreUser = useRestoreUser();
  const createFuncionario = useCreateFuncionario();
  const updateFuncionario = useUpdateFuncionario();
  const deleteFuncionario = useDeleteFuncionario();
  const restoreFuncionario = useRestoreFuncionario();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'funcionario' as 'admin' | 'gestor' | 'funcionario' });
  
  // Edit user dialog
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  
  // Delete user dialog
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserName, setDeletingUserName] = useState<string>('');
  const [deletingUser, setDeletingUser] = useState(false);
  
  // Convert to funcionario dialog
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingUser, setConvertingUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [convertData, setConvertData] = useState({ cargo: 'Analista', departamento: 'Operacional', telefone: '', cpf: '' });
  const [converting, setConverting] = useState(false);
  
  // Edit funcionario dialog
  const [editFuncDialogOpen, setEditFuncDialogOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<any>(null);
  const [savingFunc, setSavingFunc] = useState(false);
  
  // Delete funcionario dialog
  const [deleteFuncDialogOpen, setDeleteFuncDialogOpen] = useState(false);
  const [deletingFuncId, setDeletingFuncId] = useState<string | null>(null);
  const [deletingFuncName, setDeletingFuncName] = useState<string>('');
  
  // Inactivate funcionario dialog
  const [inactivateFuncDialogOpen, setInactivateFuncDialogOpen] = useState(false);
  const [inactivatingFuncId, setInactivatingFuncId] = useState<string | null>(null);
  const [inactivatingFuncName, setInactivatingFuncName] = useState<string>('');
  
  // Reset password state
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);

  // Check if user is admin based on roles
  const isUserAdmin = (userRoles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }> | undefined) => {
    return userRoles?.some(r => r.role === 'admin') || false;
  };

  // Check if current user can perform action on target user
  const canEditUser = (targetUser: { id: string; roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }> }) => {
    // Admin can edit everyone
    if (isAdmin) return true;
    // Gestor can edit non-admins
    if (isGestor && !isUserAdmin(targetUser.roles)) return true;
    // Users can edit themselves
    if (targetUser.id === currentUser?.id) return true;
    return false;
  };

  const canDeleteUser = (targetUser: { id: string; roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }> }) => {
    // Only Admin can delete users
    if (!isAdmin) return false;
    // Cannot delete yourself
    if (targetUser.id === currentUser?.id) return false;
    return true;
  };

  const canResetPassword = (targetUser: { id: string; roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }> }) => {
    // Admin can reset anyone's password
    if (isAdmin) return true;
    // Gestor can reset non-admin passwords
    if (isGestor && !isUserAdmin(targetUser.roles)) return true;
    return false;
  };

  const canManageRoles = () => {
    // Only Admin can manage roles
    return isAdmin;
  };

  // Redirect if not admin or gestor
  if (!isAdminOrGestor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground">Apenas administradores e gestores podem acessar esta página.</p>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredFuncionarios = funcionarios?.filter(func => 
    func.nome.toLowerCase().includes(funcSearch.toLowerCase()) ||
    func.email.toLowerCase().includes(funcSearch.toLowerCase())
  ) || [];

  // Audit log function
  const logAuditAction = async (action: string, targetType: 'usuario' | 'funcionario', targetId: string, targetName: string, details?: string) => {
    try {
      await supabase.from('auditoria_financeira').insert({
        acao: action,
        usuario_id: currentUser?.id,
        descricao: `${action} - ${targetType}: ${targetName} (ID: ${targetId})${details ? ` - ${details}` : ''}`,
        dados_novos: { targetType, targetId, targetName, details, action }
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { name: newUser.name },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: newUser.role });

        if (roleError) {
          console.error('Error adding role:', roleError);
        }
        
        await logAuditAction('Criação de Usuário', 'usuario', data.user.id, newUser.name, `Role: ${newUser.role}`);
      }

      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso!' });
      setCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'funcionario' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    setSavingUser(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: editingUser.name, 
          email: editingUser.email,
          is_active: editingUser.is_active
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await logAuditAction('Edição de Usuário', 'usuario', editingUser.id, editingUser.name);

      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao atualizar usuário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId || !currentUser?.id) return;
    
    setDeletingUser(true);
    try {
      await softDeleteUser.mutateAsync({ userId: deletingUserId, deletedBy: currentUser.id });
      await logAuditAction('Exclusão de Usuário', 'usuario', deletingUserId, deletingUserName, 'Usuário excluído (soft-delete)');

      setDeleteUserDialogOpen(false);
      setDeletingUserId(null);
      setDeletingUserName('');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao excluir usuário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const handleRestoreUser = async (userId: string, userName: string) => {
    try {
      await restoreUser.mutateAsync(userId);
      await logAuditAction('Restauração de Usuário', 'usuario', userId, userName, 'Usuário restaurado');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao restaurar usuário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  const handleRestoreFuncionario = async (funcId: string, funcName: string) => {
    try {
      await restoreFuncionario.mutateAsync(funcId);
      await logAuditAction('Restauração de Funcionário', 'funcionario', funcId, funcName, 'Funcionário restaurado');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao restaurar funcionário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  const handleConvertToFuncionario = async () => {
    if (!convertingUser) return;
    
    setConverting(true);
    try {
      // Check if already exists
      const existing = funcionarios?.find(f => f.email === convertingUser.email);
      if (existing) {
        toast({ title: 'Aviso', description: 'Este usuário já é um funcionário cadastrado.', variant: 'destructive' });
        setConverting(false);
        return;
      }

      await createFuncionario.mutateAsync({
        nome: convertingUser.name,
        email: convertingUser.email,
        cargo: convertData.cargo,
        departamento: convertData.departamento,
        telefone: convertData.telefone || null,
        cpf: convertData.cpf || null,
        user_id: convertingUser.id,
        status: 'ativo',
      });

      await logAuditAction('Conversão para Funcionário', 'usuario', convertingUser.id, convertingUser.name, `Cargo: ${convertData.cargo}, Departamento: ${convertData.departamento}`);

      toast({ title: 'Sucesso', description: 'Usuário convertido para funcionário!' });
      setConvertDialogOpen(false);
      setConvertingUser(null);
      setConvertData({ cargo: 'Analista', departamento: 'Operacional', telefone: '', cpf: '' });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao converter usuário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setConverting(false);
    }
  };

  const handleEditFuncionario = async () => {
    if (!editingFunc) return;
    
    setSavingFunc(true);
    try {
      await updateFuncionario.mutateAsync({
        id: editingFunc.id,
        nome: editingFunc.nome,
        email: editingFunc.email,
        cargo: editingFunc.cargo,
        departamento: editingFunc.departamento,
        telefone: editingFunc.telefone,
        cpf: editingFunc.cpf,
        status: editingFunc.status,
      });

      await logAuditAction('Edição de Funcionário', 'funcionario', editingFunc.id, editingFunc.nome);

      toast({ title: 'Sucesso', description: 'Funcionário atualizado com sucesso!' });
      setEditFuncDialogOpen(false);
      setEditingFunc(null);
    } catch (error: any) {
      toast({ 
        title: 'Erro ao atualizar funcionário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setSavingFunc(false);
    }
  };

  const handleDeleteFuncionario = async () => {
    if (!deletingFuncId || !currentUser?.id) return;
    
    try {
      await deleteFuncionario.mutateAsync({ id: deletingFuncId, deletedBy: currentUser.id });
      await logAuditAction('Exclusão de Funcionário', 'funcionario', deletingFuncId, deletingFuncName);
      setDeleteFuncDialogOpen(false);
      setDeletingFuncId(null);
      setDeletingFuncName('');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao excluir funcionário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  const handleInactivateFuncionario = async () => {
    if (!inactivatingFuncId) return;
    
    try {
      await updateFuncionario.mutateAsync({
        id: inactivatingFuncId,
        status: 'inativo',
      });
      await logAuditAction('Inativação de Funcionário', 'funcionario', inactivatingFuncId, inactivatingFuncName);
      toast({ title: 'Sucesso', description: 'Funcionário inativado com sucesso!' });
      setInactivateFuncDialogOpen(false);
      setInactivatingFuncId(null);
      setInactivatingFuncName('');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao inativar funcionário', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  const handleToggleRole = (userId: string, role: 'admin' | 'gestor' | 'funcionario', hasRole: boolean, userName: string) => {
    if (hasRole) {
      removeRole.mutate({ userId, role });
      logAuditAction('Remoção de Role', 'usuario', userId, userName, `Role removida: ${role}`);
    } else {
      addRole.mutate({ userId, role });
      logAuditAction('Atribuição de Role', 'usuario', userId, userName, `Role atribuída: ${role}`);
    }
  };

  const handleResetPassword = async (email: string, userId: string, userName: string) => {
    setResettingPasswordId(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      await logAuditAction('Reset de Senha', 'usuario', userId, userName, `Email enviado para: ${email}`);

      toast({ 
        title: 'E-mail enviado', 
        description: `Um link de redefinição de senha foi enviado para ${email}.` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao enviar e-mail', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setResettingPasswordId(null);
    }
  };

  const handleResetFuncionarioPassword = async (func: any) => {
    // Find the user associated with this funcionario
    const associatedUser = users?.find(u => u.email === func.email);
    if (!associatedUser) {
      toast({ 
        title: 'Erro', 
        description: 'Este funcionário não possui uma conta de usuário vinculada.', 
        variant: 'destructive' 
      });
      return;
    }
    
    await handleResetPassword(func.email, associatedUser.id, func.nome);
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

  const isUserFuncionario = (email: string) => {
    return funcionarios?.some(f => f.email === email);
  };

  const getFuncionarioForUser = (email: string) => {
    return funcionarios?.find(f => f.email === email);
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
            Gerencie contas de usuários, funcionários e atribua permissões
          </p>
        </div>
        
        {isAdmin && (
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
        )}
      </div>

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Funcionários ({funcionarios?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB USUÁRIOS */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  {isRafael && (
                    <Button
                      variant={showDeletedUsers ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowDeletedUsers(!showDeletedUsers)}
                      className="gap-2"
                    >
                      {showDeletedUsers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {showDeletedUsers ? 'Mostrando Excluídos' : 'Ver Excluídos'}
                    </Button>
                  )}
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => {
                        const isFuncionario = isUserFuncionario(user.email);
                        const isCurrentUser = user.id === currentUser?.id;
                        const userIsAdmin = isUserAdmin(user.roles);
                        const canEdit = canEditUser(user);
                        const canDelete = canDeleteUser(user);
                        const canReset = canResetPassword(user);
                        
                        return (
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
                              {isFuncionario ? (
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                  <UserCheck className="h-3 w-3" />
                                  Sim
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Não
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.is_active}
                                  onCheckedChange={(checked) => {
                                    if (canEdit) {
                                      toggleActive.mutate({ userId: user.id, isActive: checked });
                                      logAuditAction(checked ? 'Ativação de Usuário' : 'Desativação de Usuário', 'usuario', user.id, user.name);
                                    }
                                  }}
                                  disabled={isCurrentUser || !canEdit}
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
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Edit User */}
                                  {canEdit && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setEditingUser({ 
                                          id: user.id, 
                                          name: user.name, 
                                          email: user.email,
                                          is_active: user.is_active,
                                          roles: user.roles
                                        });
                                        setEditUserDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar Usuário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Convert to Funcionario */}
                                  {!isFuncionario && isAdmin && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setConvertingUser({ id: user.id, name: user.name, email: user.email });
                                        setConvertDialogOpen(true);
                                      }}
                                    >
                                      <Briefcase className="h-4 w-4 mr-2" />
                                      Tornar Funcionário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Reset Password */}
                                  {canReset && (
                                    <DropdownMenuItem 
                                      onClick={() => handleResetPassword(user.email, user.id, user.name)}
                                      disabled={resettingPasswordId === user.id}
                                    >
                                      {resettingPasswordId === user.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <KeyRound className="h-4 w-4 mr-2" />
                                      )}
                                      Resetar Senha
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Manage Roles - Admin Only */}
                                  {canManageRoles() && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>Gerenciar Roles</DropdownMenuLabel>
                                      {ROLES.map((role) => {
                                        const hasRole = user.roles?.some(r => r.role === role.value);
                                        return (
                                          <DropdownMenuCheckboxItem
                                            key={role.value}
                                            checked={hasRole}
                                            onCheckedChange={() => handleToggleRole(user.id, role.value, hasRole, user.name)}
                                          >
                                            <role.icon className="h-4 w-4 mr-2" />
                                            {role.label}
                                          </DropdownMenuCheckboxItem>
                                        );
                                      })}
                                    </>
                                  )}
                                  
                                  {/* Delete User - Admin Only */}
                                  {canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => {
                                          setDeletingUserId(user.id);
                                          setDeletingUserName(user.name);
                                          setDeleteUserDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir Usuário
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {/* Restore User - Rafael Only */}
                                  {isRafael && user.deleted_at && (
                                    <DropdownMenuItem 
                                      className="text-green-600"
                                      onClick={() => handleRestoreUser(user.id, user.name)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Restaurar Usuário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Show message if user is admin and current user is gestor */}
                                  {!canEdit && userIsAdmin && isGestor && (
                                    <DropdownMenuItem disabled>
                                      <Shield className="h-4 w-4 mr-2" />
                                      <span className="text-xs">Sem permissão (Admin)</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB FUNCIONÁRIOS */}
        <TabsContent value="funcionarios">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Funcionários Cadastrados</CardTitle>
                  <CardDescription>
                    {filteredFuncionarios.length} funcionário(s) encontrado(s)
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  {isRafael && (
                    <Button
                      variant={showDeletedFuncionarios ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowDeletedFuncionarios(!showDeletedFuncionarios)}
                      className="gap-2"
                    >
                      {showDeletedFuncionarios ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {showDeletedFuncionarios ? 'Mostrando Excluídos' : 'Ver Excluídos'}
                    </Button>
                  )}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar funcionários..."
                      value={funcSearch}
                      onChange={(e) => setFuncSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={() => navigate('/funcionarios/novo')} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Novo
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingFuncionarios ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : filteredFuncionarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum funcionário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFuncionarios.map((func) => {
                        // Check if this funcionario has an admin user
                        const associatedUser = users?.find(u => u.email === func.email);
                        const funcIsAdmin = associatedUser ? isUserAdmin(associatedUser.roles) : false;
                        const canEditFunc = isAdmin || (isGestor && !funcIsAdmin);
                        const canDeleteFunc = isAdmin;
                        const canResetFuncPassword = isAdmin || (isGestor && !funcIsAdmin);
                        
                        return (
                          <TableRow key={func.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                                  {func.nome?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                                <div>
                                  <p className="font-medium">{func.nome}</p>
                                  <p className="text-sm text-muted-foreground">{func.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{func.cpf || '-'}</TableCell>
                            <TableCell>{func.cargo}</TableCell>
                            <TableCell>{func.departamento || '-'}</TableCell>
                            <TableCell>{func.telefone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={func.status === 'ativo' ? 'default' : 'secondary'}>
                                {func.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Edit Funcionario */}
                                  {canEditFunc && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setEditingFunc({ ...func });
                                        setEditFuncDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar Funcionário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Reset Password */}
                                  {canResetFuncPassword && associatedUser && (
                                    <DropdownMenuItem 
                                      onClick={() => handleResetFuncionarioPassword(func)}
                                      disabled={resettingPasswordId === associatedUser?.id}
                                    >
                                      {resettingPasswordId === associatedUser?.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <KeyRound className="h-4 w-4 mr-2" />
                                      )}
                                      Resetar Senha
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/funcionarios/${func.id}`)}
                                  >
                                    <UserCog className="h-4 w-4 mr-2" />
                                    Abrir Página
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {/* Inactivate Funcionario */}
                                  {canEditFunc && func.status === 'ativo' && (
                                    <DropdownMenuItem 
                                      className="text-orange-600"
                                      onClick={() => {
                                        setInactivatingFuncId(func.id);
                                        setInactivatingFuncName(func.nome);
                                        setInactivateFuncDialogOpen(true);
                                      }}
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Inativar Funcionário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Delete Funcionario - Admin Only */}
                                  {canDeleteFunc && (
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => {
                                        setDeletingFuncId(func.id);
                                        setDeletingFuncName(func.nome);
                                        setDeleteFuncDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir Funcionário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Restore Funcionario - Rafael Only */}
                                  {isRafael && func.deleted_at && (
                                    <DropdownMenuItem 
                                      className="text-green-600"
                                      onClick={() => handleRestoreFuncionario(func.id, func.nome)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Restaurar Funcionário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Show message if funcionario is admin and current user is gestor */}
                                  {!canEditFunc && funcIsAdmin && isGestor && (
                                    <DropdownMenuItem disabled>
                                      <Shield className="h-4 w-4 mr-2" />
                                      <span className="text-xs">Sem permissão (Admin)</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {funcionarios?.filter(f => f.status === 'ativo').length || 0} ativos
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
            <p className="text-xs text-muted-foreground">Acesso completo</p>
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

      {/* Dialog: Editar Usuário */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize os dados do usuário. As alterações serão registradas no log de auditoria.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={!isAdmin}
                />
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">Apenas administradores podem alterar o e-mail.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editingUser.is_active ? 'ativo' : 'inativo'} 
                  onValueChange={(v) => setEditingUser({ ...editingUser, is_active: v === 'ativo' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <History className="h-3 w-3" />
                <span>Todas as alterações são registradas no log de auditoria</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={savingUser}>
              {savingUser && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Converter para Funcionário */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tornar Funcionário</DialogTitle>
            <DialogDescription>
              {convertingUser?.name} será cadastrado como funcionário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={convertData.cpf}
                onChange={(e) => setConvertData({ ...convertData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={convertData.cargo} onValueChange={(v) => setConvertData({ ...convertData, cargo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={convertData.departamento} onValueChange={(v) => setConvertData({ ...convertData, departamento: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefone (opcional)</Label>
              <Input
                value={convertData.telefone}
                onChange={(e) => setConvertData({ ...convertData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvertToFuncionario} disabled={converting}>
              {converting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Funcionário */}
      <Dialog open={editFuncDialogOpen} onOpenChange={setEditFuncDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>Atualize os dados do funcionário. As alterações serão registradas no log de auditoria.</DialogDescription>
          </DialogHeader>
          {editingFunc && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={editingFunc.nome}
                    onChange={(e) => setEditingFunc({ ...editingFunc, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={editingFunc.email}
                    onChange={(e) => setEditingFunc({ ...editingFunc, email: e.target.value })}
                    disabled={!isAdmin}
                  />
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground">Apenas administradores podem alterar o e-mail.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={editingFunc.cpf || ''}
                    onChange={(e) => setEditingFunc({ ...editingFunc, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editingFunc.telefone || ''}
                    onChange={(e) => setEditingFunc({ ...editingFunc, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={editingFunc.cargo} onValueChange={(v) => setEditingFunc({ ...editingFunc, cargo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={editingFunc.departamento || ''} onValueChange={(v) => setEditingFunc({ ...editingFunc, departamento: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Status</Label>
                  <Select value={editingFunc.status} onValueChange={(v) => setEditingFunc({ ...editingFunc, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <History className="h-3 w-3" />
                <span>Todas as alterações são registradas no log de auditoria</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFuncDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditFuncionario} disabled={savingFunc}>
              {savingFunc && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Excluir Usuário */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Excluir Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir o usuário <strong>{deletingUserName}</strong>?</p>
              <p>Esta ação irá:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Desativar a conta do usuário</li>
                <li>Remover todas as permissões (roles)</li>
                <li>Impedir o acesso ao sistema</li>
              </ul>
              <p className="text-amber-600 font-medium pt-2">Esta ação não poderá ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingUser}
            >
              {deletingUser && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog: Excluir Funcionário */}
      <AlertDialog open={deleteFuncDialogOpen} onOpenChange={setDeleteFuncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Excluir Funcionário
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir o funcionário <strong>{deletingFuncName}</strong>?</p>
              <p className="text-amber-600 font-medium">Esta ação não poderá ser desfeita.</p>
              <p className="text-sm">Se este funcionário possui processos vinculados, considere inativá-lo ao invés de excluir.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFuncionario}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog: Inativar Funcionário */}
      <AlertDialog open={inactivateFuncDialogOpen} onOpenChange={setInactivateFuncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <UserX className="h-5 w-5" />
              Inativar Funcionário
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja inativar o funcionário <strong>{inactivatingFuncName}</strong>?</p>
              <p className="text-sm">O funcionário será marcado como inativo, mas seus registros e histórico serão mantidos no sistema.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleInactivateFuncionario}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
