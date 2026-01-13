import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  roles: Array<{ role: 'admin' | 'gestor' | 'funcionario' }>;
}

export function useUsers(includeDeleted = false) {
  return useQuery({
    queryKey: ['users', includeDeleted],
    queryFn: async () => {
      // Fetch profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Only filter by deleted_at if not including deleted users
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      const { data: profiles, error: profilesError } = await query;
      
      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (allRoles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({ role: r.role as 'admin' | 'gestor' | 'funcionario' }))
      }));

      return usersWithRoles;
    },
  });
}

export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'gestor' | 'funcionario' }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: 'Sucesso', description: 'Role atribuída com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Não foi possível atribuir a role.', variant: 'destructive' });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'gestor' | 'funcionario' }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: 'Sucesso', description: 'Role removida com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Não foi possível remover a role.', variant: 'destructive' });
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ 
        title: 'Sucesso', 
        description: data.is_active ? 'Usuário ativado.' : 'Usuário desativado.' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    },
  });
}

export function useSoftDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, deletedBy }: { userId: string; deletedBy: string }) => {
      // First delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then soft-delete the profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          is_active: false
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Sucesso', description: 'Usuário excluído com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Não foi possível excluir o usuário.', variant: 'destructive' });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: null,
          deleted_by: null,
          is_active: true
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Sucesso', description: 'Usuário restaurado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Não foi possível restaurar o usuário.', variant: 'destructive' });
    },
  });
}
