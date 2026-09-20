import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Icon } from "@/components/site/icon";
import { formatCartPrice } from "@/features/cart/cart-utils";
import { getOrderByNumberAndToken } from "@/server/orders";

export const metadata: Metadata = { title: "Order received | GearLab" };
export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params, searchParams }: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  const order = typeof token === "string" && token.length >= 40 ? await getOrderByNumberAndToken(orderNumber, token) : null;
  if (!order) notFound();

  return <><Header /><main id="main-content" className="order-confirmation"><div className="container"><section className="confirmation-card"><span className="confirmation-mark"><Icon name="check" width={28} height={28} /></span><p className="eyebrow">GearLab / Order received</p><h1>Thanks, {order.customerName}.</h1><p className="confirmation-lead">Your preorder request is with us. We’ll follow up with the next details.</p><div className="confirmation-number"><span>Order number</span><strong>{order.orderNumber}</strong></div><div className="confirmation-items">{order.items.map((item) => <div className="checkout-item" key={`${item.productNameSnapshot}-${item.quantity}`}><span>{item.productNameSnapshot} <small>× {item.quantity}</small></span><strong>{formatCartPrice(item.lineTotal)}</strong></div>)}</div><div className="cart-summary-row"><span>Total</span><strong>{formatCartPrice(order.subtotal)}</strong></div><p className="confirmation-status">Status: <strong>{order.status}</strong></p><Link href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></Link></section></div></main><Footer /></>;
}
