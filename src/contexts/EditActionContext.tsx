import React, { createContext, useCallback, useContext, useState } from 'react';

export interface EditActionHandlers {
  isEditing: boolean;
  canEdit: boolean;
  canSave: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onDeleteRequest?: () => void;
  canDelete?: boolean;
  deleteLabel?: string;
  deleteLoading?: boolean;
}

interface EditActionContextValue {
  handlers: EditActionHandlers | null;
  register: (handlers: EditActionHandlers | null) => void;
}

const EditActionContext = createContext<EditActionContextValue | undefined>(undefined);

export const EditActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handlers, setHandlers] = useState<EditActionHandlers | null>(null);

  const register = useCallback((next: EditActionHandlers | null) => {
    setHandlers((previous) => {
      if (previous === next) {
        return previous;
      }

      if (previous && next) {
        const same =
          previous.isEditing === next.isEditing &&
          previous.canEdit === next.canEdit &&
          previous.canSave === next.canSave &&
          previous.onEdit === next.onEdit &&
          previous.onCancel === next.onCancel &&
          previous.onSave === next.onSave &&
          previous.onDeleteRequest === next.onDeleteRequest &&
          previous.canDelete === next.canDelete &&
          previous.deleteLabel === next.deleteLabel &&
          previous.deleteLoading === next.deleteLoading;

        if (same) {
          return previous;
        }
      }

      if (!previous && !next) {
        return previous;
      }

      return next;
    });
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
