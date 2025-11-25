import React from 'react';
import { User, Calendar } from 'lucide-react';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { resolveDeviceIcon } from '../../utils/device';

interface UserInfoWithRoleProps {
  user?: {
    id: string;
    email: string;
    name: string;
    profilePhotoUrl?: string;
    role?: string | {
      name?: string;
      id?: string;
      isSystemRole?: boolean;
    };
  };
  date: string;
  fallbackName?: string;
  fallbackEmail?: string;
  userAgent?: string | null;
}

const getInitials = (value: string) => {
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const UserInfoWithRole: React.FC<UserInfoWithRoleProps> = ({
  user,
  date,
  fallbackName = "Unknown User",
  fallbackEmail = "unknown@system.com",
  userAgent,
}) => {
  const { formatDateTime } = useDateFormatter();
  const deviceInfo = React.useMemo(() => resolveDeviceIcon(userAgent), [userAgent]);

  const displayName = user?.name || fallbackName;
  const displayEmail = user?.email || fallbackEmail;
  const initials = React.useMemo(() => getInitials(displayName), [displayName]);
  const hasAvatar = Boolean(user?.profilePhotoUrl);
  const displayRole = (() => {
    if (!user?.role) {
      return '—';
    }
    if (typeof user.role === 'string') {
      return user.role;
    }
    if (user.role.name && user.role.name.trim().length > 0) {
      return user.role.name;
    }
    if (user.role.isSystemRole) {
      return 'System role';
    }
    return user.role.id ?? '—';
  })();

  return (
    <div className="flex items-start space-x-3 text-left">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover overflow-hidden flex-shrink-0 relative">
            {hasAvatar ? (
              <img
                src={user?.profilePhotoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                data-avatar="true"
              />
            ) : (
              <span data-avatar="true" className="hidden" />
            )}
            <div
              data-avatar-placeholder="true"
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center ${hasAvatar ? 'hidden' : 'flex'}`}
            >
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                {initials.length === 1 ? <User className="h-4 w-4 text-white" /> : initials}
              </span>
            </div>
          </div>
          {deviceInfo && (
            <div 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background overflow-hidden flex items-center justify-center shadow-sm"
              title={deviceInfo.label}
            >
              <img
                src={deviceInfo.iconPath}
                alt={deviceInfo.label}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 text-center max-w-[60px] truncate">
          {displayRole}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">
          {displayName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {displayEmail}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>{formatDateTime(date, { includeTime: true })}</span>
        </div>
      </div>
    </div>
  );
};
