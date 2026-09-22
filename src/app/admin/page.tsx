import Link from "next/link";
import { redirect } from "next/navigation";
import { getProductOverview } from "@/server/products";
import { getOrderStatistics } from "@/server/orders";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "./admin-shell";

export default async function AdminPage() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const [overview, orders] = await Promise.all([getProductOverview(), getOrderStatistics()]);

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><p className="eyebrow">GearLab / Admin</p><h1>Dashboard</h1><p>Keep the catalog focused, current, and ready for customers.</p></div><Link className="button button-primary" href="/admin/products/new">Add product</Link></div>
      <section className="admin-stat-grid" aria-label="Product overview">
        <div className="admin-stat"><span>Total products</span><strong>{overview.total}</strong></div>
        <div className="admin-stat"><span>Active products</span><strong>{overview.active}</strong><small>Visible in the storefront</small></div>
        <div className="admin-stat"><span>Out of stock</span><strong>{overview.outOfStock}</strong></div>
      </section>
      <section className="admin-order-overview" aria-label="Order overview">
        <div className="admin-section-heading"><div><p className="eyebrow">Order flow</p><h2>Orders</h2></div><Link className="button button-secondary" href="/admin/orders">Manage orders</Link></div>
        <div className="admin-stat-grid admin-order-stat-grid">
          <div className="admin-stat"><span>Total orders</span><strong>{orders.total}</strong></div>
          <div className="admin-stat"><span>Pending</span><strong>{orders.pending}</strong></div>
          <div className="admin-stat"><span>Confirmed</span><strong>{orders.confirmed}</strong></div>
          <div className="admin-stat"><span>Processing</span><strong>{orders.processing}</strong></div>
          <div className="admin-stat"><span>Completed</span><strong>{orders.completed}</strong></div>
          <div className="admin-stat"><span>Cancelled</span><strong>{orders.cancelled}</strong></div>
        </div>
      </section>
      <section className="admin-panel admin-dashboard-panel"><div><p className="eyebrow">Catalog management</p><h2>Products</h2><p>Review pricing, availability, and storefront visibility from one place.</p></div><Link className="button button-secondary" href="/admin/products">Manage products</Link></section>
    </AdminShell>
  );
}
