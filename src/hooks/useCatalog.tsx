import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CatalogPayload, Specimen } from "../app/types";
import { publicUrl } from "../app/urls";

interface CatalogState {
  items: Specimen[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(publicUrl("specimens.json"), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as CatalogPayload | Specimen[];
      })
      .then((payload) => {
        const next = Array.isArray(payload) ? payload : payload.items;
        if (!Array.isArray(next)) throw new Error("目录缺少 items 数组");
        setItems(next);
      })
      .catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError") setError(`展品目录加载失败：${String((reason as Error).message || reason)}`);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const value = useMemo<CatalogState>(() => ({
    items,
    categories: [...new Set(items.map((item) => item.category))].sort(),
    loading,
    error,
  }), [items, loading, error]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
