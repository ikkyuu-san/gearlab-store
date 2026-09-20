import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartContent } from "./cart-content";

export const metadata: Metadata = { title: "Cart | GearLab" };

export default function CartPage() {
  return <><Header /><main id="main-content" className="cart-page"><div className="container"><div className="cart-heading"><p className="eyebrow">GearLab / Your selection</p><h1>Your cart.</h1><p>Review your selected gear before checkout opens.</p></div><CartContent /></div></main><Footer /></>;
}
