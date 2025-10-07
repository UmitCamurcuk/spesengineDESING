import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, Menu, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

const getPageTitle = (pathname: string, t: (key: string) => string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return t('navigation.dashboard');
  
  const pageMap: Record<string, string> = {
    'dashboard': t('navigation.dashboard'),
    'items': t('navigation.items'),
    'item-types': t('navigation.item_types'),
    'categories': t('navigation.categories'),
    'families': t('navigation.families'),
    'attribute-groups': t('navigation.attribute_groups'),
    'attributes': t('navigation.attributes'),
    'users': t('navigation.users'),
    'roles': t('navigation.roles'),
    'permissions': t('navigation.permissions'),
    'permission-groups': t('navigation.permission_groups'),
    'localizations': t('navigation.localizations'),
    'associations': t('navigation.associations'),
    'profile': 'Profil',
  };
  
  const basePage = segments[0];
  const action = segments[1];
  
  if (action === 'create') {
    return t('common.create') + ' ' + (pageMap[basePage]?.slice(0, -1) || t('navigation.items'));
  }
  
  if (action && action !== 'create') {
    return (pageMap[basePage]?.slice(0, -1) || t('navigation.items')) + ' ' + t('common.details');
  }
  
  return pageMap[basePage] || t('navigation.dashboard');
};

const getBreadcrumbs = (pathname: string, t: (key: string) => string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ name: t('navigation.dashboard'), path: '/dashboard' }];
  
  if (segments.length === 0) return breadcrumbs;
  
  const pageMap: Record<string, string> = {
    'dashboard': t('navigation.dashboard'),
    'items': t('navigation.items'),
    'item-types': t('navigation.item_types'),
    'categories': t('navigation.categories'),
    'families': t('navigation.families'),
    'attribute-groups': t('navigation.attribute_groups'),
    'attributes': t('navigation.attributes'),
    'users': t('navigation.users'),
    'roles': t('navigation.roles'),
    'permissions': t('navigation.permissions'),
    'permission-groups': t('navigation.permission_groups'),
    'localizations': t('navigation.localizations'),
    'associations': t('navigation.associations'),
    'profile': 'Profil',
  };
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    if (segment === 'create') {
      breadcrumbs.push({
        name: t('common.create'),
        path: currentPath
      });
    } else if (pageMap[segment]) {
      breadcrumbs.push({
        name: pageMap[segment],
        path: currentPath
      });
    } else if (index === segments.length - 1 && segments[index - 1] !== 'create') {
      breadcrumbs.push({
        name: t('common.details'),
        path: currentPath
      });
    }
  });
  
  return breadcrumbs;
};

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onMenuClick, actions }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const pageTitle = getPageTitle(location.pathname, t);
  const breadcrumbs = getBreadcrumbs(location.pathname, t);
  const canGoBack = breadcrumbs.length > 1;

  return (
    <header className="bg-background border-b border-border px-4 sm:px-5" style={{ paddingTop: '0.4rem', paddingBottom: '0.49rem' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* Mobile Menu & Back Button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="lg:hidden p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Page Title & Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {pageTitle}
            </h1>
            
            {/* Desktop Breadcrumbs */}
            <div className="hidden sm:flex items-center space-x-1 mt-0.5">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && (
                    <span className="text-muted-foreground text-sm">/</span>
                  )}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={`text-xs transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'text-muted-foreground cursor-default'
                        : 'text-primary hover:text-primary-hover'
                    }`}
                    disabled={index === breadcrumbs.length - 1}
                  >
                    {index === 0 ? <Home className="h-3 w-3" /> : crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Page Actions - Left of Search */}
          {actions}
          {/* Desktop Search */}
          <div className="hidden lg:block relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('common.search')}
              className="pl-9 pr-4 py-1.5 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring w-72"
            />
          </div>
        </div>


          
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.email || 'User avatar'}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'admin@company.com'}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-popover rounded-md shadow-lg border border-border py-1 z-10">
                <button 
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t('common.settings')}</span>
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-background flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </header>
  );
};
