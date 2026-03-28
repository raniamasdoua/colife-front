import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { CreateActivityModal } from "../components/CreateActivityModal";

const AUTH_ROUTES = ["/login", "/register"];

type CreateActivityModalContextValue = {
  openCreate: () => void;
  isCreateModalOpen: boolean;
};

const CreateActivityModalContext = createContext<
  CreateActivityModalContextValue | undefined
>(undefined);

export function CreateActivityModalProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (AUTH_ROUTES.includes(location.pathname)) {
      setOpen(false);
    }
  }, [location.pathname]);

  const openCreate = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openCreate, isCreateModalOpen: open }),
    [openCreate, open]
  );

  return (
    <CreateActivityModalContext.Provider value={value}>
      {children}
      {!AUTH_ROUTES.includes(location.pathname) ? (
        <CreateActivityModal open={open} onOpenChange={setOpen} />
      ) : null}
    </CreateActivityModalContext.Provider>
  );
}

export function useCreateActivityModal(): CreateActivityModalContextValue {
  const ctx = useContext(CreateActivityModalContext);
  if (!ctx) {
    throw new Error("useCreateActivityModal must be used within CreateActivityModalProvider");
  }
  return ctx;
}
