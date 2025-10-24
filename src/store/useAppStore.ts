import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, Item, Category, Family } from '../api/types/api.types';

// App state interface
interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  darkVariant: 'slate' | 'navy' | 'true-black';
  language: string;
  
  // User State
  user: User | null;
  isAuthenticated: boolean;
  
  // Data State
  items: Item[];
  categories: Category[];
  families: Family[];
  
  // UI State
  loading: {
    items: boolean;
    categories: boolean;
    families: boolean;
    user: boolean;
  };
  
  // Error State
  errors: {
    items: string | null;
    categories: string | null;
    families: string | null;
    user: string | null;
  };
  
  // Search & Filter State
  search: {
    query: string;
    filters: Record<string, any>;
    sort: string;
    order: 'asc' | 'desc';
  };
  
  // Pagination State
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Selected Items
  selectedItems: string[];
  selectedCategories: string[];
  selectedFamilies: string[];
  
  // Modal State
  modals: {
    createItem: boolean;
    createCategory: boolean;
    createFamily: boolean;
    editItem: boolean;
    editCategory: boolean;
    editFamily: boolean;
    deleteItem: boolean;
    deleteCategory: boolean;
    deleteFamily: boolean;
  };
  
  // Toast State
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

// App actions interface
interface AppActions {
  // UI Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDarkVariant: (variant: 'slate' | 'navy' | 'true-black') => void;
  setLanguage: (language: string) => void;
  
  // User Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Data Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
  
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  
  setFamilies: (families: Family[]) => void;
  addFamily: (family: Family) => void;
  updateFamily: (id: string, updates: Partial<Family>) => void;
  removeFamily: (id: string) => void;
  
  // Loading Actions
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  setAllLoading: (loading: boolean) => void;
  
  // Error Actions
  setError: (key: keyof AppState['errors'], error: string | null) => void;
  clearErrors: () => void;
  
  // Search & Filter Actions
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Record<string, any>) => void;
  setSort: (sort: string, order: 'asc' | 'desc') => void;
  clearSearch: () => void;
  
  // Pagination Actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Selection Actions
  setSelectedItems: (items: string[]) => void;
  addSelectedItem: (item: string) => void;
  removeSelectedItem: (item: string) => void;
  clearSelectedItems: () => void;
  
  setSelectedCategories: (categories: string[]) => void;
  addSelectedCategory: (category: string) => void;
  removeSelectedCategory: (category: string) => void;
  clearSelectedCategories: () => void;
  
  setSelectedFamilies: (families: string[]) => void;
  addSelectedFamily: (family: string) => void;
  removeSelectedFamily: (family: string) => void;
  clearSelectedFamilies: () => void;
  
  // Modal Actions
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  closeAllModals: () => void;
  
  // Toast Actions
  addToast: (toast: Omit<AppState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Reset Actions
  resetApp: () => void;
  resetData: () => void;
  resetUI: () => void;
}

// Combined store type
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  // UI State
  sidebarCollapsed: false,
  theme: 'system',
  darkVariant: 'slate',
  language: 'en',
  
  // User State
  user: null,
  isAuthenticated: false,
  
  // Data State
  items: [],
  categories: [],
  families: [],
  
  // Loading State
  loading: {
    items: false,
    categories: false,
    families: false,
    user: false,
  },
  
  // Error State
  errors: {
    items: null,
    categories: null,
    families: null,
    user: null,
  },
  
  // Search & Filter State
  search: {
    query: '',
    filters: {},
    sort: 'name',
    order: 'asc',
  },
  
  // Pagination State
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  
  // Selected Items
  selectedItems: [],
  selectedCategories: [],
  selectedFamilies: [],
  
  // Modal State
  modals: {
    createItem: false,
    createCategory: false,
    createFamily: false,
    editItem: false,
    editCategory: false,
    editFamily: false,
    deleteItem: false,
    deleteCategory: false,
    deleteFamily: false,
  },
  
  // Toast State
  toasts: [],
};

// Create store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // UI Actions
        setSidebarCollapsed: (collapsed) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),
        
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),
        
        setDarkVariant: (variant) =>
          set((state) => {
            state.darkVariant = variant;
          }),
        
        setLanguage: (language) =>
          set((state) => {
            state.language = language;
          }),
        
        // User Actions
        setUser: (user) =>
          set((state) => {
            state.user = user;
          }),
        
        setAuthenticated: (authenticated) =>
          set((state) => {
            state.isAuthenticated = authenticated;
          }),
        
        updateUser: (updates) =>
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...updates };
            }
          }),
        
        // Data Actions
        setItems: (items) =>
          set((state) => {
            state.items = items;
          }),
        
        addItem: (item) =>
          set((state) => {
            state.items.push(item);
          }),
        
        updateItem: (id, updates) =>
          set((state) => {
            const index = state.items.findIndex((item) => item.id === id);
            if (index !== -1) {
              state.items[index] = { ...state.items[index], ...updates };
            }
          }),
        
        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((item) => item.id !== id);
          }),
        
        setCategories: (categories) =>
          set((state) => {
            state.categories = categories;
          }),
        
        addCategory: (category) =>
          set((state) => {
            state.categories.push(category);
          }),
        
        updateCategory: (id, updates) =>
          set((state) => {
            const index = state.categories.findIndex((category) => category.id === id);
            if (index !== -1) {
              state.categories[index] = { ...state.categories[index], ...updates };
            }
          }),
        
        removeCategory: (id) =>
          set((state) => {
            state.categories = state.categories.filter((category) => category.id !== id);
          }),
        
        setFamilies: (families) =>
          set((state) => {
            state.families = families;
          }),
        
        addFamily: (family) =>
          set((state) => {
            state.families.push(family);
          }),
        
        updateFamily: (id, updates) =>
          set((state) => {
            const index = state.families.findIndex((family) => family.id === id);
            if (index !== -1) {
              state.families[index] = { ...state.families[index], ...updates };
            }
          }),
        
        removeFamily: (id) =>
          set((state) => {
            state.families = state.families.filter((family) => family.id !== id);
          }),
        
        // Loading Actions
        setLoading: (key, loading) =>
          set((state) => {
            state.loading[key] = loading;
          }),
        
        setAllLoading: (loading) =>
          set((state) => {
            state.loading.items = loading;
            state.loading.categories = loading;
            state.loading.families = loading;
            state.loading.user = loading;
          }),
        
        // Error Actions
        setError: (key, error) =>
          set((state) => {
            state.errors[key] = error;
          }),
        
        clearErrors: () =>
          set((state) => {
            state.errors.items = null;
            state.errors.categories = null;
            state.errors.families = null;
            state.errors.user = null;
          }),
        
        // Search & Filter Actions
        setSearchQuery: (query) =>
          set((state) => {
            state.search.query = query;
          }),
        
        setSearchFilters: (filters) =>
          set((state) => {
            state.search.filters = filters;
          }),
        
        setSort: (sort, order) =>
          set((state) => {
            state.search.sort = sort;
            state.search.order = order;
          }),
        
        clearSearch: () =>
          set((state) => {
            state.search.query = '';
            state.search.filters = {};
            state.search.sort = 'name';
            state.search.order = 'asc';
          }),
        
        // Pagination Actions
        setPage: (page) =>
          set((state) => {
            state.pagination.page = page;
          }),
        
        setLimit: (limit) =>
          set((state) => {
            state.pagination.limit = limit;
          }),
        
        setTotal: (total) =>
          set((state) => {
            state.pagination.total = total;
          }),
        
        nextPage: () =>
          set((state) => {
            const { page, limit, total } = state.pagination;
            const totalPages = Math.ceil(total / limit);
            if (page < totalPages) {
              state.pagination.page = page + 1;
            }
          }),
        
        prevPage: () =>
          set((state) => {
            if (state.pagination.page > 1) {
              state.pagination.page = state.pagination.page - 1;
            }
          }),
        
        // Selection Actions
        setSelectedItems: (items) =>
          set((state) => {
            state.selectedItems = items;
          }),
        
        addSelectedItem: (item) =>
          set((state) => {
            if (!state.selectedItems.includes(item)) {
              state.selectedItems.push(item);
            }
          }),
        
        removeSelectedItem: (item) =>
          set((state) => {
            state.selectedItems = state.selectedItems.filter((id) => id !== item);
          }),
        
        clearSelectedItems: () =>
          set((state) => {
            state.selectedItems = [];
          }),
        
        setSelectedCategories: (categories) =>
          set((state) => {
            state.selectedCategories = categories;
          }),
        
        addSelectedCategory: (category) =>
          set((state) => {
            if (!state.selectedCategories.includes(category)) {
              state.selectedCategories.push(category);
            }
          }),
        
        removeSelectedCategory: (category) =>
          set((state) => {
            state.selectedCategories = state.selectedCategories.filter((id) => id !== category);
          }),
        
        clearSelectedCategories: () =>
          set((state) => {
            state.selectedCategories = [];
          }),
        
        setSelectedFamilies: (families) =>
          set((state) => {
            state.selectedFamilies = families;
          }),
        
        addSelectedFamily: (family) =>
          set((state) => {
            if (!state.selectedFamilies.includes(family)) {
              state.selectedFamilies.push(family);
            }
          }),
        
        removeSelectedFamily: (family) =>
          set((state) => {
            state.selectedFamilies = state.selectedFamilies.filter((id) => id !== family);
          }),
        
        clearSelectedFamilies: () =>
          set((state) => {
            state.selectedFamilies = [];
          }),
        
        // Modal Actions
        openModal: (modal) =>
          set((state) => {
            state.modals[modal] = true;
          }),
        
        closeModal: (modal) =>
          set((state) => {
            state.modals[modal] = false;
          }),
        
        closeAllModals: () =>
          set((state) => {
            Object.keys(state.modals).forEach((key) => {
              state.modals[key as keyof AppState['modals']] = false;
            });
          }),
        
        // Toast Actions
        addToast: (toast) =>
          set((state) => {
            const id = Math.random().toString(36).substr(2, 9);
            state.toasts.push({ ...toast, id });
          }),
        
        removeToast: (id) =>
          set((state) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== id);
          }),
        
        clearToasts: () =>
          set((state) => {
            state.toasts = [];
          }),
        
        // Reset Actions
        resetApp: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),
        
        resetData: () =>
          set((state) => {
            state.items = [];
            state.categories = [];
            state.families = [];
            state.selectedItems = [];
            state.selectedCategories = [];
            state.selectedFamilies = [];
            state.pagination = initialState.pagination;
            state.search = initialState.search;
          }),
        
        resetUI: () =>
          set((state) => {
            state.sidebarCollapsed = false;
            state.modals = initialState.modals;
            state.toasts = [];
            state.loading = initialState.loading;
            state.errors = initialState.errors;
          }),
      })),
      {
        name: 'spes-engine-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          darkVariant: state.darkVariant,
          language: state.language,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'spes-engine-store',
    }
  )
);

// Selectors for better performance
export const useAppSelector = <T>(selector: (state: AppStore) => T) =>
  useAppStore(selector);

// Common selectors
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useTheme = () => useAppStore((state) => state.theme);
export const useLanguage = () => useAppStore((state) => state.language);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useItems = () => useAppStore((state) => state.items);
export const useCategories = () => useAppStore((state) => state.categories);
export const useFamilies = () => useAppStore((state) => state.families);
export const useLoading = () => useAppStore((state) => state.loading);
export const useErrors = () => useAppStore((state) => state.errors);
export const useSearch = () => useAppStore((state) => state.search);
export const usePagination = () => useAppStore((state) => state.pagination);
export const useSelectedItems = () => useAppStore((state) => state.selectedItems);
export const useModals = () => useAppStore((state) => state.modals);
export const useToasts = () => useAppStore((state) => state.toasts);
