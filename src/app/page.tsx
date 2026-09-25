import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Icon } from "@/components/site/icon";
import { CategorySection } from "@/features/products/category-section";
import { ProductCatalog } from "@/features/products/product-catalog";
import { ProductCatalogError } from "@/features/products/product-catalog";
import { listProducts } from "@/server/products";
import type { Product } from "@/features/products/product-types";

export const dynamic = "force-dynamic";

const principles = [
  { icon: "check", title: "Selected with purpose", copy: "A focused collection of gaming gear and tech essentials, with attention to the details." },
  { icon: "box", title: "Thailand to Myanmar", copy: "Bringing more possibilities to your setup through thoughtfully sourced preorders." },
  { icon: "headset", title: "People who get your gear", copy: "A store built around the things we love: good tech, great games, and better everyday setups." },
] as const;

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  let products: Product[] = [];
  let catalogError = false;
  try {
    products = await listProducts({ featuredOnly: true });
  } catch {
    products = [];
    catalogError = true;
  }

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span className="small-rule" />GearLab / Gaming & electronics</p>
              <h1 id="hero-title">Gaming Gear &<br /><span>Tech Accessories.</span></h1>
              <p className="hero-description">Carefully selected gaming and tech gear, available through preorder from Thailand.</p>
              <div className="hero-actions"><Link href="/shop" className="button button-primary">Shop Now <Icon name="arrow" /></Link><a href="#categories" className="button button-secondary">Explore Gear</a></div>
              <p className="hero-route"><Icon name="box" width={17} height={17} />Thailand <span aria-hidden="true">→</span> Myanmar<span className="route-divider" />Selected for your setup.</p>
            </div>
            <figure className="hero-visual">
              <div className="hero-image"><Image src="/images/demo-setup.png" alt="Setup with a charcoal keyboard, black mouse, and over-ear headphones" width={1536} height={1024} sizes="(max-width: 899px) 100vw, 55vw" preload /><span className="hero-image-label">THE EVERYDAY SETUP</span></div>
              <figcaption><span>Good gear. Considered details.</span><span>Gear for your everyday setup</span></figcaption>
            </figure>
          </div>
        </section>
        <div className="brand-strip"><div className="container"><span><Icon name="check" />Thoughtfully selected gear</span><span><Icon name="box" />Thailand → Myanmar</span><span><Icon name="headset" />For work. For play. For you.</span></div></div>
        {catalogError ? <ProductCatalogError /> : <ProductCatalog products={products} />}
        <CategorySection />
        <section id="preorder" className="section container" aria-labelledby="preorder-title">
          <div className="preorder-panel">
            <div className="preorder-copy"><p className="eyebrow">Closer to the gear you want</p><h2 id="preorder-title">Thailand <span aria-hidden="true">→</span> Myanmar.</h2><p>Your next setup starts here. Discover gaming and tech accessories sourced from Thailand, with preorder details confirmed before you commit.</p><a href="#preorder-steps" className="text-link">How it works <Icon name="arrow" /></a></div>
            <ol id="preorder-steps" className="preorder-steps">
              <li><span>01</span><div><h3>Find your gear</h3><p>Explore the collection and choose your next upgrade.</p></div></li>
              <li><span>02</span><div><h3>Confirm the details</h3><p>Check availability, the final price, and estimated timing.</p></div></li>
              <li><span>03</span><div><h3>From Thailand to your setup</h3><p>Delivery details will be shared when preorders open.</p></div></li>
            </ol>
          </div>
        </section>
        <section id="about" className="section container why-section" aria-labelledby="why-title">
          <div className="section-heading"><div><p className="eyebrow">The people behind the gear</p><h2 id="why-title">Why GearLab?</h2></div><p>Good gear deserves a simpler way to find it.</p></div>
          <div className="principles-grid">{principles.map((principle) => <div className="principle" key={principle.title}><span className="principle-icon"><Icon name={principle.icon} width={24} height={24} /></span><h3>{principle.title}</h3><p>{principle.copy}</p></div>)}</div>
        </section>
        <section className="browse-section"><div className="container browse-inner"><div><p className="eyebrow">Make it your setup</p><h2>Your next upgrade is waiting.</h2><p>Find the gear that fits the way you play, work, and create.</p></div><Link href="/shop" className="button button-primary">Browse Shop <Icon name="arrow" /></Link></div></section>
      </main>
      <Footer />
    </>
  );
}
