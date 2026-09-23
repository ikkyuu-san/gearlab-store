import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Terms | GearLab",
  description: "Important information about placing orders with GearLab.",
};

export default function TermsPage() {
  return (
    <InfoPage eyebrow="GearLab / Customer information" title="Terms" intro="Please review these practical ordering notes before submitting a GearLab order.">
      <InfoSection title="Orders and availability">
        <p>Submitting checkout details creates an order request. GearLab reviews the request and confirms product availability and order details. Preorder availability and estimates can change while products are being sourced.</p>
      </InfoSection>
      <InfoSection title="Prices and delivery">
        <p>Product prices are shown in THB. Delivery timing and any delivery charge are confirmed separately and are not included in the product total unless explicitly stated.</p>
      </InfoSection>
      <InfoSection title="Customer details">
        <p>Please provide accurate contact and delivery information and verify it before placing an order. GearLab uses these details to review and coordinate your order.</p>
      </InfoSection>
      <InfoSection title="Order status">
        <p>Your secure tracking page displays the current order status. If you believe an order detail is wrong, contact GearLab using an available contact option before relying on an estimate or status label.</p>
      </InfoSection>
    </InfoPage>
  );
}
