import type { ReactNode } from 'react';
import { useAuthStore, type UserRole } from '../../stores/auth.store';

interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const user = useAuthStore(s => s.user);
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
