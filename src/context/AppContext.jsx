import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Store the active month as "YYYY-MM"
  const [activeMonth, setActiveMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <AppContext.Provider value={{ activeMonth, setActiveMonth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
