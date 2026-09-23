import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createGuestOrder, getOrderByNumberAndToken, updateOrderStatus } from "../src/server/orders";

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
    deliveryMethod: "STANDARD",
    note: "Temporary verification order",
    items: [{ productId: product.id, quantity: 1 }],
  });

  try {
    const correctTokenWorks = Boolean(result.publicAccessToken && await getOrderByNumberAndToken(result.orderNumber, result.publicAccessToken));
    const missingTokenHidden = !(await getOrderByNumberAndToken(result.orderNumber, ""));
    const incorrectTokenHidden = !(await getOrderByNumberAndToken(result.orderNumber, "x".repeat(43)));
    const snapshot = await prisma.orderItem.findFirst({ where: { order: { orderNumber: result.orderNumber } }, select: { priceSnapshot: true } });
    const serverPriceSnapshotCorrect = snapshot?.priceSnapshot === product.priceTHB;
    const orderSummary = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber }, select: { id: true, totalTHB: true, subtotal: true, deliveryMethod: true } });
    const deliverySummaryCorrect = orderSummary?.deliveryMethod === "STANDARD" && orderSummary.totalTHB === orderSummary.subtotal;
    const statusUpdated = orderSummary ? await updateOrderStatus(orderSummary.id, "CONFIRMED") : null;
    const updatedTracking = result.publicAccessToken ? await getOrderByNumberAndToken(result.orderNumber, result.publicAccessToken) : null;
    const trackingReflectsLatestStatus = statusUpdated?.status === "CONFIRMED" && updatedTracking?.status === "CONFIRMED";
    const historicalOrder = await prisma.order.findFirst({
      where: { orderNumber: { not: result.orderNumber }, publicAccessToken: { not: null }, items: { some: {} } },
      select: { orderNumber: true, publicAccessToken: true },
      orderBy: { createdAt: "asc" },
    });
    const historicalOrderStillAccessible = historicalOrder?.publicAccessToken
      ? Boolean(await getOrderByNumberAndToken(historicalOrder.orderNumber, historicalOrder.publicAccessToken))
      : null;
    console.log(JSON.stringify({ correctTokenWorks, missingTokenHidden, incorrectTokenHidden, serverPriceSnapshotCorrect, deliverySummaryCorrect, trackingReflectsLatestStatus, historicalOrderStillAccessible }));
    if (!correctTokenWorks || !missingTokenHidden || !incorrectTokenHidden || !serverPriceSnapshotCorrect || !deliverySummaryCorrect || !trackingReflectsLatestStatus || historicalOrderStillAccessible === false) {
      throw new Error("Secure order verification assertions failed.");
    }
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
