"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { ProductServiceError } from "@/server/product-errors";
import { archiveProduct, createProduct, deleteProduct, unarchiveProduct, updateProduct } from "@/server/products";
import { ProductImageError, removeProductImage, replaceProductImage, validateProductImage } from "@/server/product-images";

export type ProductActionState = { error?: string; productId?: string };

function inputFromForm(formData: FormData) {
  const optionalQuantity = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    return value ? Number(value) : null;
  };
  const specificationNames = formData.getAll("specificationName");
  const specificationValues = formData.getAll("specificationValue");
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    priceMMK: Number(formData.get("priceMMK") ?? 0),
    imageAlt: String(formData.get("imageAlt") ?? ""),
    stockStatus: String(formData.get("stockStatus") ?? "PREORDER"),
    stockQuantity: optionalQuantity("stockQuantity"),
    preorderLimit: optionalQuantity("preorderLimit"),
    preorderEta: String(formData.get("preorderEta") ?? ""),
    featured: formData.get("featured") === "on",
    specifications: specificationNames.map((name, index) => ({
      name: typeof name === "string" ? name : "",
      value: typeof specificationValues[index] === "string" ? specificationValues[index] : "",
    })),
  };
}

function actionError(error: unknown) {
  if (error instanceof ProductServiceError) return error.message;
  if (error instanceof ProductImageError) return error.message;
  return "Something went wrong. Please try again.";
}

function imageFileFromForm(formData: FormData) {
  const value = formData.get("image");
  if (value === null || typeof value === "string" || value.size === 0) return null;
  return value;
}

export async function createProductAction(_: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const image = imageFileFromForm(formData);
  if (image) {
    try { await validateProductImage(image); } catch (error) { return { error: actionError(error) }; }
  }
  let product;
  try { product = await createProduct(inputFromForm(formData)); } catch (error) { return { error: actionError(error) }; }
  if (image) {
    try { await replaceProductImage(product.id, image, String(formData.get("imageAlt") ?? "").trim() || null); }
    catch (error) {
      revalidatePath("/admin/products");
      return { error: `Product created, but its image was not uploaded: ${actionError(error)}`, productId: product.id };
    }
  }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=created");
}

export async function updateProductAction(id: string, _: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const image = imageFileFromForm(formData);
  if (image) {
    try { await validateProductImage(image); } catch (error) { return { error: actionError(error) }; }
  }
  try { await updateProduct(id, inputFromForm(formData)); } catch (error) { return { error: actionError(error) }; }
  if (image) {
    try { await replaceProductImage(id, image, String(formData.get("imageAlt") ?? "").trim() || null); }
    catch (error) { return { error: actionError(error) }; }
  }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=updated");
}

export async function removeProductImageAction(id: string, _: ProductActionState, _formData: FormData): Promise<ProductActionState> {
  void _;
  void _formData;
  await requireAdmin();
  try { await removeProductImage(id); } catch (error) { return { error: actionError(error) }; }
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  return {};
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  try { await deleteProduct(id); } catch (error) { redirect(`/admin/products?error=${encodeURIComponent(actionError(error))}`); }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/");
  redirect("/admin/products?status=deleted");
}

export async function archiveProductAction(id: string) {
  await requireAdmin();
  try { await archiveProduct(id); } catch (error) { redirect(`/admin/products?error=${encodeURIComponent(actionError(error))}`); }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/"); revalidatePath("/shop");
  redirect("/admin/products?status=archived");
}

export async function unarchiveProductAction(id: string) {
  await requireAdmin();
  try { await unarchiveProduct(id); } catch (error) { redirect(`/admin/products?error=${encodeURIComponent(actionError(error))}`); }
  revalidatePath("/admin"); revalidatePath("/admin/products"); revalidatePath("/"); revalidatePath("/shop");
  redirect("/admin/products?status=unarchived");
}
