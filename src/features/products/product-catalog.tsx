"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@/components/site/dialog";
import { Icon } from "@/components/site/icon";
import { categories, type CategoryId } from "./mock-products";
import type { Product } from "./product-types";
import { ProductCard } from "./product-card";
import { ProductDetails } from "./product-details";

export function ProductCatalog({ products, shop = false, initialCategory = "all", initialQuery = "" }: {
  shop?: boolean;
  initialCategory?: CategoryId | "all";
  initialQuery?: string;
  products: Product[];
}) {
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Product | null>(null);
  const filteredProducts = products.filter((product) =>
    (category === "all" || product.category === category) &&
    `${product.name} ${product.categoryLabel}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section id="featured" className={`section container${shop ? " shop-catalog" : ""}`} aria-label={shop ? "Shop products" : "Featured products"}>
      {!shop && <div className="section-heading">
        <div><p className="eyebrow">The GearLab selection</p><h2>Featured gear.</h2></div>
        <Link href="/shop" className="text-link">View all products <Icon name="arrow" /></Link>
      </div>}
      {shop && <label className="catalog-search"><Icon name="search" /><span className="sr-only">Search products</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search gaming gear & accessories" /></label>}
      <div className="catalog-toolbar">
        <div className="filter-list" aria-label="Filter products by category">
          <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>All gear</button>
          {categories.map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.name.replace("Gaming ", "")}</button>)}
        </div>
        <span className="catalog-count" role="status">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</span>
      </div>
      <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onView={() => setSelected(product)} />)}</div>
      {filteredProducts.length === 0 && <div className="empty-state"><Icon name="search" width={32} height={32} /><h2>No gear found.</h2><p>Try another search or browse all categories.</p><button className="button button-secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Show all gear <Icon name="arrow" /></button></div>}
      <p className="sample-note">Catalog preview · Products, imagery, prices, and stock statuses are illustrative examples.</p>
      <Dialog open={selected !== null} onClose={() => setSelected(null)} title="Product preview">{selected && <ProductDetails product={selected} />}</Dialog>
    </section>
  );
}

export function ProductCatalogError() {
  return <div className="catalog-error"><Icon name="box" width={30} height={30} /><h2>GearLab catalog is temporarily unavailable.</h2><p>We couldn’t load the product catalog right now. Please try again shortly.</p></div>;
}
