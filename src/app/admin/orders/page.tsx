import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminOrders } from "@/server/orders";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "../admin-shell";

const money = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const orders = await getAdminOrders();

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><p className="eyebrow">GearLab / Admin</p><h1>Orders</h1><p>Review customer requests and keep each order moving.</p></div></div>
      {(await searchParams).status === "updated" ? <p className="admin-feedback" role="status">Order status updated successfully.</p> : null}
      {orders.length === 0 ? <section className="admin-panel admin-empty"><h2>No orders yet</h2><p>Orders created through checkout will appear here.</p></section> : <div className="admin-table-wrap">
        <table className="admin-table admin-order-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Contact</th><th>Total</th><th>Status</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}>
            <td><strong>{order.orderNumber}</strong><small>{order.id.slice(0, 8)}…</small></td>
            <td><strong>{order.customerName}</strong></td>
            <td><strong>{order.email || "—"}</strong><small>{order.phone}</small></td>
            <td>{money.format(order.subtotal)} THB</td>
            <td><span className={`admin-status admin-status-${order.status.toLowerCase()}`}>{order.status}</span></td>
            <td>{date.format(order.createdAt)}</td>
            <td><Link className="admin-table-action" href={`/admin/orders/${order.id}`}>View details</Link></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </AdminShell>
  );
}
