import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand"><Link href="/" className="brand-link" aria-label="GearLab home"><Brand /></Link><p>Gaming gear. Tech essentials.<br />Carefully selected for your setup.</p><span className="footer-route">Thailand <Icon name="arrow" width={16} /> Myanmar</span></div>
        <nav aria-label="Shop links"><h2>Explore</h2><Link href="/shop">All products</Link><Link href="/shop?category=keyboards">Keyboards</Link><Link href="/shop?category=mice">Mice</Link><Link href="/shop?category=audio">Audio</Link><Link href="/shop?category=desk">Desk accessories</Link></nav>
        <nav aria-label="Information links"><h2>GearLab</h2><Link href="/#about">About us</Link><Link href="/#preorder">How preorder works</Link><Link href="/#categories">Our categories</Link></nav>
        <div className="footer-note"><p className="eyebrow">Built around your setup</p><p>A little more considered.<br />A lot more you.</p></div>
      </div>
      <div className="container footer-bottom"><p>© {new Date().getFullYear()} GearLab. All rights reserved.</p><span>Gaming & electronics · Myanmar</span></div>
    </footer>
  );
}
