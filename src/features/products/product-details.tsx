import { formatPrice } from "./mock-products";
import type { Product } from "./product-types";
import { ProductImage } from "./product-image";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";

export function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="product-details">
      <div className="detail-image"><ProductImage src={product.image} alt={product.imageAlt} sizes="(max-width: 600px) 90vw, 560px" /></div>
      <p className="eyebrow">{product.categoryLabel}</p>
      <h2>{product.name}</h2>
      <div className="detail-price"><strong>{formatPrice(product.price)}</strong><span className="status-badge">{product.status}</span></div>
      <p>{product.description}</p>
      <p className="product-availability product-detail-availability">{product.availabilityMessage ?? product.status}</p>
      {product.specifications.length > 0 ? <section className="product-specifications" aria-labelledby="product-specifications-heading">
        <p className="eyebrow">Product details</p>
        <h3 id="product-specifications-heading">Specifications</h3>
        <dl>{product.specifications.map((specification) => <div key={specification.name}><dt>{specification.name}</dt><dd>{specification.value}</dd></div>)}</dl>
      </section> : null}
      <AddToCartButton product={product} />
      <p className="sample-note">Demo product with illustrative imagery. Checkout will be added in the next phase.</p>
    </div>
  );
}
