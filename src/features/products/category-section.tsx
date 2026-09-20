import Link from "next/link";
import { Icon } from "@/components/site/icon";
import { categories } from "./mock-products";
import { ProductImage } from "./product-image";

export function CategorySection() {
  return (
    <section id="categories" className="section categories-section" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-heading"><div><p className="eyebrow">Find your next upgrade</p><h2 id="categories-title">Shop by category.</h2></div><p>For every part of your setup.</p></div>
        <div className="category-grid">
          {categories.map((item) => <Link key={item.id} href={`/shop?category=${item.id}`} className="category-card">
            <div className="category-image"><ProductImage src={item.image} alt="" sizes="(max-width: 559px) 42vw, (max-width: 1023px) 44vw, 23vw" /></div>
            <div className="category-info"><h3>{item.name}</h3><p>{item.caption}</p><Icon name="diagonal" /></div>
          </Link>)}
        </div>
      </div>
    </section>
  );
}
