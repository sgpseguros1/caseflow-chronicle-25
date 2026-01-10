import { useAuth } from '@/hooks/useAuth';

export function useClientPermissions() {
  const { isAdmin, isGestor, isAdminOrGestor } = useAuth();

  return {
    canView: true, // All authenticated users can view
    canEdit: isAdminOrGestor,
    canDelete: isAdminOrGestor,
    canUploadDocuments: isAdminOrGestor,
    canManageAlerts: isAdminOrGestor,
    isAdmin,
    isGestor,
  };
}
