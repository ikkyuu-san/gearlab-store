import { MAX_CART_QUANTITY, type CartItem, type CartProduct } from "./cart-types";
import { formatMMK } from "@/lib/currency";

export function formatCartPrice(price: number) {
  return formatMMK(price);
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function addCartItem(items: CartItem[], product: CartProduct) {
  if (product.status === "Out of Stock" || product.availableQuantity === 0) return items;
  const existing = items.find((item) => item.id === product.id);
  if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(MAX_CART_QUANTITY, item.quantity + 1) } : item);
  return [...items, { id: product.id, name: product.name, price: product.price, image: product.image, imageAlt: product.imageAlt, status: product.status, categoryLabel: product.categoryLabel, quantity: 1 }];
}

export function setCartItemQuantity(items: CartItem[], id: string, quantity: number) {
  const safeQuantity = Math.max(1, Math.min(MAX_CART_QUANTITY, Math.floor(quantity)));
  return items.map((item) => item.id === id ? { ...item, quantity: safeQuantity } : item);
}

export function removeCartItem(items: CartItem[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function readCart(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<CartItem>;
      if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.price !== "number" || typeof candidate.quantity !== "number") return [];
      if (!Number.isFinite(candidate.price) || candidate.price < 0 || !Number.isFinite(candidate.quantity)) return [];
      return [{ ...candidate, quantity: Math.max(1, Math.min(MAX_CART_QUANTITY, Math.floor(candidate.quantity))) } as CartItem];
    });
  } catch {
    return [];
  }
}
