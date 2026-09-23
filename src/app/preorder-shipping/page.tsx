import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Preorder & Shipping | GearLab",
  description: "How GearLab preorders and delivery work.",
};

export default function PreorderShippingPage() {
  return (
    <InfoPage eyebrow="GearLab / Customer information" title="Preorder & Shipping" intro="A clear guide to ordering selected gaming gear and tech accessories from Thailand to Myanmar.">
      <InfoSection title="How preorders work">
        <p>Preorder products are sourced after GearLab reviews and confirms your order. Product availability and estimated arrival information may change; any estimate shown is not a guaranteed delivery date.</p>
      </InfoSection>
      <InfoSection title="Delivery">
        <p>Delivery timing and any delivery charge may be confirmed separately with you. The checkout total is the product total before delivery unless a delivery charge is explicitly shown.</p>
      </InfoSection>
      <InfoSection title="Before placing an order">
        <p>Please check the product, quantity, contact details, and delivery address carefully before submitting. If anything is incorrect, contact GearLab so it can be reviewed.</p>
      </InfoSection>
      <InfoSection title="Order updates">
        <p>GearLab updates the order status as it progresses. Your secure order tracking page shows the latest status and order details available to you.</p>
      </InfoSection>
    </InfoPage>
  );
}
