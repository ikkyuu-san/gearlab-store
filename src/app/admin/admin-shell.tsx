import Link from "next/link";
import { Brand } from "@/components/site/brand";
import { LogoutButton } from "./logout-button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand"><Brand /></div>
        <p className="eyebrow admin-sidebar-label">Control room</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/">View Store</Link>
        </nav>
        <div className="admin-sidebar-footer"><LogoutButton /></div>
      </aside>
      <div className="admin-main">
        <header className="admin-mobile-header"><Brand /><LogoutButton /></header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
