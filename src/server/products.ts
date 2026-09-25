import { Prisma, ProductStockStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/features/products/product-types";
import { ProductServiceError } from "./product-errors";
import { parseProductCreateInput, parseProductUpdateInput, type ProductCreateInput } from "./product-validation";
import { getProductCategoryLabel, normalizeProductCategory } from "@/features/products/categories";

function categoryLabel(category: string) {
  return getProductCategoryLabel(category);
}

type ProductWithSpecifications = Prisma.ProductGetPayload<{ include: { specifications: true } }>;

function toProduct(product: ProductWithSpecifications, committedQuantity = 0): Product {
  const availableQuantity = product.stockStatus === "IN_STOCK" && product.stockQuantity !== null
    ? Math.max(0, product.stockQuantity - committedQuantity)
    : product.stockStatus === "PREORDER" && product.preorderLimit !== null
      ? Math.max(0, product.preorderLimit - committedQuantity)
      : null;
  const eta = product.preorderEta?.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const availabilityMessage = product.stockStatus === "OUT_OF_STOCK"
    ? "Out of Stock"
    : product.stockStatus === "IN_STOCK"
      ? availableQuantity === null ? "In Stock" : availableQuantity === 0 ? "Out of Stock" : availableQuantity <= 3 ? `Only ${availableQuantity} left` : "In Stock"
      : `Preorder${availableQuantity === 0 ? " · Limit reached" : availableQuantity !== null ? ` · ${availableQuantity} available` : ""}${eta ? ` · Est. ${eta}` : ""}`;

  return {
    id: product.id,
    category: normalizeProductCategory(product.category),
    categoryLabel: categoryLabel(product.category),
    name: product.name,
    price: product.priceMMK,
    status: product.stockStatus === "OUT_OF_STOCK" || (product.stockStatus === "IN_STOCK" && availableQuantity === 0) ? "Out of Stock" : product.stockStatus === "IN_STOCK" ? "In Stock" : "Preorder",
    image: product.imageUrl,
    imageAlt: product.imageAlt?.trim() || `${product.name} product image`,
    description: product.description,
    specifications: product.specifications
      .sort((left, right) => left.position - right.position)
      .map(({ name, value }) => ({ name, value })),
    availabilityMessage,
    availableQuantity,
    preorderEta: product.preorderEta?.toISOString().slice(0, 10) ?? null,
  };
}

async function committedQuantities(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>();
  const totals = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
  });
  return new Map(totals.map((total) => [total.productId, total._sum.quantity ?? 0]));
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
  const { specifications, ...fields } = input;
  return {
    ...fields,
    stockStatus: input.stockStatus as ProductStockStatus,
    stockQuantity: input.stockStatus === "IN_STOCK" ? input.stockQuantity : null,
    preorderLimit: input.stockStatus === "PREORDER" ? input.preorderLimit : null,
    preorderEta: input.stockStatus === "PREORDER" ? input.preorderEta : null,
    specifications: { create: specifications ?? [] },
  };
}

export async function listProducts(options?: { featuredOnly?: boolean }) {
  const products = await prisma.product.findMany({
    where: { active: true, ...(options?.featuredOnly ? { featured: true } : {}) },
    orderBy: { createdAt: "desc" },
    include: { specifications: { orderBy: { position: "asc" } } },
  });
  const committed = await committedQuantities(products.map((product) => product.id));
  return products.map((product) => toProduct(product, committed.get(product.id) ?? 0));
}

export async function listAdminProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { specifications: { orderBy: { position: "asc" } } } });
}

export async function getAdminProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { specifications: { orderBy: { position: "asc" } } } });
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
  const product = await prisma.product.findFirst({ where: { slug, active: true }, include: { specifications: { orderBy: { position: "asc" } } } });
  if (!product) return null;
  const committed = await committedQuantities([product.id]);
  return toProduct(product, committed.get(product.id) ?? 0);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({ where: { id, active: true }, include: { specifications: { orderBy: { position: "asc" } } } });
  if (!product) return null;
  const committed = await committedQuantities([product.id]);
  return toProduct(product, committed.get(product.id) ?? 0);
}

export async function createProduct(input: unknown) {
  let data: ProductCreateInput;
  try {
    data = parseProductCreateInput(input);
  } catch (error) {
    throw new ProductServiceError("INVALID_PRODUCT", "Product data is invalid.", 400, error);
  }

  try {
    return toProduct(await prisma.product.create({ data: toCreateData(data), include: { specifications: true } }));
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
    const { specifications, ...fields } = data;
    return toProduct(await prisma.$transaction(async (transaction) => {
      await transaction.product.update({
        where: { id },
        data: {
          ...fields,
          stockStatus: fields.stockStatus as ProductStockStatus | undefined,
          ...(fields.stockStatus === "IN_STOCK" ? { preorderLimit: null, preorderEta: null } : {}),
          ...(fields.stockStatus === "PREORDER" ? { stockQuantity: null } : {}),
          ...(fields.stockStatus === "OUT_OF_STOCK" ? { stockQuantity: null, preorderLimit: null, preorderEta: null } : {}),
        },
      });
      if (specifications !== undefined) {
        await transaction.productSpecification.deleteMany({ where: { productId: id } });
        if (specifications.length > 0) {
          await transaction.productSpecification.createMany({ data: specifications.map((specification) => ({ ...specification, productId: id })) });
        }
      }
      return transaction.product.findUniqueOrThrow({ where: { id }, include: { specifications: true } });
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
