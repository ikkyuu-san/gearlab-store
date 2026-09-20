import Image from "next/image";
import { Icon } from "@/components/site/icon";

export function ProductImage({ src, alt, sizes = "(max-width: 559px) 90vw, (max-width: 1023px) 45vw, 23vw" }: { src: string | null; alt: string; sizes?: string }) {
  if (src) return <Image src={src} alt={alt} width={640} height={640} sizes={sizes} />;
  return <span className="image-placeholder"><Icon name="box" width={40} height={40} /><span>Product photo<br />coming soon</span></span>;
}
