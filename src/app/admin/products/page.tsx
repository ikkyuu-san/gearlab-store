import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "../admin-shell";
import { listAdminProducts } from "@/server/products";
import { DeleteProductButton } from "./delete-button";
import { ArchiveProductButton } from "./archive-button";
import { getProductCategoryLabel } from "@/features/products/categories";

const statusLabels = { PREORDER: "Preorder", IN_STOCK: "In stock", OUT_OF_STOCK: "Out of stock" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const products = await listAdminProducts();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><p className="eyebrow">GearLab / Catalog</p><h1>Products</h1><p>{products.length} product{products.length === 1 ? "" : "s"} in the catalog.</p></div><Link className="button button-primary" href="/admin/products/new">Add product</Link></div>
      {status ? <p className="admin-feedback" role="status">Product {status} successfully.</p> : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {products.length === 0 ? <div className="admin-panel admin-empty"><h2>No products yet.</h2><p>Create the first product to start building the catalog.</p><Link className="button button-secondary" href="/admin/products/new">Create product</Link></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Brand / SKU</th><th>Price</th><th>Stock</th><th>Visibility</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.slug}</small></td><td>{getProductCategoryLabel(product.category)}</td><td>{product.brand || "—"}<small>{product.sku || "No SKU"}</small></td><td>{product.priceTHB.toLocaleString()} THB</td><td><span className={`admin-status admin-status-${product.stockStatus.toLowerCase()}`}>{statusLabels[product.stockStatus]}</span></td><td>{product.active ? "Active" : "Archived"}</td><td><div className="admin-table-actions"><Link className="admin-table-action" href={`/admin/products/${product.id}/edit`}>Edit</Link><ArchiveProductButton id={product.id} active={product.active} /><DeleteProductButton id={product.id} name={product.name} /></div></td></tr>)}</tbody></table></div>}
    </AdminShell>
  );
}
