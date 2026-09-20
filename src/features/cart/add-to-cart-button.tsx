"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/site/icon";
import type { Product } from "@/features/products/product-types";
import { useCart } from "./cart-provider";

export function AddToCartButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = product.status === "Out of Stock";

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [added]);

  function handleAdd() {
    if (addItem(product)) setAdded(true);
  }

  return <button type="button" className={compact ? "product-action cart-add-action" : "button button-primary cart-add-button"} onClick={handleAdd} disabled={unavailable} aria-label={unavailable ? `${product.name} is out of stock` : `Add ${product.name} to cart`}><span>{unavailable ? "Out of stock" : added ? "Added to cart" : "Add to cart"}</span>{!unavailable && <Icon name={added ? "check" : "cart"} />}</button>;
}
