import React, { createContext, useCallback, useContext, useState } from 'react';

export interface EditActionHandlers {
  isEditing: boolean;
  canEdit: boolean;
  canSave: boolean;
  onEdit: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

interface EditActionContextValue {
  handlers: EditActionHandlers | null;
  register: (handlers: EditActionHandlers | null) => void;
}

const EditActionContext = createContext<EditActionContextValue | undefined>(undefined);

export const EditActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handlers, setHandlers] = useState<EditActionHandlers | null>(null);

  const register = useCallback((next: EditActionHandlers | null) => {
    setHandlers(next);
  }, []);

  return (
    <EditActionContext.Provider value={{ handlers, register }}>
      {children}
    </EditActionContext.Provider>
  );
};

export const useEditActionContext = () => {
  const value = useContext(EditActionContext);
  if (!value) {
    return {
      handlers: null,
      register: () => undefined,
    } as EditActionContextValue;
  }
  return value;
};
