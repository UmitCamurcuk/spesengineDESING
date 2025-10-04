import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../api/services/auth.service';
import { User, LoginRequest, LoginResponse } from '../api/types/api.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Auth context types
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        refreshToken();
      }, (env.AUTH_TOKEN_EXPIRY - 300) * 1000); // Refresh 5 minutes before expiry

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has valid token
      if (authService.isAuthenticated()) {
        // Try to get user profile
        const userProfile = await authService.getProfile();
        setUser(userProfile);
        setIsAuthenticated(true);
        logger.info('User authenticated successfully', { userId: userProfile.id });
      }
    } catch (error) {
      logger.error('Failed to initialize auth', error);
      // Clear invalid tokens
      authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: LoginResponse = await authService.login(credentials);
      
      // Store tokens
      authService.setTokens(response.token, response.refreshToken);
      
      // Set user state
      setUser(response.user);
      setIsAuthenticated(true);
      
      logger.info('User logged in successfully', { 
        userId: response.user.id,
        email: response.user.email 
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      logger.error('Login failed', { error: errorMessage, email: credentials.email });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await authService.logout();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      // Clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshTokenValue = authService.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshTokenValue);
      
      // Update tokens
      authService.setTokens(response.token, response.refreshToken);
      
      logger.debug('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      
      logger.info('Profile updated successfully', { userId: updatedUser.id });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile';
      setError(errorMessage);
      logger.error('Profile update failed', { error: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.changePassword(data);
      
      logger.info('Password changed successfully', { userId: user?.id });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to change password';
      setError(errorMessage);
      logger.error('Password change failed', { error: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // This would typically check against user roles and permissions
    // For now, we'll implement a simple check
    return user.role === 'admin' || user.role === 'super-admin';
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    clearError,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to access this page.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

// Permission-based component wrapper
export const withPermission = (permission: string) => <P extends object>(
  Component: React.ComponentType<P>
) => {
  const PermissionComponent = (props: P) => {
    const { hasPermission, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!hasPermission(permission)) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">You don't have permission to access this content.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  
  PermissionComponent.displayName = `withPermission(${permission})(${Component.displayName || Component.name})`;
  
  return PermissionComponent;
};

export default AuthContext;
