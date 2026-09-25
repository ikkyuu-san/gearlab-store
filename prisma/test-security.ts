import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createGuestOrder, getAdminOrders, getOrderByNumberAndToken, updateOrderPaymentStatus, updateOrderStatus } from "../src/server/orders";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({ where: { stockStatus: { not: "OUT_OF_STOCK" } }, select: { id: true, priceMMK: true } });
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
    const serverPriceSnapshotCorrect = snapshot?.priceSnapshot === product.priceMMK;
    const orderSummary = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber }, select: { id: true, totalAmount: true, currency: true, subtotal: true, deliveryMethod: true } });
    const deliverySummaryCorrect = orderSummary?.deliveryMethod === "STANDARD" && orderSummary.totalAmount === orderSummary.subtotal && orderSummary.currency === "MMK";
    const statusUpdated = orderSummary ? await updateOrderStatus(orderSummary.id, "CONFIRMED") : null;
    const paymentUpdated = orderSummary ? await updateOrderPaymentStatus(orderSummary.id, "PAID") : null;
    const paymentRecord = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber }, select: { paymentStatus: true } });
    let invalidPaymentRejected = false;
    try {
      if (orderSummary) await updateOrderPaymentStatus(orderSummary.id, "REFUNDED");
    } catch (error) {
      invalidPaymentRejected = error instanceof Error && error.message === "Choose a valid payment status.";
    }
    const updatedTracking = result.publicAccessToken ? await getOrderByNumberAndToken(result.orderNumber, result.publicAccessToken) : null;
    const trackingReflectsLatestStatus = statusUpdated?.status === "CONFIRMED" && updatedTracking?.status === "CONFIRMED";
    const paymentMutationWorks = paymentUpdated?.paymentStatus === "PAID" && paymentRecord?.paymentStatus === "PAID";
    const customerPaymentStatusHidden = updatedTracking !== null && !("paymentStatus" in updatedTracking);
    const searchByOrderNumber = (await getAdminOrders({ query: result.orderNumber, status: "CONFIRMED" })).some((order) => order.orderNumber === result.orderNumber);
    const searchByCustomerName = (await getAdminOrders({ query: "Security Verification", status: "CONFIRMED" })).some((order) => order.orderNumber === result.orderNumber);
    const searchByPhone = (await getAdminOrders({ query: "+95000000000", status: "CONFIRMED" })).some((order) => order.orderNumber === result.orderNumber);
    const orderFiltersWork = searchByOrderNumber && searchByCustomerName && searchByPhone;
    const historicalOrder = await prisma.order.findFirst({
      where: { orderNumber: { not: result.orderNumber }, publicAccessToken: { not: null }, items: { some: {} } },
      select: { orderNumber: true, publicAccessToken: true, paymentStatus: true },
      orderBy: { createdAt: "asc" },
    });
    const historicalOrderStillAccessible = historicalOrder?.publicAccessToken
      ? Boolean(await getOrderByNumberAndToken(historicalOrder.orderNumber, historicalOrder.publicAccessToken))
      : null;
    const historicalPaymentDefaulted = historicalOrder ? historicalOrder.paymentStatus === "UNPAID" : null;
    console.log(JSON.stringify({ correctTokenWorks, missingTokenHidden, incorrectTokenHidden, serverPriceSnapshotCorrect, deliverySummaryCorrect, trackingReflectsLatestStatus, paymentMutationWorks, invalidPaymentRejected, customerPaymentStatusHidden, orderFiltersWork, historicalOrderStillAccessible, historicalPaymentDefaulted }));
    if (!correctTokenWorks || !missingTokenHidden || !incorrectTokenHidden || !serverPriceSnapshotCorrect || !deliverySummaryCorrect || !trackingReflectsLatestStatus || !paymentMutationWorks || !invalidPaymentRejected || !customerPaymentStatusHidden || !orderFiltersWork || historicalOrderStillAccessible === false || historicalPaymentDefaulted === false) {
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
