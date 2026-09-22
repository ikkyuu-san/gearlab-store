import { z } from "zod";
import { normalizeProductCategory, PRODUCT_CATEGORY_IDS } from "@/features/products/categories";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens.");
const imageUrl = z.string().trim().max(2048).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image URL must be a relative path or an http(s) URL.").nullable();
const category = z.string().trim().transform(normalizeProductCategory).pipe(z.enum(PRODUCT_CATEGORY_IDS));
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null).nullable().optional().transform((value) => value ?? null);
const sku = z.string().trim().toUpperCase().transform((value) => value || null).pipe(z.string().max(80).regex(/^[A-Z0-9][A-Z0-9._/-]*$/).nullable()).optional().transform((value) => value ?? null);

const productFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  category,
  brand: optionalText(120),
  sku,
  priceTHB: z.number().int().min(0).max(100_000_000),
  imageUrl,
  imageAlt: optionalText(300),
  stockStatus: z.enum(["PREORDER", "IN_STOCK", "OUT_OF_STOCK"]),
  featured: z.boolean(),
};

export const productCreateSchema = z.object({
  slug,
  ...productFields,
  imageUrl: imageUrl.default(null),
  stockStatus: productFields.stockStatus.default("PREORDER"),
  featured: productFields.featured.default(false),
});

export const productUpdateSchema = productCreateSchema.partial().refine((value) => Object.keys(value).length > 0, "At least one product field is required.");

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export function parseProductCreateInput(input: unknown) {
  return productCreateSchema.parse(input);
}

export function parseProductUpdateInput(input: unknown) {
  return productUpdateSchema.parse(input);
}
