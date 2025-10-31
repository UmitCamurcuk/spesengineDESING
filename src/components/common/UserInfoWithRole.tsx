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
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover overflow-hidden flex-shrink-0">
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
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
