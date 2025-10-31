import type { PropsWithChildren, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/libs/auth/auth-context';

interface RequireRoleProps extends PropsWithChildren {
  roles: string[] | string;
  fallback?: ReactNode;
}

export const RequireRole = ({ roles, fallback, children }: RequireRoleProps) => {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  if (!hasAnyRole(...requiredRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        role="alert"
        style={{
          padding: '24px',
          maxWidth: '960px',
          margin: '48px auto',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          background: '#f8fafc',
          color: '#334155',
          fontSize: '0.95rem',
          lineHeight: 1.6,
        }}
      >
        この機能には管理者権限が必要です。ご自身のアカウント権限を確認し、必要な場合はシステム管理者へお問い合わせください。
      </div>
    );
  }

  return <>{children}</>;
};
