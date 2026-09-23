import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/site/info-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | GearLab",
  description: "Contact options for GearLab customers.",
};

export default function ContactPage() {
  const { email, facebookPageUrl } = siteConfig.contact;

  return (
    <InfoPage eyebrow="GearLab / Customer information" title="Contact" intro="Need help with a product or an order? Use one of the contact options below.">
      <InfoSection title="Contact GearLab">
        {email || facebookPageUrl ? (
          <ul className="info-contact-list">
            {email ? <li><a href={`mailto:${email}`}>{email}</a></li> : null}
            {facebookPageUrl ? <li><a href={facebookPageUrl} target="_blank" rel="noopener noreferrer">Official GearLab Facebook page</a></li> : null}
          </ul>
        ) : (
          <p>Direct contact details have not been configured on this website yet. Please check GearLab’s official Facebook page for current contact options.</p>
        )}
      </InfoSection>
      <InfoSection title="For order questions">
        <p>Keep your order number available when asking about an order. Do not share your secure order access link or send payment credentials.</p>
        <p><Link href="/preorder-shipping">Read about preorder and delivery</Link></p>
      </InfoSection>
    </InfoPage>
  );
}
