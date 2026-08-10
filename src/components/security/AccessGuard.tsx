import React from 'react';
import { ActionPermissionResolver, SystemPermissionAction } from '../../security/actionPermissionResolver';

interface AccessGuardProps {
  permission: SystemPermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const isAllowed = ActionPermissionResolver.can(permission);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
