import { z } from "zod";
import { normalizeProductCategory, PRODUCT_CATEGORY_IDS } from "@/features/products/categories";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens.");
const imageUrl = z.string().trim().max(2048).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image URL must be a relative path or an http(s) URL.").nullable();
const category = z.string().trim().transform(normalizeProductCategory).pipe(z.enum(PRODUCT_CATEGORY_IDS));
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null).nullable().optional().transform((value) => value ?? null);
const sku = z.string().trim().toUpperCase().transform((value) => value || null).pipe(z.string().max(80).regex(/^[A-Z0-9][A-Z0-9._/-]*$/).nullable()).optional().transform((value) => value ?? null);
const quantityLimit = z.number().int().min(0).max(1_000_000).nullable().optional().transform((value) => value ?? null);
const preorderEta = z.union([z.iso.date(), z.literal("")]).optional().transform((value) => value ? new Date(`${value}T00:00:00.000Z`) : null);
const specificationRow = z.object({
  name: z.string().trim().max(100),
  value: z.string().trim().max(500),
}).superRefine((row, context) => {
  if (Boolean(row.name) !== Boolean(row.value)) {
    context.addIssue({ code: "custom", message: "Enter both a specification name and value, or leave both empty." });
  }
});
const specifications = z.array(specificationRow).max(50).optional().transform((rows) =>
  rows?.filter((row) => row.name && row.value).map((row, position) => ({ ...row, position })) ?? [],
);

const productFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  category,
  brand: optionalText(120),
  sku,
  priceMMK: z.number().int().min(0).max(100_000_000),
  imageUrl,
  imageAlt: optionalText(300),
  stockStatus: z.enum(["PREORDER", "IN_STOCK", "OUT_OF_STOCK"]),
  stockQuantity: quantityLimit,
  preorderLimit: quantityLimit,
  preorderEta,
  featured: z.boolean(),
  specifications,
};

const inventoryMode = <T extends { stockStatus?: string; stockQuantity?: number | null; preorderLimit?: number | null }>(schema: z.ZodType<T>) => schema.superRefine((value, context) => {
  if (value.stockStatus === "IN_STOCK" && value.stockQuantity == null) context.addIssue({ code: "custom", path: ["stockQuantity"], message: "Set the total stock quantity for in-stock products." });
  if (value.stockStatus !== undefined && value.stockStatus !== "IN_STOCK" && value.stockQuantity != null) context.addIssue({ code: "custom", path: ["stockQuantity"], message: "Stock quantity is only used for in-stock products." });
  if (value.stockStatus === "PREORDER" && value.preorderLimit === 0) context.addIssue({ code: "custom", path: ["preorderLimit"], message: "Preorder limit must be greater than zero." });
  if (value.stockStatus !== undefined && value.stockStatus !== "PREORDER" && value.preorderLimit != null) context.addIssue({ code: "custom", path: ["preorderLimit"], message: "Preorder limit is only used for preorder products." });
});

const productCreateObject = z.object({
  slug,
  ...productFields,
  imageUrl: imageUrl.default(null),
  stockStatus: productFields.stockStatus.default("PREORDER"),
  stockQuantity: quantityLimit,
  preorderLimit: quantityLimit,
  preorderEta,
  featured: productFields.featured.default(false),
});

export const productCreateSchema = inventoryMode(productCreateObject);

export const productUpdateSchema = inventoryMode(productCreateObject.partial()).refine((value) => Object.keys(value).length > 0, "At least one product field is required.");

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export function parseProductCreateInput(input: unknown) {
  return productCreateSchema.parse(input);
}

export function parseProductUpdateInput(input: unknown) {
  return productUpdateSchema.parse(input);
}
