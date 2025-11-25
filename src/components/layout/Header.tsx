import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellRing,
  ChevronRight,
  Grid,
  Home,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  SlidersHorizontal,
  Tags,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { searchService } from '../../api/services/search.service';
import type { SearchEntityType, SearchSuggestion } from '../../api/types/api.types';

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

const HIDE_TITLE_ROUTES = ['/association-types/create'];

const getPageTitle = (pathname: string, t: (key: string) => string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return t('navigation.dashboard');

  const associationTypesLabelRaw = t('navigation.association_types');
  const associationTypesLabel =
    associationTypesLabelRaw && associationTypesLabelRaw !== 'navigation.association_types'
      ? associationTypesLabelRaw
      : 'Association Tipleri';
  const associationsRecordsLabelRaw = t('navigation.associations_records');
  const associationsRecordsLabel =
    associationsRecordsLabelRaw && associationsRecordsLabelRaw !== 'navigation.associations_records'
      ? associationsRecordsLabelRaw
      : 'Association Kayıtları';
  
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
    'association-types': associationTypesLabel,
    'associations': associationsRecordsLabel,
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

  const associationTypesLabelRaw = t('navigation.association_types');
  const associationTypesLabel =
    associationTypesLabelRaw && associationTypesLabelRaw !== 'navigation.association_types'
      ? associationTypesLabelRaw
      : 'Association Tipleri';
  const associationsRecordsLabelRaw = t('navigation.associations_records');
  const associationsRecordsLabel =
    associationsRecordsLabelRaw && associationsRecordsLabelRaw !== 'navigation.associations_records'
      ? associationsRecordsLabelRaw
      : 'Association Kayıtları';
  
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
    'association-types': associationTypesLabel,
    'associations': associationsRecordsLabel,
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
  const shouldHideTitle = useMemo(
    () => HIDE_TITLE_ROUTES.some((route) => location.pathname.startsWith(route)),
    [location.pathname],
  );
  
  const entityMetadata = useMemo(
    () =>
      ({
        item: { label: t('navigation.items'), icon: Package },
        item_type: { label: t('navigation.item_types'), icon: Layers },
        category: { label: t('navigation.categories'), icon: Tags },
        family: { label: t('navigation.families'), icon: Layers },
        attribute_group: { label: t('navigation.attribute_groups'), icon: Grid },
        attribute: { label: t('navigation.attributes'), icon: SlidersHorizontal },
        user: { label: t('navigation.users'), icon: Users },
        notification_rule: { label: t('navigation.notifications'), icon: BellRing },
      }) as Record<SearchEntityType, { label: string; icon: React.ComponentType<{ className?: string }> }>,
    [t],
  );
  
  const pageTitle = getPageTitle(location.pathname, t);
  const breadcrumbs = getBreadcrumbs(location.pathname, t);
  const canGoBack = breadcrumbs.length > 1;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const trimmedQuery = searchQuery.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const groupedSuggestions = useMemo(() => {
    const buckets = new Map<SearchEntityType, SearchSuggestion[]>();
    suggestions.forEach((suggestion) => {
      if (!buckets.has(suggestion.entityType)) {
        buckets.set(suggestion.entityType, []);
      }
      const bucket = buckets.get(suggestion.entityType)!;
      if (bucket.length < 3) {
        bucket.push(suggestion);
      }
    });
    return Array.from(buckets.entries());
  }, [suggestions]);

  const navigateToSearch = useCallback(
    (query: string, entityType?: SearchEntityType) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        return;
      }
      const params = new URLSearchParams({ q: trimmed });
      if (entityType) {
        params.set('entityType', entityType);
      }
      setIsSearchActive(false);
      setShowMobileSearch(false);
      setSuggestions([]);
      navigate(`/search?${params.toString()}`);
    },
    [navigate],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchQuery('');
      setSuggestions([]);
      setIsSearchActive(false);
      setShowMobileSearch(false);
      navigate(suggestion.route);
    },
    [navigate],
  );

  const handleSearchSubmit = useCallback(() => {
    navigateToSearch(searchQuery);
  }, [navigateToSearch, searchQuery]);

  const renderSuggestions = () => {
    if (!hasQuery) {
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          En az 2 karakter giriniz.
        </div>
      );
    }

    if (searchLoading) {
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      );
    }

    if (searchError) {
      return (
        <div className="px-4 py-3 text-sm text-error">
          {searchError}
        </div>
      );
    }

    if (hasQuery && groupedSuggestions.length === 0) {
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {t('common.no_results')}
        </div>
      );
    }

    return (
      <div className="py-2">
        {groupedSuggestions.map(([entityType, items]) => {
          const meta = entityMetadata[entityType];
          const Icon = meta?.icon ?? Search;
          return (
            <div key={entityType} className="py-1">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{meta?.label ?? entityType}</span>
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={`${entityType}-${item.id}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(item)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(meta?.label ?? entityType) + ' · ' + item.route}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (!isSearchActive && !showMobileSearch) {
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);

    const timeout = window.setTimeout(async () => {
      try {
        const response = await searchService.suggestions({ query: trimmed, limit: 9 });
        if (cancelled) {
          return;
        }
        setSuggestions(response.data.items ?? []);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSuggestions([]);
        setSearchError(t('common.error'));
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isSearchActive, searchQuery, showMobileSearch, t]);

  useEffect(() => {
    if (!isSearchActive) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchActive]);

  useEffect(() => {
    if (!isSearchActive && !showMobileSearch) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchActive(false);
        setShowMobileSearch(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [isSearchActive, showMobileSearch]);

  useEffect(() => {
    setIsSearchActive(false);
    setShowMobileSearch(false);
    setSearchQuery('');
    setSuggestions([]);
  }, [location.pathname]);

  return (
    <header className="bg-background border-b border-border px-4 sm:px-5" style={{ paddingTop: '0.4rem', paddingBottom: '0.44rem' }}>
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
            {shouldHideTitle ? null : (
              <>
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {pageTitle}
                </h1>

                {/* Desktop Breadcrumbs */}
                <div className="hidden sm:flex items-center space-x-1 mt-0.5">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={`${crumb.path}-${index}`}>
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
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {actions}
          <div ref={searchContainerRef} className="hidden lg:block relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => {
                setIsSearchActive(true);
                setShowMobileSearch(false);
              }}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder={t('common.search')}
              className="pl-9 pr-4 py-1.5 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring w-80 transition-shadow"
            />
            {isSearchActive && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 w-96 max-w-[28rem] rounded-md border border-border bg-popover shadow-xl">
                {renderSuggestions()}
                {hasQuery && groupedSuggestions.length > 0 && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigateToSearch(searchQuery)}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm text-primary hover:bg-muted transition-colors"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 h-9 w-9"
            onClick={() => {
              setShowMobileSearch(true);
              setIsSearchActive(false);
              setTimeout(() => {
                mobileSearchInputRef.current?.focus();
              }, 50);
            }}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <div className="relative w-7 h-7 flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || user.email || 'User avatar'}
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    data-avatar="true"
                  />
                ) : (
                  <span data-avatar="true" className="hidden" />
                )}
                <div
                  data-avatar-placeholder="true"
                  className={`absolute inset-0 bg-primary rounded-full flex items-center justify-center ${user?.avatar ? 'hidden' : 'flex'}`}
                >
                  <span className="text-xs font-semibold text-white">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
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
      {showMobileSearch && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-sm font-semibold text-foreground">{t('common.search')}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-9 w-9"
                onClick={() => {
                  setShowMobileSearch(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-4 pt-2 pb-4">
              <div className="relative">
                <Search className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  placeholder={t('common.search')}
                  className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="rounded-lg border border-border bg-popover shadow-md">
                {renderSuggestions()}
                {hasQuery && groupedSuggestions.length > 0 && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => navigateToSearch(searchQuery)}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm text-primary hover:bg-muted transition-colors"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
