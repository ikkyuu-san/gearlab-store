import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { name: true, category: true, priceTHB: true, stockStatus: true },
    orderBy: { name: "asc" },
  });

  console.log(JSON.stringify({ count: products.length, products }, null, 2));
}

main()
  .catch(() => {
    console.error("Database verification failed. Check the database configuration and availability.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
