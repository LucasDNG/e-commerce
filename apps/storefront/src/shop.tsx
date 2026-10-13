import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Catalog } from './api';

type ShopContextValue = {
  catalog: Catalog | null;
  loading: boolean;
  error: string | null;
};

const ShopContext = createContext<ShopContextValue>({ catalog: null, loading: true, error: null });

export function ShopProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Catalog>('/api/catalog')
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        document.title = data.shop.storeName;
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar la tienda');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return <ShopContext.Provider value={{ catalog, loading, error }}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  return useContext(ShopContext);
}
