import { randomUUID } from "node:crypto";
import { ProductStockStatus, PrismaClient } from "@prisma/client";
import { createGuestOrder, OrderServiceError, updateOrderStatus } from "../src/server/orders";

const prisma = new PrismaClient();
const productIds: string[] = [];

function checkoutPayload(productId: string, quantity: number) {
  return {
    checkoutToken: randomUUID(),
    customerName: "Inventory Verification",
    phone: "+95000000000",
    email: "",
    deliveryAddress: "Temporary inventory verification address",
    note: "Temporary inventory test",
    items: [{ productId, quantity }],
  };
}

async function createFixture(stockStatus: ProductStockStatus, stockQuantity: number | null, preorderLimit: number | null) {
  const product = await prisma.product.create({
    data: {
      slug: `inventory-test-${randomUUID()}`,
      name: "Temporary Inventory Verification Product",
      description: "Temporary product used by the inventory verification script.",
      category: "keyboards",
      priceTHB: 100,
      stockStatus,
      stockQuantity,
      preorderLimit,
    },
    select: { id: true },
  });
  productIds.push(product.id);
  return product.id;
}

async function concurrentLimitTest(productId: string, quantity: number, expectedLimit: number) {
  const outcomes = await Promise.allSettled([
    createGuestOrder(checkoutPayload(productId, quantity)),
    createGuestOrder(checkoutPayload(productId, quantity)),
  ]);
  const succeeded = outcomes.flatMap((outcome) => outcome.status === "fulfilled" ? [outcome.value] : []);
  const failed = outcomes.filter((outcome) => outcome.status === "rejected");
  if (succeeded.length !== 1 || failed.length !== 1 || !(failed[0].status === "rejected" && failed[0].reason instanceof OrderServiceError)) {
    throw new Error("Concurrent inventory limit was not enforced.");
  }
  const used = await prisma.orderItem.aggregate({
    where: { productId, order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
  });
  if ((used._sum.quantity ?? 0) > expectedLimit) throw new Error("Concurrent checkouts exceeded product capacity.");
  return succeeded[0].orderNumber;
}

async function cancelTestOrder(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
  if (!order) throw new Error("Expected temporary test order was not found.");
  await updateOrderStatus(order.id, "CANCELLED");
}

async function main() {
  const historical = await prisma.orderItem.findFirst({ select: { id: true, productNameSnapshot: true, priceSnapshot: true, lineTotal: true } });
  const inStockId = await createFixture(ProductStockStatus.IN_STOCK, 5, null);
  const inStockOrder = await concurrentLimitTest(inStockId, 4, 5);
  await cancelTestOrder(inStockOrder);
  await createGuestOrder(checkoutPayload(inStockId, 4));

  const preorderId = await createFixture(ProductStockStatus.PREORDER, null, 5);
  const preorderOrder = await concurrentLimitTest(preorderId, 4, 5);
  await cancelTestOrder(preorderOrder);
  await createGuestOrder(checkoutPayload(preorderId, 4));

  const outOfStockId = await createFixture(ProductStockStatus.OUT_OF_STOCK, null, null);
  let outOfStockRejected = false;
  try {
    await createGuestOrder(checkoutPayload(outOfStockId, 1));
  } catch (error) {
    outOfStockRejected = error instanceof OrderServiceError && error.code === "PRODUCT_UNAVAILABLE";
  }
  if (!outOfStockRejected) throw new Error("Out-of-stock product was accepted at checkout.");

  let overLimitRejected = false;
  try {
    await createGuestOrder(checkoutPayload(preorderId, 2));
  } catch (error) {
    overLimitRejected = error instanceof OrderServiceError && error.code === "PRODUCT_UNAVAILABLE";
  }
  if (!overLimitRejected) throw new Error("Preorder capacity overrun was accepted.");

  const historicalAfter = historical ? await prisma.orderItem.findUnique({ where: { id: historical.id }, select: { productNameSnapshot: true, priceSnapshot: true, lineTotal: true } }) : null;
  if (historical && (!historicalAfter || historicalAfter.productNameSnapshot !== historical.productNameSnapshot || historicalAfter.priceSnapshot !== historical.priceSnapshot || historicalAfter.lineTotal !== historical.lineTotal)) {
    throw new Error("Historical order item snapshot changed during verification.");
  }

  console.log("Inventory verification passed: concurrent stock/preorder caps, cancellation capacity release, out-of-stock rejection, and historical snapshots.");
}

main()
  .catch((error: unknown) => {
    const safeAssertions = new Set([
      "Concurrent inventory limit was not enforced.",
      "Concurrent checkouts exceeded product capacity.",
      "Out-of-stock product was accepted at checkout.",
      "Preorder capacity overrun was accepted.",
      "Historical order item snapshot changed during verification.",
    ]);
    const reason = error instanceof OrderServiceError
      ? error.code
      : error instanceof Error && safeAssertions.has(error.message)
        ? error.message
        : error instanceof Error
          ? error.name
          : "Unexpected error";
    console.error(`Inventory verification failed: ${reason}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (productIds.length) await prisma.order.deleteMany({ where: { items: { some: { productId: { in: productIds } } } } });
      if (productIds.length) await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    } finally {
      await prisma.$disconnect();
    }
  });
