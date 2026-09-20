import Image from "next/image";

// Display the original uploaded wordmark. CSS crops its surrounding artwork
// and removes color; no replacement lettering or generated logo is used.
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <span className={`brand${large ? " brand-large" : ""}`}>
      <Image src="/brand/gearlab-profile.png" alt="GearLab" width={1254} height={1254} sizes={large ? "640px" : "240px"} className="brand-image" />
    </span>
  );
}
