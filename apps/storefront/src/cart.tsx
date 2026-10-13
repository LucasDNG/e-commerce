import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalCents: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const KEY = 'vitrina.cart';
const CartContext = createContext<CartContextValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.productId === 'string' && item.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents: items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
      add(item, quantity) {
        setItems((current) => {
          const found = current.find((entry) => entry.productId === item.productId);
          const nextQuantity = Math.min(item.stock, (found?.quantity ?? 0) + quantity);
          if (nextQuantity <= 0) return current;
          if (!found) return [...current, { ...item, quantity: nextQuantity }];
          return current.map((entry) =>
            entry.productId === item.productId ? { ...item, quantity: nextQuantity } : entry,
          );
        });
      },
      setQuantity(productId, quantity) {
        setItems((current) =>
          current.flatMap((entry) => {
            if (entry.productId !== productId) return [entry];
            if (quantity <= 0) return [];
            return [{ ...entry, quantity: Math.min(entry.stock, quantity) }];
          }),
        );
      },
      remove(productId) {
        setItems((current) => current.filter((entry) => entry.productId !== productId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart fuera del provider');
  return value;
}
