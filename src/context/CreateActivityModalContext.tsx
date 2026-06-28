import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CreateActivityModal } from "../components/CreateActivityModal";

type CreateActivityModalContextValue = {
  openCreate: () => void;
  isCreateModalOpen: boolean;
};

const CreateActivityModalContext = createContext<
  CreateActivityModalContextValue | undefined
>(undefined);

export function CreateActivityModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

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
      <CreateActivityModal open={open} onOpenChange={setOpen} />
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
