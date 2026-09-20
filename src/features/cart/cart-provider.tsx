"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartProduct, CartItem } from "./cart-types";
import { addCartItem, getCartItemCount, getCartSubtotal, readCart, removeCartItem, setCartItemQuantity } from "./cart-utils";

const CART_STORAGE_KEY = "gearlab-guest-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (product: CartProduct) => boolean;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readCart(window.localStorage.getItem(CART_STORAGE_KEY)));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((product: CartProduct) => {
    if (product.status === "Out of Stock") return false;
    setItems((current) => addCartItem(current, product));
    return true;
  }, []);
  const increase = useCallback((id: string) => setItems((current) => { const item = current.find((entry) => entry.id === id); return item ? setCartItemQuantity(current, id, item.quantity + 1) : current; }), []);
  const decrease = useCallback((id: string) => setItems((current) => { const item = current.find((entry) => entry.id === id); return item && item.quantity > 1 ? setCartItemQuantity(current, id, item.quantity - 1) : current; }), []);
  const remove = useCallback((id: string) => setItems((current) => removeCartItem(current, id)), []);
  const clear = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({ items, itemCount: getCartItemCount(items), subtotal: getCartSubtotal(items), hydrated, addItem, increase, decrease, remove, clear }), [items, hydrated, addItem, increase, decrease, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
