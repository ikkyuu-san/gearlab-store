"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { ProductServiceError } from "@/server/product-errors";
import { createProduct, deleteProduct, updateProduct } from "@/server/products";

export type ProductActionState = { error?: string };

function inputFromForm(formData: FormData) {
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    priceTHB: Number(formData.get("priceTHB") ?? 0),
    imageUrl: imageUrl || null,
    stockStatus: String(formData.get("stockStatus") ?? "PREORDER"),
    featured: formData.get("featured") === "on",
  };
}

function actionError(error: unknown) {
  if (error instanceof ProductServiceError) return error.message;
  return "Something went wrong. Please try again.";
}

export async function createProductAction(_: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  try { await createProduct(inputFromForm(formData)); } catch (error) { return { error: actionError(error) }; }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=created");
}

export async function updateProductAction(id: string, _: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  try { await updateProduct(id, inputFromForm(formData)); } catch (error) { return { error: actionError(error) }; }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=updated");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  try { await deleteProduct(id); } catch (error) { redirect(`/admin/products?error=${encodeURIComponent(actionError(error))}`); }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=deleted");
}
