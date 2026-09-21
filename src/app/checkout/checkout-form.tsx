"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/site/icon";
import { useCart } from "@/features/cart/cart-provider";
import { formatCartPrice } from "@/features/cart/cart-utils";
import { createGuestOrderAction } from "./actions";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, hydrated, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [checkoutToken, setCheckoutToken] = useState("");

  if (!hydrated) return <div className="cart-loading" aria-live="polite">Loading your checkout…</div>;
  if (items.length === 0) return <div className="empty-state cart-empty"><Icon name="cart" width={38} height={38} /><h2>Your cart is empty.</h2><p>Add some gear before starting checkout.</p><a href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></a></div>;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || items.length === 0) return;
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const token = checkoutToken || crypto.randomUUID();
    if (!checkoutToken) setCheckoutToken(token);
    const result = await createGuestOrderAction({
      checkoutToken: token,
      customerName: String(formData.get("customerName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
      note: String(formData.get("note") ?? ""),
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    });
    if (!("orderNumber" in result)) {
      setError(result.error ?? "We could not complete the order. Please try again.");
      setPending(false);
      return;
    }
    clear();
    router.push(`/order/${encodeURIComponent(result.orderNumber)}`);
  }

  return <form className="checkout-layout" onSubmit={handleSubmit}>
    <div className="checkout-fields">
      <div className="checkout-section-heading"><p className="eyebrow">Your details</p><h2>Where should we reach you?</h2><p>We’ll use these details to confirm your preorder and delivery.</p></div>
      <label>Full name<input name="customerName" required minLength={2} maxLength={120} autoComplete="name" /></label>
      <label>Phone number<input name="phone" required pattern="[0-9+()\-\s]{5,30}" maxLength={30} autoComplete="tel" /></label>
      <label>Email <span>(optional)</span><input name="email" type="email" maxLength={254} autoComplete="email" /></label>
      <label>Delivery address<textarea name="deliveryAddress" required minLength={5} maxLength={1000} rows={4} autoComplete="street-address" /></label>
      <label>Order note <span>(optional)</span><textarea name="note" maxLength={2000} rows={3} placeholder="Anything we should know?" /></label>
      {error ? <p className="admin-error checkout-error" role="alert">{error}</p> : null}
      <button className="button button-primary checkout-submit" type="submit" disabled={pending}>{pending ? "Creating order…" : "Place preorder"} {!pending && <Icon name="arrow" />}</button>
      <p className="checkout-security-note">No payment is collected yet. Your order request will be confirmed separately.</p>
    </div>
    <aside className="cart-summary checkout-summary"><p className="eyebrow">Order preview</p><h2>Your selection</h2><div className="checkout-items">{items.map((item) => <div className="checkout-item" key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><strong>{formatCartPrice(item.price * item.quantity)}</strong></div>)}</div><div className="cart-summary-row"><span>Subtotal</span><strong>{formatCartPrice(subtotal)}</strong></div><p className="cart-summary-note">Final prices are verified against the GearLab database when you submit.</p></aside>
  </form>;
}
