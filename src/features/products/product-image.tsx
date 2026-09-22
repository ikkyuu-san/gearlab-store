"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/site/icon";

export function ProductImage({ src, alt, sizes = "(max-width: 559px) 90vw, (max-width: 1023px) 45vw, 23vw" }: { src: string | null; alt: string; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    const managedBlob = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/products\//.test(src);
    return <Image src={src} alt={alt} width={640} height={640} sizes={sizes} unoptimized={!managedBlob} onError={() => setFailed(true)} />;
  }
  return <span className="image-placeholder"><Icon name="box" width={40} height={40} /><span>Product photo<br />coming soon</span></span>;
}
