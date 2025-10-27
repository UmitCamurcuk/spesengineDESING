import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  Settings,
  Layers,
  FolderTree,
  Tags,
  FileText,
  Database,
  Zap,
  X,
  Users,
  Shield,
  Key,
  ShieldCheck,
  Globe,
  User,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

type MenuItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
};

const menuItems: MenuItem[] = [
  {
    name: 'navigation.dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'navigation.items',
    href: '/items',
    icon: Package,
    permission: PERMISSIONS.CATALOG.ITEMS.LIST,
  },
  {
    name: 'navigation.item_types',
    href: '/item-types',
    icon: Database,
    permission: PERMISSIONS.CATALOG.ITEM_TYPES.LIST,
  },
  {
    name: 'navigation.categories',
    href: '/categories',
    icon: FolderTree,
    permission: PERMISSIONS.CATALOG.CATEGORIES.LIST,
  },
  {
    name: 'navigation.families',
    href: '/families',
    icon: Layers,
    permission: PERMISSIONS.CATALOG.FAMILIES.LIST,
  },
  {
    name: 'navigation.attribute_groups',
    href: '/attribute-groups',
    icon: Tags,
    permission: PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.LIST,
  },
  {
    name: 'navigation.attributes',
    href: '/attributes',
    icon: FileText,
    permission: PERMISSIONS.CATALOG.ATTRIBUTES.LIST,
  },
  {
    name: 'navigation.associations',
    href: '/associations',
    icon: Zap,
  },
];

const systemMenuItems: MenuItem[] = [
  {
    name: 'navigation.users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'navigation.roles',
    href: '/roles',
    icon: Shield,
    permission: PERMISSIONS.SYSTEM.ROLES.LIST,
  },
  {
    name: 'navigation.permissions',
    href: '/permissions',
    icon: Key,
    permission: PERMISSIONS.SYSTEM.PERMISSIONS.LIST,
  },
  {
    name: 'navigation.permission_groups',
    href: '/permission-groups',
    icon: ShieldCheck,
    permission: PERMISSIONS.SYSTEM.PERMISSION_GROUPS.LIST,
  },
  {
    name: 'navigation.localizations',
    href: '/localizations',
    icon: Globe,
    permission: PERMISSIONS.SYSTEM.LOCALIZATIONS.LIST,
  },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, isOpen, onClose }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { hasPermission } = useAuth();

  const primaryMenu = useMemo(
    () => menuItems.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission],
  );

  const secondaryMenu = useMemo(
    () => systemMenuItems.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission],
  );

  return (
    <aside className={cn('bg-sidebar border-r border-sidebar-border w-52 flex flex-col', className)}>
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between lg:justify-start">
          <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">
              {settings?.general?.companyName || 'SpesEngine'}
            </h1>
            <p className="text-xs text-muted-foreground">CDP • MDM • ERP</p>
          </div>
        </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2.5 space-y-1">
        <div className="mb-4">
          <div className="px-2.5 mb-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('navigation.content')}</h3>
          </div>
        {primaryMenu.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group',
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors duration-150', 
                  isActive 
                    ? 'text-sidebar-active-foreground' 
                    : 'text-muted-foreground group-hover:text-foreground'
                )} 
              />
              <span>{t(item.name)}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-sidebar-active-foreground rounded-full"></div>
              )}
            </Link>
          );
        })}
        </div>

        <div>
          <div className="px-2.5 mb-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('navigation.system')}</h3>
          </div>
          {secondaryMenu.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon 
                  className={cn(
                    'h-5 w-5 transition-colors duration-200', 
                    isActive 
                      ? 'text-sidebar-active-foreground' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  )} 
                />
                <span>{t(item.name)}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-sidebar-active-foreground rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-sidebar-border space-y-1">
        <Link
          to="/profile"
          onClick={onClose}
          className={cn(
            'flex items-center space-x-2.5 px-3 py-2 rounded-md transition-colors duration-150',
            location.pathname.startsWith('/profile')
              ? 'bg-sidebar-active text-sidebar-active-foreground'
              : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Profil</span>
        </Link>
        {hasPermission(PERMISSIONS.SYSTEM.SETTINGS.VIEW) && (
          <Link
            to="/settings"
            onClick={onClose}
            className={cn(
              'flex items-center space-x-2.5 px-3 py-2 rounded-md transition-colors duration-150',
              location.pathname.startsWith('/settings')
                ? 'bg-sidebar-active text-sidebar-active-foreground'
                : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('common.settings')}</span>
          </Link>
        )}
      </div>
    </aside>
  );
};
