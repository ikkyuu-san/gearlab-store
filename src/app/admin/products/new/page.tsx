import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { AdminShell } from "../../admin-shell";
import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  return <AdminShell><div className="admin-page-heading"><div><p className="eyebrow">GearLab / Catalog</p><h1>New product</h1><p>Add a product to the GearLab catalog.</p></div></div><div className="admin-panel"><ProductForm action={createProductAction} submitLabel="Create product" /></div></AdminShell>;
}
