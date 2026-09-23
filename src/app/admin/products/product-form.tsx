"use client";

import { useActionState, useState } from "react";
import type { Product } from "@prisma/client";
import { removeProductImageAction, type ProductActionState } from "./actions";
import { PRODUCT_CATEGORIES, normalizeProductCategory } from "@/features/products/categories";
import { ProductImage } from "@/features/products/product-image";

type ProductFormAction = (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;

export function ProductForm({ product, action, submitLabel }: { product?: Product; action: ProductFormAction; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [stockStatus, setStockStatus] = useState(product?.stockStatus ?? "PREORDER");
  return (
    <>
      <form className="admin-product-form" action={formAction}>
        <div className="admin-form-grid">
          <label>Name<input name="name" required maxLength={200} defaultValue={product?.name} /></label>
          <label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={product?.slug} /></label>
          <label>Category<select name="category" required defaultValue={product ? normalizeProductCategory(product.category) : "keyboards"}>{PRODUCT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Brand<input name="brand" maxLength={120} defaultValue={product?.brand ?? ""} /></label>
          <label>SKU<input name="sku" maxLength={80} defaultValue={product?.sku ?? ""} autoCapitalize="characters" /></label>
          <label>Price (THB)<input name="priceTHB" type="number" min="0" max="100000000" step="1" required defaultValue={product?.priceTHB ?? 0} /></label>
          <label>Stock status<select name="stockStatus" value={stockStatus} onChange={(event) => setStockStatus(event.target.value as typeof stockStatus)}><option value="PREORDER">Preorder</option><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
          {stockStatus === "IN_STOCK" ? <label>Stock quantity<input name="stockQuantity" type="number" min="0" max="1000000" step="1" required defaultValue={product?.stockQuantity ?? ""} /><small>Total units available for this product, including existing non-cancelled orders.</small></label> : null}
          {stockStatus === "PREORDER" ? <>
            <label>Preorder limit (optional)<input name="preorderLimit" type="number" min="1" max="1000000" step="1" defaultValue={product?.preorderLimit ?? ""} /><small>Leave blank for an uncapped preorder.</small></label>
            <label>Estimated arrival (optional)<input name="preorderEta" type="date" defaultValue={product?.preorderEta?.toISOString().slice(0, 10) ?? ""} /></label>
          </> : null}
          {stockStatus === "OUT_OF_STOCK" ? <p className="admin-form-hint inventory-hint">Out-of-stock products cannot be purchased. Any previous stock or preorder limits will be cleared.</p> : null}
          <label>Product image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Image alt text<input name="imageAlt" maxLength={300} defaultValue={product?.imageAlt ?? ""} /></label>
        </div>
        {product ? <div className="admin-current-image"><span className="admin-image-label">Current product image</span><div className="admin-current-image-preview"><ProductImage src={product.imageUrl} alt={product.imageAlt || `${product.name} product image`} sizes="180px" /></div></div> : null}
        <p className="admin-form-hint">JPEG, PNG, or WebP · up to 4 MiB. Selecting a new file replaces the current image after upload succeeds.</p>
        <label>Description<textarea name="description" required maxLength={5000} rows={6} defaultValue={product?.description} /></label>
        <label className="admin-checkbox"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Feature this product on the storefront</label>
        {state.error ? <p className="admin-error" role="alert">{state.error}{state.productId ? <> <a href={`/admin/products/${state.productId}/edit`}>Open the saved product to retry.</a></> : null}</p> : null}
        <div className="admin-form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</button></div>
      </form>
      {product?.imageUrl ? <RemoveProductImageForm productId={product.id} /> : null}
    </>
  );
}

function RemoveProductImageForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(removeProductImageAction.bind(null, productId), {});
  return <form action={action} className="admin-image-remove-form" onSubmit={(event) => { if (!window.confirm("Remove this product image?")) event.preventDefault(); }}>
    {state.error ? <p className="admin-error" role="alert">{state.error}</p> : null}
    <button className="button button-secondary" type="submit" disabled={pending}>{pending ? "Removing…" : "Remove current image"}</button>
  </form>;
}
