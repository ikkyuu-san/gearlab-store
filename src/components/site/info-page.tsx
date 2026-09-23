import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="info-page">
        <article className="container info-page-content">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="info-page-intro">{intro}</p>
          <div className="info-page-sections">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}
