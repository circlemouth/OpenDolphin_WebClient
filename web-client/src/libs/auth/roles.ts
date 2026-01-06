export const SYSTEM_ADMIN_ROLES = new Set(['system_admin', 'admin', 'system-admin']);

export const isSystemAdminRole = (role?: string) => {
  if (!role) return false;
  return SYSTEM_ADMIN_ROLES.has(role);
};
