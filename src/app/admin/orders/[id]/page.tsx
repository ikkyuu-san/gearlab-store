import { notFound, redirect } from "next/navigation";
import { getAdminOrderById } from "@/server/orders";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "../../admin-shell";
import { OrderStatusForm } from "../status-form";
import Link from "next/link";

const money = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><Link className="admin-back-link" href="/admin/orders">← All orders</Link><p className="eyebrow">GearLab / Order</p><h1>{order.orderNumber}</h1><p>Created {date.format(order.createdAt)}</p></div><span className={`admin-status admin-status-${order.status.toLowerCase()}`}>{order.status}</span></div>
      <div className="admin-order-detail-grid">
        <section className="admin-panel admin-order-panel"><p className="eyebrow">Customer</p><h2>{order.customerName}</h2><dl className="admin-order-meta"><div><dt>Email</dt><dd>{order.email || "Not provided"}</dd></div><div><dt>Phone</dt><dd>{order.phone}</dd></div><div><dt>Delivery address</dt><dd>{order.deliveryAddress}</dd></div>{order.note ? <div><dt>Customer note</dt><dd>{order.note}</dd></div> : null}</dl></section>
        <section className="admin-panel admin-order-panel"><p className="eyebrow">Order status</p><h2>Keep the customer request up to date.</h2><OrderStatusForm id={order.id} currentStatus={order.status} /></section>
      </div>
      <section className="admin-panel admin-order-panel admin-order-items-panel"><div className="admin-section-heading"><div><p className="eyebrow">Snapshot items</p><h2>Order items</h2></div><strong className="admin-order-total">{money.format(order.subtotal)} THB</strong></div><div className="admin-order-items">
        {order.items.map((item) => <div className="admin-order-item" key={item.id}><div><strong>{item.productNameSnapshot}</strong><small>{money.format(item.priceSnapshot)} THB each · quantity {item.quantity}</small></div><strong>{money.format(item.lineTotal)} THB</strong></div>)}
      </div><div className="admin-order-summary"><span>Subtotal / total</span><strong>{money.format(order.subtotal)} THB</strong></div></section>
    </AdminShell>
  );
}
