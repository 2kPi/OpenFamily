import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface AddButtonContextType {
  onAddClick: (() => void) | null;
  setAddAction: (action: (() => void) | null) => void;
}

const AddButtonContext = createContext<AddButtonContextType | undefined>(undefined);

export function AddButtonProvider({ children }: { children: ReactNode }) {
  const [onAddClick, setOnAddClick] = useState<(() => void) | null>(null);

  const setAddAction = useCallback((action: (() => void) | null) => {
    if (action === null) {
      setOnAddClick(null);
    } else {
      // Important: envelopper dans une fonction pour éviter que React l'exécute immédiatement
      setOnAddClick(() => action);
    }
  }, []);

  const value = useMemo(() => ({ onAddClick, setAddAction }), [onAddClick, setAddAction]);

  return (
    <AddButtonContext.Provider value={value}>
      {children}
    </AddButtonContext.Provider>
  );
}

export function useAddButton() {
  const context = useContext(AddButtonContext);
  if (context === undefined) {
    throw new Error('useAddButton must be used within an AddButtonProvider');
  }
  return context;
}
