import { PrismaClient, ProductStockStatus } from "@prisma/client";
import { mockProducts } from "../src/features/products/mock-products";

const prisma = new PrismaClient();

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  for (const product of mockProducts) {
    await prisma.product.upsert({
      where: { slug: toSlug(product.name) },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        priceTHB: product.price,
        imageUrl: product.image,
        stockStatus: product.status === "In Stock" ? ProductStockStatus.IN_STOCK : ProductStockStatus.PREORDER,
        featured: true,
      },
      create: {
        slug: toSlug(product.name),
        name: product.name,
        description: product.description,
        category: product.category,
        priceTHB: product.price,
        imageUrl: product.image,
        stockStatus: product.status === "In Stock" ? ProductStockStatus.IN_STOCK : ProductStockStatus.PREORDER,
        featured: true,
      },
    });
  }

  console.log(`Prepared ${mockProducts.length} mock products for the database.`);
}

main()
  .catch(() => {
    console.error("Database seed failed. Check the database configuration and availability.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
