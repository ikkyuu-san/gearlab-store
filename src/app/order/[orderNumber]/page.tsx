import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Icon } from "@/components/site/icon";
import { formatCartPrice } from "@/features/cart/cart-utils";
import { getOrderByNumberAndToken } from "@/server/orders";
import { orderAccessCookieName } from "@/server/order-access";
import { OrderAccessGate } from "../order-access-gate";

export const metadata: Metadata = { title: "Order received | GearLab" };
export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await params;
  const accessToken = (await cookies()).get(orderAccessCookieName(orderNumber))?.value;
  const order = accessToken ? await getOrderByNumberAndToken(orderNumber, accessToken) : null;

  return <><Header /><main id="main-content" className="order-confirmation"><div className="container">{order ? <section className="confirmation-card"><span className="confirmation-mark"><Icon name="check" width={28} height={28} /></span><p className="eyebrow">GearLab / Order received</p><h1>Thanks, {order.customerName}.</h1><p className="confirmation-lead">Your order request is with us. We’ll follow up to confirm availability and delivery details.</p><div className="confirmation-number"><span>Order number</span><strong>{order.orderNumber}</strong></div><dl className="confirmation-delivery"><div><dt>Delivery method</dt><dd>Standard Delivery</dd></div><div><dt>Delivery address</dt><dd>{order.deliveryAddress}</dd></div></dl><div className="confirmation-items">{order.items.map((item) => <div className="checkout-item" key={`${item.productNameSnapshot}-${item.quantity}`}><span>{item.productNameSnapshot} <small>× {item.quantity}</small></span><strong>{formatCartPrice(item.lineTotal)}</strong></div>)}</div><div className="cart-summary-row"><span>Product total (before delivery)</span><strong>{formatCartPrice(order.totalTHB ?? order.subtotal)}</strong></div><p className="cart-summary-note">GearLab will confirm delivery timing and any delivery charge before the order is finalized. No payment has been collected.</p><p className="confirmation-status">Status: <strong>{order.status}</strong></p><p className="confirmation-next">What happens next: GearLab will contact you using the phone number provided to confirm your order and delivery details.</p><Link href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></Link></section> : <OrderAccessGate orderNumber={orderNumber} />}</div></main><Footer /></>;
}
