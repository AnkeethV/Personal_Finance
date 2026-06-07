import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Store the active month as "YYYY-MM"
  const [activeMonth, setActiveMonth] = useState(() => {
    const stored = sessionStorage.getItem('paisa_active_month');
    if (stored) return stored;
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleSetActiveMonth = (month) => {
    setActiveMonth(month);
    sessionStorage.setItem('paisa_active_month', month);
  };

  return (
    <AppContext.Provider value={{ activeMonth, setActiveMonth: handleSetActiveMonth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
