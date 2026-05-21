import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AdminSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
};

const AdminSearchContext = createContext<AdminSearchContextValue | undefined>(undefined);

export const AdminSearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState("");

  const value = useMemo(
    () => ({ query, setQuery, clearQuery: () => setQuery("") }),
    [query]
  );

  return <AdminSearchContext.Provider value={value}>{children}</AdminSearchContext.Provider>;
};

export const useAdminSearch = () => {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error("useAdminSearch must be used within an AdminSearchProvider");
  }
  return context;
};
