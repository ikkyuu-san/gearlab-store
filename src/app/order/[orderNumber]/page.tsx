import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Icon } from "@/components/site/icon";
import { formatCartPrice } from "@/features/cart/cart-utils";
import { getOrderByNumberAndToken } from "@/server/orders";
import { orderAccessCookieName } from "@/server/order-access";
import { OrderAccessGate } from "../order-access-gate";
import { RefreshOrderStatus } from "../tracking-refresh";

export const metadata: Metadata = { title: "Order tracking | GearLab" };
export const dynamic = "force-dynamic";

const statusDescriptions: Record<OrderStatus, string> = {
  PENDING: "Received — GearLab is reviewing your order and will confirm availability and delivery details.",
  CONFIRMED: "Confirmed — GearLab has accepted your order and will coordinate the next steps with you.",
  PROCESSING: "Processing — your order is being prepared.",
  SHIPPED: "Shipped — your order is on its way.",
  COMPLETED: "Completed — GearLab has marked this order complete.",
  CANCELLED: "Cancelled — this order will not be fulfilled. Contact GearLab if you need help.",
};

const arrivalDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const updateDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Yangon",
});

export default async function OrderConfirmationPage({ params }: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await params;
  const accessToken = (await cookies()).get(orderAccessCookieName(orderNumber))?.value;
  const order = accessToken ? await getOrderByNumberAndToken(orderNumber, accessToken) : null;

  return (
    <>
      <Header />
      <main id="main-content" className="order-confirmation">
        <div className="container">
          {order ? (
            <section className="confirmation-card tracking-card">
              <span className="confirmation-mark"><Icon name={order.status === "CANCELLED" ? "box" : "check"} width={28} height={28} /></span>
              <p className="eyebrow">GearLab / Order tracking</p>
              <h1>Your order</h1>
              <p className="confirmation-lead">Check your order progress and the delivery details GearLab has on file.</p>

              <div className="confirmation-number"><span>Order number</span><strong>{order.orderNumber}</strong></div>

              <section className="tracking-status" aria-labelledby="tracking-status-heading">
                <div className="tracking-status-heading">
                  <div><p className="eyebrow">Current status</p><h2 id="tracking-status-heading">{order.status}</h2></div>
                  <RefreshOrderStatus />
                </div>
                <p>{statusDescriptions[order.status]}</p>
                <small>Last updated {updateDate.format(order.updatedAt)}</small>
              </section>

              <dl className="confirmation-delivery">
                <div><dt>Delivery method</dt><dd>{order.deliveryMethod === "STANDARD" ? "Standard Delivery" : "Delivery details to be confirmed"}</dd></div>
                <div><dt>Delivery address</dt><dd>{order.deliveryAddress}</dd></div>
              </dl>

              <div className="tracking-items">
                <div className="tracking-items-heading"><div><p className="eyebrow">Order summary</p><h2>Items</h2></div></div>
                <div className="confirmation-items">
                  {order.items.map((item) => (
                    <div className="tracking-item" key={`${item.productNameSnapshot}-${item.quantity}`}>
                      <div className="tracking-item-copy">
                        <strong>{item.productNameSnapshot}</strong>
                        <small>{formatCartPrice(item.priceSnapshot)} each · quantity {item.quantity}</small>
                        {item.product.stockStatus === "PREORDER" ? (
                          <span className="tracking-preorder-note">
                            Current listing: Preorder{item.product.preorderEta ? ` · estimated arrival ${arrivalDate.format(item.product.preorderEta)}` : " · arrival estimate to be confirmed"}. GearLab will confirm timing for your order.
                          </span>
                        ) : null}
                      </div>
                      <strong className="tracking-item-total">{formatCartPrice(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cart-summary-row"><span>Product total before delivery</span><strong>{formatCartPrice(order.totalTHB ?? order.subtotal)}</strong></div>
              <p className="cart-summary-note">Delivery timing and any delivery charge are confirmed separately. No payment has been collected through this page.</p>
              <p className="confirmation-next">GearLab will contact you using the details provided if we need to confirm anything about your order.</p>
              <Link href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></Link>
            </section>
          ) : <OrderAccessGate orderNumber={orderNumber} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
