import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useEffect } from 'react';

// Componente que gerencia o tracking de sessão automaticamente
export function SessionTracker({ children }: { children: React.ReactNode }) {
  useSessionTracking();
  
  return <>{children}</>;
}

export default SessionTracker;
