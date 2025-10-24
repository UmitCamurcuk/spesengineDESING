import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DarkVariant = 'slate' | 'navy' | 'true-black';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  darkVariant: DarkVariant;
  effectiveTheme: EffectiveTheme;
  setMode: (mode: ThemeMode) => void;
  setDarkVariant: (variant: DarkVariant) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [darkVariant, setDarkVariantState] = useState<DarkVariant>('slate');
  
  // Detect system theme preference
  const getSystemTheme = (): EffectiveTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme());

  // Calculate effective theme
  const effectiveTheme: EffectiveTheme = mode === 'system' ? systemTheme : mode;

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedVariant = localStorage.getItem('theme-dark-variant') as DarkVariant;
    
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setModeState(savedMode);
    }
    
    if (savedVariant && ['slate', 'navy', 'true-black'].includes(savedVariant)) {
      setDarkVariantState(savedVariant);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'dark-slate', 'dark-navy', 'dark-true-black');
    
    // Add theme class
    if (effectiveTheme === 'dark') {
      root.classList.add('dark', `dark-${darkVariant}`);
    } else {
      root.classList.add('light');
    }
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-dark-variant', darkVariant);
    
    // Smooth transition
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
  }, [effectiveTheme, darkVariant]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  }, []);

  const setDarkVariant = useCallback((newVariant: DarkVariant) => {
    setDarkVariantState(newVariant);
    localStorage.setItem('theme-dark-variant', newVariant);
  }, []);

  const toggleTheme = useCallback(() => {
    if (mode === 'system') {
      setMode(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  }, [mode, setMode, systemTheme]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        darkVariant,
        effectiveTheme,
        setMode,
        setDarkVariant,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


