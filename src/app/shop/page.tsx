import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ProductCatalog, ProductCatalogError } from "@/features/products/product-catalog";
import { getProductCategoryId } from "@/features/products/categories";
import { listProducts } from "@/server/products";
import type { Product } from "@/features/products/product-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop | GearLab",
  description: "Explore GearLab’s gaming gear and tech accessories.",
};

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = getProductCategoryId(typeof params.category === "string" ? params.category : undefined) ?? "all";
  const query = typeof params.q === "string" ? params.q : "";
  let products: Product[] = [];
  let catalogError = false;
  try {
    products = await listProducts();
  } catch {
    products = [];
    catalogError = true;
  }

  return (
    <>
      <Header />
      <main id="main-content">
        <div className="shop-intro container">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Shop</span></nav>
          <p className="eyebrow">Gaming gear & tech accessories</p>
          <h1>Find your next upgrade.</h1>
          <p>A considered selection for your desk, your games, and your everyday.</p>
        </div>
        {catalogError ? <ProductCatalogError /> : <ProductCatalog key={`${category}-${query}`} products={products} shop initialCategory={category} initialQuery={query} />}
      </main>
      <Footer />
    </>
  );
}
