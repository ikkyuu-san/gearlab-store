import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createGuestOrder, getOrderByNumberAndToken } from "../src/server/orders";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({ where: { stockStatus: { not: "OUT_OF_STOCK" } }, select: { id: true, priceTHB: true } });
  if (!product) throw new Error("No orderable product is available for security verification.");

  const result = await createGuestOrder({
    checkoutToken: randomUUID(),
    customerName: "Security Verification",
    phone: "+95000000000",
    email: "",
    deliveryAddress: "Temporary verification address",
    note: "Temporary verification order",
    items: [{ productId: product.id, quantity: 1 }],
  });

  try {
    const correctTokenWorks = Boolean(result.publicAccessToken && await getOrderByNumberAndToken(result.orderNumber, result.publicAccessToken));
    const missingTokenHidden = !(await getOrderByNumberAndToken(result.orderNumber, ""));
    const incorrectTokenHidden = !(await getOrderByNumberAndToken(result.orderNumber, "x".repeat(43)));
    const snapshot = await prisma.orderItem.findFirst({ where: { order: { orderNumber: result.orderNumber } }, select: { priceSnapshot: true } });
    const serverPriceSnapshotCorrect = snapshot?.priceSnapshot === product.priceTHB;
    console.log(JSON.stringify({ correctTokenWorks, missingTokenHidden, incorrectTokenHidden, serverPriceSnapshotCorrect }));
  } finally {
    await prisma.order.delete({ where: { orderNumber: result.orderNumber } });
  }
}

main()
  .catch(() => {
    console.error("Security verification failed. Check the database configuration and availability.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
