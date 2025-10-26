import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Shield, Calendar } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersService } from '../../api/services/users.service';
import type { UserSummary } from '../../api/types/api.types';

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const deriveStatus = (user: UserSummary): { label: string; variant: 'success' | 'warning' | 'default' } => {
  if (user.notificationsEnabled && user.emailNotificationsEnabled) {
    return { label: 'active', variant: 'success' };
  }
  if (!user.notificationsEnabled && !user.emailNotificationsEnabled) {
    return { label: 'inactive', variant: 'default' };
  }
  return { label: 'partial', variant: 'warning' };
};

export function UsersDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language } = useLanguage();

  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      setLoading(true);
      const result = await usersService.getById(id!, { language });
      setUser(result);
    } catch (error) {
      console.error('Failed to load user:', error);
      showToast({ type: 'error', message: 'Failed to load user' });
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading user...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const status = deriveStatus(user);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
            <div className="flex items-center text-sm text-muted-foreground space-x-3 mt-1">
              <span>{user.email}</span>
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">User Details</h2>
        </CardHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">First Name</label>
              <p className="text-sm text-foreground">{user.firstName || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Last Name</label>
              <p className="text-sm text-foreground">{user.lastName || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
              <p className="text-sm text-foreground">{user.phone || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Department</label>
              <p className="text-sm text-foreground">{user.department || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Location</label>
              <p className="text-sm text-foreground">{user.location || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Primary Role</label>
              <Badge variant="secondary" size="sm">
                <Shield className="h-3 w-3 mr-1" />
                {user.primaryRoleName || user.primaryRoleId || '—'}
              </Badge>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Last Login</label>
              <p className="text-sm text-foreground">{formatDateTime(user.lastLoginAt)}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Created At</label>
              <p className="text-sm text-foreground">{formatDateTime(user.createdAt)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Updated At</label>
              <p className="text-sm text-foreground">{formatDateTime(user.updatedAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Tenant Memberships</h2>
        </CardHeader>
        <div className="p-6 space-y-3">
          {user.tenants.length === 0 && (
            <p className="text-sm text-muted-foreground">No tenant memberships found.</p>
          )}
          {user.tenants.map((tenant) => (
            <div
              key={`${tenant.tenantId}-${tenant.roleId ?? 'none'}`}
              className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-foreground">Tenant: {tenant.tenantId}</div>
                <div className="text-xs text-muted-foreground">
                  Role: {tenant.roleName || tenant.roleId || '—'}
                </div>
              </div>
              <Badge variant="outline" size="sm">
                {tenant.roleName || 'Unassigned'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Preferences</h2>
        </CardHeader>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Notifications</label>
            <Badge variant={user.notificationsEnabled ? 'success' : 'secondary'} size="sm">
              {user.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Email Notifications</label>
            <Badge variant={user.emailNotificationsEnabled ? 'success' : 'secondary'} size="sm">
              {user.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Two Factor Auth</label>
            <Badge variant={user.twoFactorEnabled ? 'success' : 'secondary'} size="sm">
              {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
