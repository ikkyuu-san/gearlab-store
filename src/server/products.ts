import { Prisma, ProductStockStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/features/products/product-types";
import { ProductServiceError } from "./product-errors";
import { parseProductCreateInput, parseProductUpdateInput, type ProductCreateInput } from "./product-validation";
import { getProductCategoryLabel, normalizeProductCategory } from "@/features/products/categories";

function categoryLabel(category: string) {
  return getProductCategoryLabel(category);
}

const detailsByCategory: Record<string, string[]> = {
  keyboards: ["Compact layout", "Graphite finish", "Mechanical keys"],
  mice: ["Wireless design", "Sculpted shape", "Matte black finish"],
  audio: ["Over-ear design", "Padded earcups", "Boom microphone"],
  "desk-accessories": ["Extended format", "Fabric surface", "Stitched edges"],
};

function toProduct(product: {
  id: string;
  category: string;
  name: string;
  priceTHB: number;
  stockStatus: "PREORDER" | "IN_STOCK" | "OUT_OF_STOCK";
  imageUrl: string | null;
  imageAlt: string | null;
  description: string;
}) : Product {
  return {
    id: product.id,
    category: normalizeProductCategory(product.category),
    categoryLabel: categoryLabel(product.category),
    name: product.name,
    price: product.priceTHB,
    status: product.stockStatus === "IN_STOCK" ? "In Stock" : product.stockStatus === "OUT_OF_STOCK" ? "Out of Stock" : "Preorder",
    image: product.imageUrl,
    imageAlt: product.imageAlt?.trim() || `${product.name} product image`,
    description: product.description,
    details: detailsByCategory[normalizeProductCategory(product.category)] ?? [],
  };
}

function toServiceError(error: unknown): ProductServiceError {
  if (error instanceof ProductServiceError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const targetName = Array.isArray(target) ? target.join(" ") : String(target ?? "");
      if (targetName.toLowerCase().includes("sku")) return new ProductServiceError("DUPLICATE_SKU", "A product with this SKU already exists.", 409);
      return new ProductServiceError("DUPLICATE_SLUG", "A product with this slug already exists.", 409);
    }
    if (error.code === "P2025") return new ProductServiceError("PRODUCT_NOT_FOUND", "Product not found.", 404);
    if (error.code === "P2003") return new ProductServiceError("PRODUCT_HAS_ORDER_HISTORY", "This product cannot be deleted because it is referenced by order history.", 409);
  }

  return new ProductServiceError("DATABASE_ERROR", "The product operation could not be completed.", 500);
}

function toCreateData(input: ProductCreateInput) {
  return {
    ...input,
    stockStatus: input.stockStatus as ProductStockStatus,
  };
}

export async function listProducts(options?: { featuredOnly?: boolean }) {
  const products = await prisma.product.findMany({
    where: { active: true, ...(options?.featuredOnly ? { featured: true } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProduct);
}

export async function listAdminProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAdminProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function getProductOverview() {
  const [total, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true, stockStatus: "OUT_OF_STOCK" } }),
  ]);

  const active = await prisma.product.count({ where: { active: true } });
  return { total, active, outOfStock };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, active: true } });
  return product ? toProduct(product) : null;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({ where: { id, active: true } });
  return product ? toProduct(product) : null;
}

export async function createProduct(input: unknown) {
  let data: ProductCreateInput;
  try {
    data = parseProductCreateInput(input);
  } catch (error) {
    throw new ProductServiceError("INVALID_PRODUCT", "Product data is invalid.", 400, error);
  }

  try {
    return toProduct(await prisma.product.create({ data: toCreateData(data) }));
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function updateProduct(id: string, input: unknown) {
  let data;
  try {
    data = parseProductUpdateInput(input);
  } catch (error) {
    throw new ProductServiceError("INVALID_PRODUCT", "Product data is invalid.", 400, error);
  }

  try {
    return toProduct(await prisma.product.update({
      where: { id },
      data: {
        ...data,
        stockStatus: data.stockStatus as ProductStockStatus | undefined,
      },
    }));
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function deleteProduct(id: string) {
  try {
    return await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id },
        select: { id: true, _count: { select: { orderItems: true } } },
      });

      if (!product) throw new ProductServiceError("PRODUCT_NOT_FOUND", "Product not found.", 404);
      if (product._count.orderItems > 0) {
        throw new ProductServiceError("PRODUCT_HAS_ORDER_HISTORY", "This product cannot be deleted because it is referenced by order history.", 409);
      }

      await transaction.product.delete({ where: { id } });
      return { id, deleted: true };
    });
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function archiveProduct(id: string) {
  try {
    return await prisma.product.update({
      where: { id },
      data: { active: false, archivedAt: new Date() },
      select: { id: true, active: true, archivedAt: true },
    });
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function unarchiveProduct(id: string) {
  try {
    return await prisma.product.update({
      where: { id },
      data: { active: true, archivedAt: null },
      select: { id: true, active: true, archivedAt: true },
    });
  } catch (error) {
    throw toServiceError(error);
  }
}
