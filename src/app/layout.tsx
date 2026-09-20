import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { CartProvider } from "@/features/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GearLab | Gaming Gear & Tech Accessories",
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col"><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
