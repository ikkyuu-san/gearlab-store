import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;

const fileFormats = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes.subarray(0, 8).join(",") === "137,80,78,71,13,10,26,10" },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP" },
} as const;

export class ProductImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageError";
  }
}

export async function validateProductImage(file: File) {
  if (!file || typeof file.arrayBuffer !== "function") throw new ProductImageError("Choose an image file to upload.");
  if (!Object.hasOwn(fileFormats, file.type)) throw new ProductImageError("Use a JPEG, PNG, or WebP image.");
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) throw new ProductImageError("Product images must be smaller than 4 MiB.");

  const signature = fileFormats[file.type as keyof typeof fileFormats];
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!signature.signature(bytes)) throw new ProductImageError("The selected file is not a valid image of that type.");
  return { extension: signature.extension };
}

function ownedBlobPath(productId: string, imageUrl: string | null, storageKey: string | null) {
  if (!imageUrl || !storageKey || !storageKey.startsWith(`products/${productId}/`)) return null;
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
    if (decodeURIComponent(url.pathname.slice(1)) !== storageKey) return null;
    return imageUrl;
  } catch {
    return null;
  }
}

async function cleanupBlob(blobUrl: string, operation: string) {
  try {
    await del(blobUrl);
  } catch {
    logger.warn("product_image_cleanup_failed", { operation, code: "BLOB_DELETE_FAILED", route: "admin/products", statusCode: 500 });
  }
}

export async function replaceProductImage(productId: string, file: File, imageAlt: string | null) {
  const { extension } = await validateProductImage(file);
  const current = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, imageUrl: true, imageStorageKey: true } });
  if (!current) throw new ProductImageError("Product not found.");

  const pathname = `products/${productId}/${randomUUID()}.${extension}`;
  let uploaded;
  try {
    uploaded = await put(pathname, file, { access: "public", addRandomSuffix: true, contentType: file.type, cacheControlMaxAge: 31536000 });
  } catch {
    logger.error("product_image_upload_failed", { operation: "upload", code: "BLOB_UPLOAD_FAILED", route: "admin/products", statusCode: 500 });
    throw new ProductImageError("The image upload could not be completed. Please try again.");
  }

  try {
    const result = await prisma.product.updateMany({
      where: { id: productId, imageUrl: current.imageUrl, imageStorageKey: current.imageStorageKey },
      data: { imageUrl: uploaded.url, imageStorageKey: uploaded.pathname, imageAlt },
    });
    if (result.count !== 1) throw new ProductImageError("The product image changed during upload. Please try again.");
  } catch (error) {
    await cleanupBlob(uploaded.url, "upload-rollback");
    if (error instanceof ProductImageError) throw error;
    throw new ProductImageError("The image could not be saved. Your previous product image is unchanged.");
  }

  const oldBlob = ownedBlobPath(productId, current.imageUrl, current.imageStorageKey);
  if (oldBlob) await cleanupBlob(oldBlob, "replace-old-image");
  return { imageUrl: uploaded.url, imageStorageKey: uploaded.pathname };
}

export async function removeProductImage(productId: string) {
  const current = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, imageUrl: true, imageStorageKey: true } });
  if (!current) throw new ProductImageError("Product not found.");
  if (!current.imageUrl && !current.imageStorageKey) return;

  const result = await prisma.product.updateMany({
    where: { id: productId, imageUrl: current.imageUrl, imageStorageKey: current.imageStorageKey },
    data: { imageUrl: null, imageStorageKey: null, imageAlt: null },
  });
  if (result.count !== 1) throw new ProductImageError("The product image changed. Refresh the page and try again.");

  const oldBlob = ownedBlobPath(productId, current.imageUrl, current.imageStorageKey);
  if (oldBlob) await cleanupBlob(oldBlob, "remove-image");
}
