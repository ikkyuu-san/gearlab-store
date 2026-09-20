"use client";

import { useActionState } from "react";
import type { Product } from "@prisma/client";
import type { ProductActionState } from "./actions";

type ProductFormAction = (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;

export function ProductForm({ product, action, submitLabel }: { product?: Product; action: ProductFormAction; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form className="admin-product-form" action={formAction}>
      <div className="admin-form-grid">
        <label>Name<input name="name" required maxLength={200} defaultValue={product?.name} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={product?.slug} /></label>
        <label>Category<input name="category" required maxLength={80} defaultValue={product?.category} placeholder="keyboards" /></label>
        <label>Price (THB)<input name="priceTHB" type="number" min="0" max="100000000" step="1" required defaultValue={product?.priceTHB ?? 0} /></label>
        <label>Stock status<select name="stockStatus" defaultValue={product?.stockStatus ?? "PREORDER"}><option value="PREORDER">Preorder</option><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
        <label>Image URL<input name="imageUrl" type="text" defaultValue={product?.imageUrl ?? ""} placeholder="https://… or /images/…" /></label>
      </div>
      <label>Description<textarea name="description" required maxLength={5000} rows={6} defaultValue={product?.description} /></label>
      <label className="admin-checkbox"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Feature this product on the storefront</label>
      {state.error ? <p className="admin-error" role="alert">{state.error}</p> : null}
      <div className="admin-form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</button></div>
    </form>
  );
}
