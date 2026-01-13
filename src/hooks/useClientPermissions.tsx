import { useAuth } from '@/hooks/useAuth';

export function useClientPermissions() {
  const { isAdmin, isGestor, isAdminOrGestor, user } = useAuth();

  return {
    canView: true, // All authenticated users can view
    canEdit: true, // All authenticated users can edit (conforme regra)
    canDelete: isAdmin, // SOMENTE Admin pode excluir clientes
    canUploadDocuments: true, // Todos podem fazer upload
    canDeleteDocuments: false, // NINGUÉM pode excluir documentos
    canManageAlerts: isAdminOrGestor,
    isAdmin,
    isGestor,
  };
}

// Campos que NÃO podem ser editados no cliente
export const CLIENT_READONLY_FIELDS = ['name', 'birth_date'] as const;

// Função para verificar se um campo é somente leitura
export function isReadonlyField(fieldName: string): boolean {
  return CLIENT_READONLY_FIELDS.includes(fieldName as any);
}
