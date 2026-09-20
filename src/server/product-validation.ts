import { z } from "zod";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens.");
const imageUrl = z.string().trim().max(2048).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image URL must be a relative path or an http(s) URL.").nullable();

const productFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  category: z.string().trim().toLowerCase().min(1).max(80),
  priceTHB: z.number().int().min(0).max(100_000_000),
  imageUrl,
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
