import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Bell,
  ChevronDown,
  ChevronRight,
  FileStack,
  GitMerge,
  Workflow,
  GitBranch,
  Play,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { itemTypesService } from '../../api/services/item-types.service';

type MenuItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  fallback?: string;
  children?: MenuItem[];
};

const filterMenuItems = (items: MenuItem[], hasPermission: (permission: string) => boolean): MenuItem[] =>
  items
    .map((item) => {
      if (item.permission && !hasPermission(item.permission)) {
        return null;
      }
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuItems(item.children, hasPermission);
        if (filteredChildren.length === 0) {
          return null;
        }
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(Boolean) as MenuItem[];

const menuItems: MenuItem[] = [
  {
    name: 'navigation.dashboard',
    href: '/dashboard',
    icon: Home,
    fallback: 'Dashboard',
  },
  {
    name: 'navigation.items',
    href: '/items',
    icon: Package,
    permission: PERMISSIONS.CATALOG.ITEMS.LIST,
    fallback: 'Itemlar',
  },
  {
    name: 'navigation.item_types',
    href: '/item-types',
    icon: Database,
    permission: PERMISSIONS.CATALOG.ITEM_TYPES.LIST,
    fallback: 'Item Tipleri',
  },
  {
    name: 'navigation.categories',
    href: '/categories',
    icon: FolderTree,
    permission: PERMISSIONS.CATALOG.CATEGORIES.LIST,
    fallback: 'Kategoriler',
  },
  {
    name: 'navigation.families',
    href: '/families',
    icon: Layers,
    permission: PERMISSIONS.CATALOG.FAMILIES.LIST,
    fallback: 'Aileler',
  },
  {
    name: 'navigation.attribute_groups',
    href: '/attribute-groups',
    icon: Tags,
    permission: PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.LIST,
    fallback: 'Attribute Grupları',
  },
  {
    name: 'navigation.attributes',
    href: '/attributes',
    icon: FileText,
    permission: PERMISSIONS.CATALOG.ATTRIBUTES.LIST,
    fallback: 'Attribute\'lar',
  },
  {
    name: 'navigation.associations',
    icon: Zap,
    fallback: 'İlişkiler',
    children: [
      {
        name: 'navigation.association_types',
        href: '/association-types',
        icon: Layers,
        permission: PERMISSIONS.SYSTEM.ASSOCIATIONS.LIST,
        fallback: 'Association Tipleri',
      },
      {
        name: 'navigation.associations_records',
        href: '/associations',
        icon: GitMerge,
        permission: PERMISSIONS.SYSTEM.ASSOCIATIONS.LIST,
        fallback: 'Association Kayıtları',
      },
    ],
  },
  {
    name: 'navigation.automation',
    icon: Workflow,
    fallback: 'Otomasyon',
    children: [
      {
        name: 'navigation.workflows',
        href: '/automation/workflows',
        icon: GitBranch,
        permission: PERMISSIONS.AUTOMATION.WORKFLOWS.LIST,
        fallback: 'İş Akışları',
      },
      {
        name: 'navigation.executions',
        href: '/automation/executions',
        icon: Play,
        permission: PERMISSIONS.AUTOMATION.WORKFLOW_EXECUTIONS.LIST,
        fallback: 'Çalışma Geçmişi',
      },
    ],
  },
];

const systemMenuItems: MenuItem[] = [
  {
    name: 'navigation.notifications',
    icon: Bell,
    permission: PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.LIST,
    fallback: 'Bildirimler',
    children: [
      {
        name: 'notifications.rules.title',
        href: '/notifications/rules',
        icon: Bell,
        permission: PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.LIST,
        fallback: 'Kural Tanımları',
      },
      {
        name: 'notifications.templates.title',
        href: '/notifications/templates',
        icon: FileStack,
        permission: PERMISSIONS.SYSTEM.NOTIFICATIONS.TEMPLATES.LIST,
        fallback: 'Şablonlar',
      },
    ],
  },
  {
    name: 'navigation.users',
    href: '/users',
    icon: Users,
    permission: PERMISSIONS.SYSTEM.USERS.LIST,
    fallback: 'Kullanıcılar',
  },
  {
    name: 'navigation.roles',
    href: '/roles',
    icon: Shield,
    permission: PERMISSIONS.SYSTEM.ROLES.LIST,
    fallback: 'Roller',
  },
  {
    name: 'navigation.permissions',
    href: '/permissions',
    icon: Key,
    permission: PERMISSIONS.SYSTEM.PERMISSIONS.LIST,
    fallback: 'İzinler',
  },
  {
    name: 'navigation.permission_groups',
    href: '/permission-groups',
    icon: ShieldCheck,
    permission: PERMISSIONS.SYSTEM.PERMISSION_GROUPS.LIST,
    fallback: 'İzin Grupları',
  },
  {
    name: 'navigation.localizations',
    href: '/localizations',
    icon: Globe,
    permission: PERMISSIONS.SYSTEM.LOCALIZATIONS.LIST,
    fallback: 'Çeviriler',
  },
  {
    name: 'navigation.chatbot',
    icon: Bot,
    fallback: 'Chatbot',
    children: [
      {
        name: 'navigation.chatbot_settings',
        href: '/chatbot/settings',
        icon: Settings,
        permission: PERMISSIONS.CHATBOT.CONFIG.LIST,
        fallback: 'Chatbot Ayarları',
      },
      {
        name: 'navigation.conversations',
        href: '/chatbot/conversations',
        icon: MessageSquare,
        permission: PERMISSIONS.CHATBOT.CONVERSATIONS.LIST,
        fallback: 'Sohbetler',
      },
    ],
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [navItemTypes, setNavItemTypes] = useState<MenuItem[]>([]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };
  
  const resolveLabel = useCallback(
    (item: MenuItem) => {
      const translated = t(item.name);
      if (!translated || translated === item.name) {
        return item.fallback ?? item.name;
      }
      return translated;
    },
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    const loadNavItemTypes = async () => {
      try {
        const response = await itemTypesService.list({ limit: 200 });
        if (cancelled) return;
        const visible = (response.items ?? []).filter((itemType) => itemType.showInNavbar);
        const dynamicItems: MenuItem[] = visible.map((itemType) => ({
          name: `itemtype.${itemType.id}`,
          href: `/items/type/${itemType.id}`,
          icon: Database,
          permission: PERMISSIONS.CATALOG.ITEMS.LIST,
          fallback: itemType.name || itemType.key || itemType.id,
        }));
        setNavItemTypes(dynamicItems);
      } catch (error) {
        console.error('Failed to load navbar item types', error);
      }
    };
    void loadNavItemTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryMenu = useMemo(() => {
    const base = [...menuItems];
    if (navItemTypes.length > 0) {
      const insertIndex = 1; // after dashboard
      base.splice(insertIndex, 0, ...navItemTypes);
    }
    return filterMenuItems(base, hasPermission);
  }, [hasPermission, navItemTypes]);

  const secondaryMenu = useMemo(() => filterMenuItems(systemMenuItems, hasPermission), [hasPermission]);

  return (
    <aside className={cn('bg-sidebar border-r border-sidebar-border w-52 flex flex-col', className)}>
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between lg:justify-start">
          <div className="flex items-center space-x-2.5">
            <img 
              src="/assets/logo/IconLight.png" 
              alt="SpesEngine Logo" 
              className="w-7 h-7"
            />
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
          if (item.children && item.children.length > 0) {
            const hasActiveChild = item.children.some(
              (child) => child.href && location.pathname.startsWith(child.href),
            );
            const manualState = expandedMenus[item.name];
            const isExpanded = typeof manualState === 'boolean' ? manualState : hasActiveChild;

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    'w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group',
                    hasActiveChild
                      ? 'text-sidebar-active-foreground'
                      : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-200',
                      hasActiveChild
                        ? 'text-sidebar-active-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className="flex-1 text-left">{resolveLabel(item)}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children.map((child) => {
                      if (!child.href) return null;
                      const isActive = location.pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-colors duration-150 group',
                            isActive
                              ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                              : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <child.icon
                            className={cn(
                              'h-3 w-3 transition-colors duration-200',
                              isActive
                                ? 'text-sidebar-active-foreground'
                                : 'text-muted-foreground group-hover:text-foreground',
                            )}
                          />
                          <span className="text-xs">{resolveLabel(child)}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-sidebar-active-foreground rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (!item.href) {
            return null;
          }

          const isActive = item.href === '/items'
            ? location.pathname === '/items' || location.pathname === '/items/'
            : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group',
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors duration-150',
                  isActive
                    ? 'text-sidebar-active-foreground'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span>{resolveLabel(item)}</span>
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
            if (item.children) {
              const isExpanded = expandedMenus[item.name] || false;
              const hasActiveChild = item.children.some(child => child.href && location.pathname.startsWith(child.href));
              
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group',
                      hasActiveChild
                        ? 'text-sidebar-active-foreground'
                        : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon 
                      className={cn(
                        'h-4 w-4 transition-colors duration-200', 
                        hasActiveChild
                          ? 'text-sidebar-active-foreground' 
                          : 'text-muted-foreground group-hover:text-foreground'
                      )} 
                    />
                    <span className="flex-1 text-left">{resolveLabel(item)}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {item.children.map((child) => {
                        if (!child.href) return null;
                        const isActive = location.pathname.startsWith(child.href);
                        
                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={onClose}
                            className={cn(
                              'flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-colors duration-150 group',
                              isActive
                                ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                                : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <child.icon 
                              className={cn(
                                'h-3 w-3 transition-colors duration-200', 
                                isActive 
                                  ? 'text-sidebar-active-foreground' 
                                  : 'text-muted-foreground group-hover:text-foreground'
                              )} 
                            />
                            <span className="text-xs">{resolveLabel(child)}</span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 bg-sidebar-active-foreground rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = item.href ? location.pathname.startsWith(item.href) : false;
            
            return (
              <Link
                key={item.name}
                to={item.href!}
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
                    'h-4 w-4 transition-colors duration-200', 
                    isActive 
                      ? 'text-sidebar-active-foreground' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  )} 
                />
                <span>{resolveLabel(item)}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-sidebar-active-foreground rounded-full"></div>
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
