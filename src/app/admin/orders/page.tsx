import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminOrders } from "@/server/orders";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "../admin-shell";
import { formatOrderAmount } from "@/lib/currency";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

type AdminOrdersPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const selectedStatus = statuses.find((value) => value === status) ?? "ALL";
  const orders = await getAdminOrders({ query, status: selectedStatus });
  const hasFilters = Boolean(query || selectedStatus !== "ALL");

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><p className="eyebrow">GearLab / Admin</p><h1>Orders</h1><p>Review customer requests and keep each order moving.</p></div></div>
      <form className="admin-order-filters" action="/admin/orders" method="get">
        <label htmlFor="order-search">Search orders<input id="order-search" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Order number, customer name or phone" /></label>
        <label htmlFor="order-status-filter">Order status<select id="order-status-filter" name="status" defaultValue={selectedStatus}>
          <option value="ALL">All statuses</option>
          {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select></label>
        <div className="admin-order-filter-actions"><button className="button button-primary" type="submit">Apply filters</button>{hasFilters ? <Link className="admin-table-action" href="/admin/orders">Clear</Link> : null}</div>
      </form>
      <p className="admin-order-result-count">{orders.length} {orders.length === 1 ? "order" : "orders"}{hasFilters ? " match these filters" : " total"}</p>
      {orders.length === 0 ? <section className="admin-panel admin-empty"><h2>{hasFilters ? "No matching orders" : "No orders yet"}</h2><p>{hasFilters ? "Try another search or clear the filters." : "Orders created through checkout will appear here."}</p></section> : <div className="admin-table-wrap">
        <table className="admin-table admin-order-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Product total</th><th>Status</th><th>Payment</th><th>Order date</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}>
            <td><strong>{order.orderNumber}</strong></td>
            <td><strong>{order.customerName}</strong></td>
            <td>{order.phone}</td>
            <td>{formatOrderAmount(order.totalAmount ?? order.subtotal, order.currency)}</td>
            <td><span className={`admin-status admin-status-${order.status.toLowerCase()}`}>{order.status}</span></td>
            <td><span className={`admin-status admin-payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span></td>
            <td>{date.format(order.createdAt)}</td>
            <td><Link className="admin-table-action" href={`/admin/orders/${order.id}`}>View details</Link></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </AdminShell>
  );
}
