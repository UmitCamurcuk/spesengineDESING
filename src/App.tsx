import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Button } from './components/ui/Button';
import { Plus, Edit, Save, X } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth, withPermission } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PERMISSIONS } from './config/permissions';
import { EditActionProvider, useEditActionContext } from './contexts/EditActionContext';

// Items
import { ItemsList } from './pages/items/ItemsList';
import { ItemsDetails } from './pages/items/ItemsDetails';
import { ItemsCreate } from './pages/items/ItemsCreate';

// Item Types
import { ItemTypesList } from './pages/item-types/ItemTypesList';
import { ItemTypesDetails } from './pages/item-types/ItemTypesDetails';
import { ItemTypesCreate } from './pages/item-types/ItemTypesCreate';

// Categories
import { CategoriesList } from './pages/categories/CategoriesList';
import { CategoriesDetails } from './pages/categories/CategoriesDetails';
import { CategoriesCreate } from './pages/categories/CategoriesCreate';

// Families
import { FamiliesList } from './pages/families/FamiliesList';
import { FamiliesDetails } from './pages/families/FamiliesDetails';
import { FamiliesCreate } from './pages/families/FamiliesCreate';

// Attribute Groups
import { AttributeGroupsList } from './pages/attribute-groups/AttributeGroupsList';
import { AttributeGroupsDetails } from './pages/attribute-groups/AttributeGroupsDetails';
import { AttributeGroupsCreate } from './pages/attribute-groups/AttributeGroupsCreate';

// Attributes
import { AttributesList } from './pages/attributes/AttributesList';
import { AttributesDetails } from './pages/attributes/AttributesDetails';
import { AttributesCreate } from './pages/attributes/AttributesCreate';

// Users
import { UsersList } from './pages/users/UsersList';
import { UsersDetails } from './pages/users/UsersDetails';
import { UsersCreate } from './pages/users/UsersCreate';

// Roles
import { RolesList } from './pages/roles/RolesList';
import { RolesDetails } from './pages/roles/RolesDetails';
import { RolesCreate } from './pages/roles/RolesCreate';

// Permission Groups
import { PermissionGroupsList } from './pages/permission-groups/PermissionGroupsList';
import { PermissionGroupsDetails } from './pages/permission-groups/PermissionGroupsDetails';
import { PermissionGroupsCreate } from './pages/permission-groups/PermissionGroupsCreate';

// Permissions (create/details)
import { PermissionsCreate } from './pages/permissions/PermissionsCreate';
import { PermissionsDetails } from './pages/permissions/PermissionsDetails';
import { PermissionsList } from './pages/permissions/PermissionsList';

// Localizations
import { LocalizationsList } from './pages/localizations/LocalizationsList';
import { LocalizationsDetails } from './pages/localizations/LocalizationsDetails';
import { LocalizationsCreate } from './pages/localizations/LocalizationsCreate';

// Associations
import { AssociationsList } from './pages/associations/AssociationsList';
import { AssociationsDetails } from './pages/associations/AssociationsDetails';
import { AssociationsCreate } from './pages/associations/AssociationsCreate';

// Settings
import { Settings } from './pages/settings/Settings';

// Profile
import { Profile } from './pages/Profile';

const GuardedItemsList = withPermission(PERMISSIONS.CATALOG.ITEMS.LIST)(ItemsList);
const GuardedItemsDetails = withPermission(PERMISSIONS.CATALOG.ITEMS.VIEW)(ItemsDetails);
const GuardedItemsCreate = withPermission(PERMISSIONS.CATALOG.ITEMS.CREATE)(ItemsCreate);

const GuardedItemTypesList = withPermission(PERMISSIONS.CATALOG.ITEM_TYPES.LIST)(ItemTypesList);
const GuardedItemTypesDetails = withPermission(PERMISSIONS.CATALOG.ITEM_TYPES.VIEW)(ItemTypesDetails);
const GuardedItemTypesCreate = withPermission(PERMISSIONS.CATALOG.ITEM_TYPES.CREATE)(ItemTypesCreate);

const GuardedCategoriesList = withPermission(PERMISSIONS.CATALOG.CATEGORIES.LIST)(CategoriesList);
const GuardedCategoriesDetails = withPermission(PERMISSIONS.CATALOG.CATEGORIES.VIEW)(CategoriesDetails);
const GuardedCategoriesCreate = withPermission(PERMISSIONS.CATALOG.CATEGORIES.CREATE)(CategoriesCreate);

const GuardedFamiliesList = withPermission(PERMISSIONS.CATALOG.FAMILIES.LIST)(FamiliesList);
const GuardedFamiliesDetails = withPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW)(FamiliesDetails);
const GuardedFamiliesCreate = withPermission(PERMISSIONS.CATALOG.FAMILIES.CREATE)(FamiliesCreate);

const GuardedAttributeGroupsList = withPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.LIST)(AttributeGroupsList);
const GuardedAttributeGroupsDetails = withPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW)(AttributeGroupsDetails);
const GuardedAttributeGroupsCreate = withPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.CREATE)(AttributeGroupsCreate);

const GuardedAttributesList = withPermission(PERMISSIONS.CATALOG.ATTRIBUTES.LIST)(AttributesList);
const GuardedAttributesDetails = withPermission(PERMISSIONS.CATALOG.ATTRIBUTES.VIEW)(AttributesDetails);
const GuardedAttributesCreate = withPermission(PERMISSIONS.CATALOG.ATTRIBUTES.CREATE)(AttributesCreate);

const GuardedUsersList = withPermission(PERMISSIONS.SYSTEM.USERS.LIST)(UsersList);
const GuardedUsersDetails = withPermission(PERMISSIONS.SYSTEM.USERS.VIEW)(UsersDetails);
const GuardedUsersCreate = withPermission(PERMISSIONS.SYSTEM.USERS.CREATE)(UsersCreate);

const GuardedRolesList = withPermission(PERMISSIONS.SYSTEM.ROLES.LIST)(RolesList);
const GuardedRolesDetails = withPermission(PERMISSIONS.SYSTEM.ROLES.VIEW)(RolesDetails);
const GuardedRolesCreate = withPermission(PERMISSIONS.SYSTEM.ROLES.CREATE)(RolesCreate);

const GuardedPermissionsList = withPermission(PERMISSIONS.SYSTEM.PERMISSIONS.LIST)(PermissionsList);
const GuardedPermissionsDetails = withPermission(PERMISSIONS.SYSTEM.PERMISSIONS.VIEW)(PermissionsDetails);
const GuardedPermissionsCreate = withPermission(PERMISSIONS.SYSTEM.PERMISSIONS.CREATE)(PermissionsCreate);

const GuardedPermissionGroupsList = withPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.LIST)(PermissionGroupsList);
const GuardedPermissionGroupsDetails = withPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.VIEW)(PermissionGroupsDetails);
const GuardedPermissionGroupsCreate = withPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.CREATE)(PermissionGroupsCreate);

const GuardedLocalizationsList = withPermission(PERMISSIONS.SYSTEM.LOCALIZATIONS.LIST)(LocalizationsList);
const GuardedLocalizationsDetails = withPermission(PERMISSIONS.SYSTEM.LOCALIZATIONS.VIEW)(LocalizationsDetails);
const GuardedLocalizationsCreate = withPermission(PERMISSIONS.SYSTEM.LOCALIZATIONS.CREATE)(LocalizationsCreate);

const GuardedSettings = withPermission(PERMISSIONS.SYSTEM.SETTINGS.VIEW)(Settings);

type CreateActionConfig = {
  basePath: string;
  createPath: string;
  labelKey: string;
  permission?: string;
};

type EditActionConfig = {
  basePath: string;
  permission?: string;
};

const CREATE_ACTIONS: CreateActionConfig[] = [
  {
    basePath: '/items',
    createPath: '/items/create',
    labelKey: 'items.create_title',
    permission: PERMISSIONS.CATALOG.ITEMS.CREATE,
  },
  {
    basePath: '/item-types',
    createPath: '/item-types/create',
    labelKey: 'item_types.create_title',
    permission: PERMISSIONS.CATALOG.ITEM_TYPES.CREATE,
  },
  {
    basePath: '/categories',
    createPath: '/categories/create',
    labelKey: 'categories.create_title',
    permission: PERMISSIONS.CATALOG.CATEGORIES.CREATE,
  },
  {
    basePath: '/families',
    createPath: '/families/create',
    labelKey: 'families.create_title',
    permission: PERMISSIONS.CATALOG.FAMILIES.CREATE,
  },
  {
    basePath: '/attribute-groups',
    createPath: '/attribute-groups/create',
    labelKey: 'attribute_groups.create_title',
    permission: PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.CREATE,
  },
  {
    basePath: '/attributes',
    createPath: '/attributes/create',
    labelKey: 'attributes.create_title',
    permission: PERMISSIONS.CATALOG.ATTRIBUTES.CREATE,
  },
  {
    basePath: '/roles',
    createPath: '/roles/create',
    labelKey: 'roles.create_title',
    permission: PERMISSIONS.SYSTEM.ROLES.CREATE,
  },
  {
    basePath: '/permissions',
    createPath: '/permissions/create',
    labelKey: 'permissions.create_title',
    permission: PERMISSIONS.SYSTEM.PERMISSIONS.CREATE,
  },
  {
    basePath: '/permission-groups',
    createPath: '/permission-groups/create',
    labelKey: 'permission_groups.create_title',
    permission: PERMISSIONS.SYSTEM.PERMISSION_GROUPS.CREATE,
  },
  {
    basePath: '/localizations',
    createPath: '/localizations/create',
    labelKey: 'localizations.create_title',
    permission: PERMISSIONS.SYSTEM.LOCALIZATIONS.CREATE,
  },
  {
    basePath: '/users',
    createPath: '/users/create',
    labelKey: 'users.create_title',
  },
  {
    basePath: '/associations',
    createPath: '/associations/create',
    labelKey: 'associations.create_title',
  },
];

const EDIT_ACTIONS: EditActionConfig[] = [
  { basePath: '/items', permission: PERMISSIONS.CATALOG.ITEMS.UPDATE },
  { basePath: '/item-types', permission: PERMISSIONS.CATALOG.ITEM_TYPES.UPDATE },
  { basePath: '/categories', permission: PERMISSIONS.CATALOG.CATEGORIES.UPDATE },
  { basePath: '/families', permission: PERMISSIONS.CATALOG.FAMILIES.UPDATE },
  { basePath: '/attribute-groups', permission: PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.UPDATE },
  { basePath: '/attributes', permission: PERMISSIONS.CATALOG.ATTRIBUTES.UPDATE },
  { basePath: '/roles', permission: PERMISSIONS.SYSTEM.ROLES.UPDATE },
  { basePath: '/permissions', permission: PERMISSIONS.SYSTEM.PERMISSIONS.UPDATE },
  { basePath: '/permission-groups', permission: PERMISSIONS.SYSTEM.PERMISSION_GROUPS.UPDATE },
  { basePath: '/localizations', permission: PERMISSIONS.SYSTEM.LOCALIZATIONS.UPDATE },
  { basePath: '/users', permission: PERMISSIONS.SYSTEM.USERS.UPDATE },
  { basePath: '/associations' },
];

const isDetailPath = (basePath: string, pathname: string): boolean => {
  if (!pathname.startsWith(`${basePath}/`)) {
    return false;
  }
  if (pathname.endsWith('/create')) {
    return false;
  }
  const baseSegments = basePath.split('/').filter(Boolean).length;
  const pathSegments = pathname.split('/').filter(Boolean).length;
  return pathSegments === baseSegments + 1;
};

const AppContentInner: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const pathname = location.pathname;
  const { handlers } = useEditActionContext();

  const headerAction = useMemo(() => {
    const createConfig = CREATE_ACTIONS.find((config) => pathname === config.basePath);
    if (createConfig && (!createConfig.permission || hasPermission(createConfig.permission))) {
      return (
        <Button
          size="sm"
          onClick={(event) => {
            event.preventDefault();
            navigate(createConfig.createPath);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t(createConfig.labelKey)}</span>
        </Button>
      );
    }

    const editConfig = EDIT_ACTIONS.find((config) => isDetailPath(config.basePath, pathname));
    if (
      editConfig &&
      handlers &&
      (!editConfig.permission || hasPermission(editConfig.permission))
    ) {
      if (handlers.isEditing) {
        return (
          <div className="flex items-center gap-2">
            {handlers.onSave ? (
              <Button size="sm" onClick={handlers.onSave} disabled={!handlers.canSave}>
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('common.save')}</span>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handlers.onCancel}>
              <X className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('common.cancel')}</span>
            </Button>
          </div>
        );
      }

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handlers.onEdit}
          disabled={!handlers.canEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('common.edit')}</span>
        </Button>
      );
    }

    return null;
  }, [handlers, hasPermission, navigate, pathname, t]);

  const headerUser = useMemo(() => {
    if (!user) {
      return undefined;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    return {
      name: fullName || user.email,
      email: user.email,
      avatar: user.profilePhotoUrl,
    };
  }, [user]);

  return (
    <Layout user={headerUser} onLogout={logout} headerActions={headerAction}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Items Routes */}
        <Route path="/items" element={<GuardedItemsList />} />
        <Route path="/items/:id" element={<GuardedItemsDetails />} />
        <Route path="/items/create" element={<GuardedItemsCreate />} />
        
        {/* Item Types Routes */}
        <Route path="/item-types" element={<GuardedItemTypesList />} />
        <Route path="/item-types/:id" element={<GuardedItemTypesDetails />} />
        <Route path="/item-types/create" element={<GuardedItemTypesCreate />} />
        
        {/* Categories Routes */}
        <Route path="/categories" element={<GuardedCategoriesList />} />
        <Route path="/categories/:id" element={<GuardedCategoriesDetails />} />
        <Route path="/categories/create" element={<GuardedCategoriesCreate />} />
        
        {/* Families Routes */}
        <Route path="/families" element={<GuardedFamiliesList />} />
        <Route path="/families/:id" element={<GuardedFamiliesDetails />} />
        <Route path="/families/create" element={<GuardedFamiliesCreate />} />
        
        {/* Attribute Groups Routes */}
        <Route path="/attribute-groups" element={<GuardedAttributeGroupsList />} />
        <Route path="/attribute-groups/:id" element={<GuardedAttributeGroupsDetails />} />
        <Route path="/attribute-groups/create" element={<GuardedAttributeGroupsCreate />} />
        
        {/* Attributes Routes */}
        <Route path="/attributes" element={<GuardedAttributesList />} />
        <Route path="/attributes/:id" element={<GuardedAttributesDetails />} />
        <Route path="/attributes/create" element={<GuardedAttributesCreate />} />
        
        {/* Users Routes */}
        <Route path="/users" element={<GuardedUsersList />} />
        <Route path="/users/:id" element={<GuardedUsersDetails />} />
        <Route path="/users/create" element={<GuardedUsersCreate />} />
        
        {/* Roles Routes */}
        <Route path="/roles" element={<GuardedRolesList />} />
        <Route path="/roles/:id" element={<GuardedRolesDetails />} />
        <Route path="/roles/create" element={<GuardedRolesCreate />} />
        
        {/* Permission Groups Routes */}
        <Route path="/permission-groups" element={<GuardedPermissionGroupsList />} />
        <Route path="/permission-groups/:id" element={<GuardedPermissionGroupsDetails />} />
        <Route path="/permission-groups/create" element={<GuardedPermissionGroupsCreate />} />
        
        {/* Permissions Routes */}
        <Route path="/permissions" element={<GuardedPermissionsList />} />
        <Route path="/permissions/:id" element={<GuardedPermissionsDetails />} />
        <Route path="/permissions/create" element={<GuardedPermissionsCreate />} />
        
        {/* Localizations Routes */}
        <Route path="/localizations" element={<GuardedLocalizationsList />} />
        <Route path="/localizations/:id" element={<GuardedLocalizationsDetails />} />
        <Route path="/localizations/create" element={<GuardedLocalizationsCreate />} />
        
        {/* Associations Routes */}
        <Route path="/associations" element={<AssociationsList />} />
        <Route path="/associations/:id" element={<AssociationsDetails />} />
        <Route path="/associations/create" element={<AssociationsCreate />} />
        
        {/* Settings Route */}
        <Route path="/settings" element={<GuardedSettings />} />
        
        {/* Profile Route */}
        <Route path="/profile" element={<Profile />} />
        
        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => (
  <EditActionProvider>
    <AppContentInner />
  </EditActionProvider>
);

const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppContent />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <ToastProvider>
                  <AppRouter />
                </ToastProvider>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
