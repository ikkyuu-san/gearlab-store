import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { getAdminOrderById } from "@/server/orders";
import { requireAdmin } from "@/server/admin-auth";
import { formatOrderAmount } from "@/lib/currency";
import { AdminShell } from "../../admin-shell";
import { OrderStatusForm } from "../status-form";
import { OrderPaymentStatusForm } from "../payment-status-form";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const arrivalDate = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const workflow = [
  { status: "PENDING", meaning: "New order waiting for GearLab review and payment confirmation." },
  { status: "CONFIRMED", meaning: "Order and payment confirmed." },
  { status: "PROCESSING", meaning: "GearLab is sourcing or preparing the product." },
  { status: "SHIPPED", meaning: "Sent to the customer." },
  { status: "COMPLETED", meaning: "Order completed." },
  { status: "CANCELLED", meaning: "Order cancelled." },
] satisfies ReadonlyArray<{ status: OrderStatus; meaning: string }>;

type AdminOrderDetailsProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function AdminOrderDetailsPage({ params, searchParams }: AdminOrderDetailsProps) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div><Link className="admin-back-link" href="/admin/orders">← All orders</Link><p className="eyebrow">GearLab / Order</p><h1>{order.orderNumber}</h1><p>Order date: {date.format(order.createdAt)}</p></div>
        <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>{order.status}</span>
      </div>
      {query.notice === "status-updated" ? <p className="admin-feedback" role="status">Order status updated.</p> : null}
      {query.notice === "payment-updated" ? <p className="admin-feedback" role="status">Payment state updated.</p> : null}
      <div className="admin-order-detail-grid">
        <section className="admin-panel admin-order-panel">
          <p className="eyebrow">Customer & delivery</p><h2>{order.customerName}</h2>
          <dl className="admin-order-meta">
            <div><dt>Phone</dt><dd>{order.phone}</dd></div>
            <div><dt>Email</dt><dd>{order.email || "Not provided"}</dd></div>
            <div><dt>Delivery method</dt><dd>{order.deliveryMethod === "STANDARD" ? "Standard Delivery" : "To be confirmed"}</dd></div>
            <div><dt>Delivery address</dt><dd>{order.deliveryAddress}</dd></div>
            {order.note ? <div><dt>Customer note</dt><dd>{order.note}</dd></div> : null}
          </dl>
        </section>
        <section className="admin-panel admin-order-panel">
          <p className="eyebrow">Order workflow</p><h2>Keep the customer request up to date.</h2>
          <p className="admin-order-current-meaning">{workflow.find((step) => step.status === order.status)?.meaning}</p>
          <OrderStatusForm id={order.id} currentStatus={order.status} />
          <details className="admin-workflow-guide">
            <summary>Status guide</summary>
            <dl>{workflow.map((step) => <div key={step.status}><dt>{step.status}</dt><dd>{step.meaning}</dd></div>)}</dl>
          </details>
          <div className="admin-payment-panel">
            <p className="eyebrow">Payment state</p>
            <span className={`admin-status admin-payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
            <OrderPaymentStatusForm id={order.id} currentStatus={order.paymentStatus} />
          </div>
        </section>
      </div>
      <section className="admin-panel admin-order-panel admin-order-items-panel">
        <div className="admin-section-heading"><div><p className="eyebrow">Historical item snapshots</p><h2>Order items</h2></div><strong className="admin-order-total">{formatOrderAmount(order.totalAmount ?? order.subtotal, order.currency)}</strong></div>
        <div className="admin-order-items">
          {order.items.map((item) => (
            <div className="admin-order-item" key={item.id}>
              <div><strong>{item.productNameSnapshot}</strong><small>{formatOrderAmount(item.priceSnapshot, order.currency)} each · quantity {item.quantity}</small>
                {item.product.stockStatus === "PREORDER" ? <small className="admin-preorder-note">Current listing: Preorder{item.product.preorderEta ? ` · estimated arrival ${arrivalDate.format(item.product.preorderEta)}` : " · arrival estimate to be confirmed"}. Confirm timing with the customer.</small> : null}
              </div>
              <strong>{formatOrderAmount(item.lineTotal, order.currency)}</strong>
            </div>
          ))}
        </div>
        <div className="admin-order-summary"><span>Product total before delivery</span><strong>{formatOrderAmount(order.totalAmount ?? order.subtotal, order.currency)}</strong></div>
        <p className="admin-form-hint">Delivery charges and timing are confirmed separately. Item names and prices above are preserved from when the order was placed.</p>
      </section>
    </AdminShell>
  );
}
