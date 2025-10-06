import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Button } from './components/ui/Button';
import { Plus, Edit } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AppContent: React.FC<{
  user: User | null;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getHeaderActions = () => {
    const { t } = useLanguage();
    const pathname = location.pathname;
    
    // List pages - Create buttons
    if (pathname === '/items') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/items/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('items.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/item-types') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/item-types/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('item_types.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/categories') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/categories/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('categories.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/families') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/families/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('families.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/attribute-groups') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/attribute-groups/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('attribute_groups.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/attributes') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/attributes/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('attributes.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/users') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/users/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('users.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/permissions') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/permissions/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('permissions.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/roles') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/roles/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('roles.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/permission-groups') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/permission-groups/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('permission_groups.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/localizations') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/localizations/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('localizations.create_title')}</span>
        </Button>
      );
    }
    
    if (pathname === '/associations') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/associations/create');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('associations.create_title')}</span>
        </Button>
      );
    }
    
    // Detail pages - Edit buttons
    if (pathname.match(/\/(items|item-types|categories|families|attribute-groups|attributes|users|permissions|roles|permission-groups|localizations)\/[^\/]+$/) && !pathname.includes('/create')) {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Trigger edit mode for attributes page
            if (pathname.startsWith('/attributes/')) {
              const event = new CustomEvent('toggleEditMode');
              window.dispatchEvent(event);
            }
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('common.edit')}</span>
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <Layout user={user || undefined} onLogout={onLogout} headerActions={getHeaderActions()}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Items Routes */}
        <Route path="/items" element={<ItemsList />} />
        <Route path="/items/:id" element={<ItemsDetails />} />
        <Route path="/items/create" element={<ItemsCreate />} />
        
        {/* Item Types Routes */}
        <Route path="/item-types" element={<ItemTypesList />} />
        <Route path="/item-types/:id" element={<ItemTypesDetails />} />
        <Route path="/item-types/create" element={<ItemTypesCreate />} />
        
        {/* Categories Routes */}
        <Route path="/categories" element={<CategoriesList />} />
        <Route path="/categories/:id" element={<CategoriesDetails />} />
        <Route path="/categories/create" element={<CategoriesCreate />} />
        
        {/* Families Routes */}
        <Route path="/families" element={<FamiliesList />} />
        <Route path="/families/:id" element={<FamiliesDetails />} />
        <Route path="/families/create" element={<FamiliesCreate />} />
        
        {/* Attribute Groups Routes */}
        <Route path="/attribute-groups" element={<AttributeGroupsList />} />
        <Route path="/attribute-groups/:id" element={<AttributeGroupsDetails />} />
        <Route path="/attribute-groups/create" element={<AttributeGroupsCreate />} />
        
        {/* Attributes Routes */}
        <Route path="/attributes" element={<AttributesList />} />
        <Route path="/attributes/:id" element={<AttributesDetails />} />
        <Route path="/attributes/create" element={<AttributesCreate />} />
        
        {/* Users Routes */}
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UsersDetails />} />
        <Route path="/users/create" element={<UsersCreate />} />
        
        {/* Roles Routes */}
        <Route path="/roles" element={<RolesList />} />
        <Route path="/roles/:id" element={<RolesDetails />} />
        <Route path="/roles/create" element={<RolesCreate />} />
        
        {/* Permission Groups Routes */}
        <Route path="/permission-groups" element={<PermissionGroupsList />} />
        <Route path="/permission-groups/:id" element={<PermissionGroupsDetails />} />
        <Route path="/permission-groups/create" element={<PermissionGroupsCreate />} />
        
        {/* Permissions Routes */}
        <Route path="/permissions" element={<PermissionsList />} />
        <Route path="/permissions/:id" element={<PermissionsDetails />} />
        <Route path="/permissions/create" element={<PermissionsCreate />} />
        
        {/* Localizations Routes */}
        <Route path="/localizations" element={<LocalizationsList />} />
        <Route path="/localizations/:id" element={<LocalizationsDetails />} />
        <Route path="/localizations/create" element={<LocalizationsCreate />} />
        
        {/* Associations Routes */}
        <Route path="/associations" element={<AssociationsList />} />
        <Route path="/associations/:id" element={<AssociationsDetails />} />
        <Route path="/associations/create" element={<AssociationsCreate />} />
        
        {/* Settings Route */}
        <Route path="/settings" element={<Settings />} />
        
        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (credentials: { email: string; password: string }) => {
    // Mock authentication - accept any credentials for demo
    setUser({
      id: '1',
      name: 'Admin User',
      email: credentials.email,
      role: 'admin'
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                {!isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <AppContent user={user} onLogout={handleLogout} />
                )}
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;