import { Icon } from "@/components/site/icon";
import { formatPrice } from "./mock-products";
import type { Product } from "./product-types";
import { ProductImage } from "./product-image";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";

export function ProductCard({ product, onView }: { product: Product; onView: () => void }) {
  return (
    <article className="product-card">
      <button type="button" className="product-image" onClick={onView} aria-label={`View ${product.name}`}>
        <ProductImage src={product.image} alt={product.imageAlt} />
        <span className={`status-badge${product.status === "In Stock" ? " status-stock" : ""}`}>{product.status}</span>
        <span className="demo-label">Demo</span>
      </button>
      <div className="product-info">
        <p className="eyebrow">{product.categoryLabel}</p>
        <h3>{product.name}</h3>
        <p className="product-price">{formatPrice(product.price)}</p>
        <p className="product-availability" aria-live="polite">{product.availabilityMessage ?? product.status}</p>
        <button type="button" className="product-action" onClick={onView} aria-label={`View Product: ${product.name}`}>View Product <Icon name="arrow" /></button>
        <AddToCartButton product={product} compact />
      </div>
    </article>
  );
}
