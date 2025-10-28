import React from 'react';
import { User, Calendar, Shield } from 'lucide-react';
import { useDateFormatter } from '../../hooks/useDateFormatter';

interface UserInfoWithRoleProps {
  user?: {
    id: string;
    email: string;
    name: string;
    profilePhotoUrl?: string;
    role?: string;
  };
  date: string;
  fallbackName?: string;
  fallbackEmail?: string;
}

export const UserInfoWithRole: React.FC<UserInfoWithRoleProps> = ({
  user,
  date,
  fallbackName = "Unknown User",
  fallbackEmail = "unknown@system.com",
}) => {
  const { formatDateTime } = useDateFormatter();

  const displayName = user?.name || fallbackName;
  const displayEmail = user?.email || fallbackEmail;
  const displayRole = user?.role || "—";

  return (
    <div className="flex items-start space-x-3 text-left">
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
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">
          {displayName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {displayEmail}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Shield className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">{displayRole}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>{formatDateTime(date, { includeTime: true })}</span>
        </div>
      </div>
    </div>
  );
};
