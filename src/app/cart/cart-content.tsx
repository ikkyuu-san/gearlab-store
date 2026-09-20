"use client";

import Link from "next/link";
import { Icon } from "@/components/site/icon";
import { ProductImage } from "@/features/products/product-image";
import { useCart } from "@/features/cart/cart-provider";
import { formatCartPrice } from "@/features/cart/cart-utils";

export function CartContent() {
  const { items, subtotal, hydrated, increase, decrease, remove, clear } = useCart();

  if (!hydrated) return <div className="cart-loading" aria-live="polite">Loading your cart…</div>;
  if (items.length === 0) return <div className="empty-state cart-empty"><Icon name="cart" width={38} height={38} /><h2>Your cart is empty.</h2><p>Save your next setup upgrade here while you browse the GearLab collection.</p><Link href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></Link></div>;

  return <div className="cart-layout">
    <div className="cart-items">
      {items.map((item) => <article className="cart-item" key={item.id}>
        <div className="cart-item-image"><ProductImage src={item.image} alt={item.imageAlt} sizes="120px" /></div>
        <div className="cart-item-info"><p className="eyebrow">{item.categoryLabel}</p><h2>{item.name}</h2><p className="cart-item-price">{formatCartPrice(item.price)}</p><span className={`status-badge${item.status === "In Stock" ? " status-stock" : ""}`}>{item.status}</span></div>
        <div className="cart-item-controls"><div className="quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={() => decrease(item.id)} aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1}>−</button><span aria-live="polite">{item.quantity}</span><button type="button" onClick={() => increase(item.id)} aria-label={`Increase quantity of ${item.name}`}>+</button></div><strong className="cart-line-total">{formatCartPrice(item.price * item.quantity)}</strong><button type="button" className="cart-remove" onClick={() => remove(item.id)}>Remove</button></div>
      </article>)}
      <button type="button" className="text-link cart-clear" onClick={clear}>Clear cart</button>
    </div>
    <aside className="cart-summary"><p className="eyebrow">Order preview</p><h2>Cart summary</h2><div className="cart-summary-row"><span>Subtotal</span><strong>{formatCartPrice(subtotal)}</strong></div><p className="cart-summary-note">Shipping and final availability will be confirmed during checkout.</p><Link href="/checkout" className="button button-primary cart-checkout">Proceed to checkout <Icon name="arrow" /></Link><Link href="/shop" className="button button-secondary cart-checkout">Continue shopping</Link></aside>
  </div>;
}
