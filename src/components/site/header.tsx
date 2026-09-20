"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Brand } from "./brand";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
import { useCart } from "@/features/cart/cart-provider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#about" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"search" | null>(null);
  const { itemCount } = useCart();
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="announcement"><span>Gaming gear & tech accessories</span><span className="announcement-route">Thailand <span aria-hidden="true">→</span> Myanmar</span></div>
      <header className="site-header" onKeyDown={(event) => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } }}>
        <div className="container header-inner">
          <Link href="/" className="brand-link" aria-label="GearLab home" onClick={() => setMenuOpen(false)}><Brand /></Link>
          <nav className={`primary-nav${menuOpen ? " is-open" : ""}`} id="primary-navigation" aria-label="Primary navigation">
            {navItems.map((item) => <Link key={item.label} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <button type="button" className="header-action" aria-label="Search products" onClick={() => { setMenuOpen(false); setPanel("search"); }}><Icon name="search" /><span>Search</span></button>
            <Link href="/cart" className="header-action cart-header-action" aria-label={`Cart${itemCount ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`} onClick={() => setMenuOpen(false)}><span className="cart-icon-wrap"><Icon name="cart" />{itemCount > 0 && <b className="cart-count" aria-hidden="true">{itemCount > 99 ? "99+" : itemCount}</b>}</span><span>Cart</span></Link>
            <button ref={menuButton} type="button" className="icon-button menu-button" aria-controls="primary-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button>
          </div>
        </div>
      </header>
      <Dialog open={panel !== null} onClose={() => setPanel(null)} title="Search GearLab">
        {panel === "search" && <form action="/shop" method="get" className="search-form">
          <h2>Find your next upgrade.</h2>
          <label htmlFor="header-search">Search gaming gear & accessories</label>
          <div className="search-field"><Icon name="search" /><input id="header-search" type="search" name="q" placeholder="Try keyboards, mice, audio…" /></div>
          <button className="button button-primary" type="submit">Search products <Icon name="arrow" /></button>
        </form>}
      </Dialog>
    </>
  );
}
