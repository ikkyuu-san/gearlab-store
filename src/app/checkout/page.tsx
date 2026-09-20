import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout | GearLab" };

export default function CheckoutPage() {
  return <><Header /><main id="main-content" className="checkout-page"><div className="container"><div className="cart-heading"><p className="eyebrow">GearLab / Checkout</p><h1>Complete your preorder.</h1><p>Share the essentials and we’ll confirm the details with you.</p></div><CheckoutForm /></div></main><Footer /></>;
}
