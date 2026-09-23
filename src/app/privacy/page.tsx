import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Privacy | GearLab",
  description: "How GearLab uses information provided with an order.",
};

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="GearLab / Customer information" title="Privacy" intro="This page explains the customer information currently needed to handle GearLab orders.">
      <InfoSection title="Information you provide">
        <p>When you place an order, GearLab collects your name, phone number, delivery address, and order details. Email and an order note are optional.</p>
      </InfoSection>
      <InfoSection title="How it is used">
        <p>Order information is used to review and fulfil your order, confirm product and delivery details, and provide order updates. GearLab does not ask for card or banking credentials through checkout.</p>
      </InfoSection>
      <InfoSection title="Order access and browser storage">
        <p>Order details are available through a secure, order-specific browser cookie after checkout; an order number by itself is not enough to view them. The guest cart is saved in your browser so it can remain available between visits.</p>
      </InfoSection>
      <InfoSection title="Questions">
        <p>Use the Contact page for the contact options currently configured by GearLab. Do not send payment credentials or other sensitive financial information.</p>
      </InfoSection>
    </InfoPage>
  );
}
