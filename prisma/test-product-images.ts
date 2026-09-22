import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { head } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

async function main() {
  const { ProductImageError, MAX_PRODUCT_IMAGE_BYTES, validateProductImage, replaceProductImage, removeProductImage } = await import("../src/server/product-images");
  const before = await prisma.$transaction([
    prisma.product.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
  ]);
  let created = false;
  let testProductId = "";
  let initialUrl: string | undefined;
  let replacementUrl: string | undefined;
  try {
    const badTypeRejected = await validateProductImage(new File([PNG], "not-image.gif", { type: "image/gif" })).then(() => false, (error) => error instanceof ProductImageError);
    const invalidSignatureRejected = await validateProductImage(new File([PNG], "spoofed.jpg", { type: "image/jpeg" })).then(() => false, (error) => error instanceof ProductImageError);
    const oversizedRejected = await validateProductImage(new File([new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })).then(() => false, (error) => error instanceof ProductImageError);
    if (!badTypeRejected || !invalidSignatureRejected || !oversizedRejected) throw new Error("Image validation checks failed.");

    const product = await prisma.product.create({ data: {
      slug: `image-test-${Date.now()}-${randomUUID().slice(0, 8)}`,
      name: "Temporary Image Upload Verification",
      description: "Temporary product used only by the managed image verification script.",
      category: "keyboards",
      priceTHB: 1,
      active: true,
    }, select: { id: true } });
    testProductId = product.id;
    created = true;

    const first = await replaceProductImage(product.id, new File([PNG], "untrusted-name.png", { type: "image/png" }), "Temporary test image");
    initialUrl = first.imageUrl;
    const publicImageResponse = await fetch(first.imageUrl);
    const publicImageServed = publicImageResponse.ok && publicImageResponse.headers.get("content-type")?.startsWith("image/png");
    await publicImageResponse.body?.cancel();
    const initialRecord = await prisma.product.findUnique({ where: { id: product.id }, select: { imageUrl: true, imageStorageKey: true } });
    if (!publicImageServed || initialRecord?.imageUrl !== first.imageUrl || initialRecord.imageStorageKey !== first.imageStorageKey || !first.imageStorageKey.startsWith(`products/${product.id}/`)) {
      throw new Error("Initial managed image reference verification failed.");
    }

    const second = await replaceProductImage(product.id, new File([PNG], "another-untrusted-name.png", { type: "image/png" }), "Replacement test image");
    replacementUrl = second.imageUrl;
    const replacementRecord = await prisma.product.findUnique({ where: { id: product.id }, select: { imageUrl: true, imageStorageKey: true } });
    const oldBlobRemoved = await head(initialUrl).then(() => false, () => true);
    if (replacementRecord?.imageUrl !== second.imageUrl || replacementRecord.imageStorageKey !== second.imageStorageKey || !oldBlobRemoved) {
      throw new Error("Image replacement verification failed.");
    }

    await removeProductImage(product.id);
    const removedRecord = await prisma.product.findUnique({ where: { id: product.id }, select: { imageUrl: true, imageStorageKey: true, imageAlt: true } });
    const replacementBlobRemoved = await head(replacementUrl).then(() => false, () => true);
    if (removedRecord?.imageUrl !== null || removedRecord.imageStorageKey !== null || removedRecord.imageAlt !== null || !replacementBlobRemoved) {
      throw new Error("Image removal verification failed.");
    }

    const after = await prisma.$transaction([
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
    ]);
    if (before[0] !== after[0] - 1 || before[1] !== after[1] || before[2] !== after[2]) throw new Error("Existing catalog or order data changed during verification.");
    console.log("Managed image verification passed: file validation, upload, replacement cleanup, removal cleanup, and existing data preservation.");
  } finally {
    if (created) {
      const current = await prisma.product.findUnique({ where: { id: testProductId }, select: { imageUrl: true, imageStorageKey: true } });
      if (current?.imageUrl && current.imageStorageKey) await removeProductImage(testProductId).catch(() => undefined);
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => undefined);
    }
  }
}

main()
  .catch((error: unknown) => {
    const failureType = error instanceof Error ? error.name : "UnknownError";
    console.error(`Managed image verification failed (${failureType}). Check the local Blob configuration and database availability.`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
