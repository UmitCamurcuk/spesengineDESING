import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { authService } from '../api/services/auth.service';
import { ApiError, AuthUser, LoginRequest, TokenInfo } from '../api/types/api.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { useAppDispatch, useReduxSelector } from '../redux/hooks';
import { loginThunk, logoutThunk, resetAuthState, setUser } from '../redux/slices/authSlice';

// Auth context types
interface AuthContextType {
  // State
  user: AuthUser | null;
  session: TokenInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<void>;
  deleteProfilePhoto: () => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
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
  const dispatch = useAppDispatch();
  const { user, session, accessToken, status, error: authError } = useReduxSelector((state) => state.auth);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken]);
  const isLoading = isInitializing || status === 'loading' || isProcessing;
  const permissionSet = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);

  const fetchAndSetProfile = async () => {
    const profile = await authService.getProfile();
    dispatch(setUser({ user: profile.user, session: profile.token }));
    return profile;
  };

  // Initialize auth state on mount - UNIFIED APPROACH (single /me API call)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);

        // No token, no need to call API
        if (!authService.isAuthenticated() || !accessToken) {
          setError(null);
          setIsInitializing(false);
          return;
        }

        // Already have user data, no need to fetch again
        if (user) {
          setIsInitializing(false);
          return;
        }

        // Fetch user profile only once
        const profile = await fetchAndSetProfile();
        logger.info('User authenticated successfully', { email: profile.user.email });
      } catch (error) {
        logger.error('Failed to initialize auth', error);
        dispatch(resetAuthState());
        setError('Oturum başlatılamadı');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [accessToken, user]); // Re-run only when accessToken or user changes

  // Auto-refresh token before expiry
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        refreshToken();
      }, (env.AUTH_TOKEN_EXPIRY - 300) * 1000); // Refresh 5 minutes before expiry

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Keep local error in sync with auth slice error
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Login function
  const login = async (credentials: LoginRequest) => {
    try {
      setError(null);
      setIsProcessing(true);
      await dispatch(loginThunk(credentials)).unwrap();

      const profile = await fetchAndSetProfile();
      
      logger.info('User logged in successfully', {
        email: profile.user.email,
      });
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      logger.error('Login failed', { error: errorMessage, email: credentials.email });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      dispatch(setUser({ user: null, session: null }));
      setError(null);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      dispatch(resetAuthState());
      dispatch(setUser({ user: null, session: null }));
      setError(null);
    } finally {
      setIsInitializing(false);
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

      authService.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );

      logger.debug('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<AuthUser>) => {
    try {
      setIsProcessing(true);
      setError(null);

      await authService.updateProfile(data);
      const profile = await fetchAndSetProfile();
      logger.info('Profile updated successfully', { email: profile.user.email });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile';
      setError(errorMessage);
      logger.error('Profile update failed', { error: errorMessage });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProfilePhoto = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      if (user?.profilePhotoUrl) {
        await authService.updateProfilePhoto(file);
      } else {
        await authService.uploadProfilePhoto(file);
      }

      const profile = await fetchAndSetProfile();
      logger.info('Profile photo updated successfully', { email: profile.user.email });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile photo';
      setError(errorMessage);
      logger.error('Profile photo update failed', { error: errorMessage });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      await authService.deleteProfilePhoto();
      const profile = await fetchAndSetProfile();
      logger.info('Profile photo deleted successfully', { email: profile.user.email });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete profile photo';
      setError(errorMessage);
      logger.error('Profile photo delete failed', { error: errorMessage });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Change password
  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);

      await authService.changePassword(data);
      
      logger.info('Password changed successfully', { email: user?.email });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to change password';
      setError(errorMessage);
      logger.error('Password change failed', { error: errorMessage });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) {
        return false;
      }
      return permissionSet.has(permission);
    },
    [permissionSet, user],
  );

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return (user.role || '').toLowerCase() === role.toLowerCase();
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
    updateProfilePhoto,
    deleteProfilePhoto,
    clearError,
    hasPermission,
    hasRole,
    session,
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
