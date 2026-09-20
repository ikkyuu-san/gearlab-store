import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { getAdminProductById } from "@/server/products";
import { AdminShell } from "../../../admin-shell";
import { updateProductAction } from "../../actions";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) notFound();
  return <AdminShell><div className="admin-page-heading"><div><p className="eyebrow">GearLab / Catalog</p><h1>Edit product</h1><p>Update the details shown on the storefront.</p></div></div><div className="admin-panel"><ProductForm product={product} action={updateProductAction.bind(null, id)} submitLabel="Save changes" /></div></AdminShell>;
}
