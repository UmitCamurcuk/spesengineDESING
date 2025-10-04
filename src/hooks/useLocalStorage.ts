import { useState, useEffect, useCallback } from 'react';

// Local storage hook
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from local storage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

// Session storage hook
export const useSessionStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Get from session storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to session storage
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from session storage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// Storage hook with validation
export const useStorageWithValidation = <T>(
  key: string,
  initialValue: T,
  validator: (value: any) => value is T,
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage === 'localStorage' 
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
      
      if (item) {
        const parsed = JSON.parse(item);
        if (validator(parsed)) {
          return parsed;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading ${storage} key "${key}":`, error);
      return initialValue;
    }
  });

  const [isValid, setIsValid] = useState(true);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        if (validator(valueToStore)) {
          setStoredValue(valueToStore);
          setIsValid(true);
          
          const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
          storageObj.setItem(key, JSON.stringify(valueToStore));
        } else {
          setIsValid(false);
          console.error(`Invalid value for ${storage} key "${key}":`, valueToStore);
        }
      } catch (error) {
        console.error(`Error setting ${storage} key "${key}":`, error);
        setIsValid(false);
      }
    },
    [key, storedValue, validator, storage]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      setIsValid(true);
      
      const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
      storageObj.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${storage} key "${key}":`, error);
    }
  }, [key, initialValue, storage]);

  return [storedValue, setValue, removeValue, isValid];
};

// Storage hook with expiration
export const useStorageWithExpiration = <T>(
  key: string,
  initialValue: T,
  expirationTime: number, // in milliseconds
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage === 'localStorage' 
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
      
      if (item) {
        const parsed = JSON.parse(item);
        const now = new Date().getTime();
        
        if (parsed.expirationTime && now < parsed.expirationTime) {
          return parsed.value;
        } else {
          // Expired, remove from storage
          const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
          storageObj.removeItem(key);
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading ${storage} key "${key}":`, error);
      return initialValue;
    }
  });

  const [isExpired, setIsExpired] = useState(false);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        const expirationTime = new Date().getTime() + expirationTime;
        
        setStoredValue(valueToStore);
        setIsExpired(false);
        
        const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
        storageObj.setItem(key, JSON.stringify({
          value: valueToStore,
          expirationTime
        }));
      } catch (error) {
        console.error(`Error setting ${storage} key "${key}":`, error);
      }
    },
    [key, storedValue, expirationTime, storage]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      setIsExpired(false);
      
      const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
      storageObj.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${storage} key "${key}":`, error);
    }
  }, [key, initialValue, storage]);

  // Check expiration periodically
  useEffect(() => {
    const checkExpiration = () => {
      try {
        const item = storage === 'localStorage' 
          ? window.localStorage.getItem(key)
          : window.sessionStorage.getItem(key);
        
        if (item) {
          const parsed = JSON.parse(item);
          const now = new Date().getTime();
          
          if (parsed.expirationTime && now >= parsed.expirationTime) {
            setIsExpired(true);
            removeValue();
          }
        }
      } catch (error) {
        console.error(`Error checking expiration for ${storage} key "${key}":`, error);
      }
    };

    const interval = setInterval(checkExpiration, 1000); // Check every second
    return () => clearInterval(interval);
  }, [key, storage, removeValue]);

  return [storedValue, setValue, removeValue, isExpired];
};

// Storage hook with encryption (basic base64 encoding)
export const useEncryptedStorage = <T>(
  key: string,
  initialValue: T,
  password: string,
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Simple base64 encoding/decoding (not secure, just for demonstration)
  const encrypt = (data: string): string => {
    return btoa(data + password);
  };

  const decrypt = (encryptedData: string): string => {
    try {
      const decoded = atob(encryptedData);
      return decoded.slice(0, -password.length);
    } catch {
      return '';
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage === 'localStorage' 
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
      
      if (item) {
        const decrypted = decrypt(item);
        return decrypted ? JSON.parse(decrypted) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading encrypted ${storage} key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        const encrypted = encrypt(JSON.stringify(valueToStore));
        
        setStoredValue(valueToStore);
        
        const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
        storageObj.setItem(key, encrypted);
      } catch (error) {
        console.error(`Error setting encrypted ${storage} key "${key}":`, error);
      }
    },
    [key, storedValue, storage]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage;
      storageObj.removeItem(key);
    } catch (error) {
      console.error(`Error removing encrypted ${storage} key "${key}":`, error);
    }
  }, [key, initialValue, storage]);

  return [storedValue, setValue, removeValue];
};
