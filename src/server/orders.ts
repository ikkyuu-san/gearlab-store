import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type OrderServiceErrorCode = "INVALID_ORDER" | "INVALID_STATUS" | "ORDER_NOT_FOUND" | "PRODUCT_NOT_FOUND" | "PRODUCT_UNAVAILABLE" | "DATABASE_ERROR";

export class OrderServiceError extends Error {
  constructor(public readonly code: OrderServiceErrorCode, message: string, public readonly statusCode: number) {
    super(message);
    this.name = "OrderServiceError";
  }
}

const guestOrderSchema = z.object({
  checkoutToken: z.string().uuid(),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{5,30}$/, "Enter a valid phone number."),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional().transform((value) => value || null),
  deliveryAddress: z.string().trim().min(5).max(1000),
  deliveryMethod: z.enum(["STANDARD"]).default("STANDARD"),
  note: z.string().trim().max(2000).optional().transform((value) => value || null),
  items: z.array(z.object({ productId: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(10) })).min(1).max(50),
}).superRefine((value, context) => {
  const ids = value.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["items"], message: "Duplicate cart items are not valid." });
});

const orderStatusSchema = z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]);

function makeOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `GL-${date}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function makePublicAccessToken() {
  return randomBytes(32).toString("base64url");
}

function toOrderError(error: unknown) {
  if (error instanceof OrderServiceError) return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return new OrderServiceError("DATABASE_ERROR", "We could not complete the order. Please try again.", 409);
  return new OrderServiceError("DATABASE_ERROR", "We could not complete the order. Please try again.", 500);
}

async function lockProductRows(transaction: Prisma.TransactionClient, productIds: string[]) {
  const ids = [...new Set(productIds)].sort();
  if (ids.length === 0) return;
  await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
}

async function getCommittedQuantities(transaction: Prisma.TransactionClient, productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>();
  const totals = await transaction.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
  });
  return new Map(totals.map((total) => [total.productId, total._sum.quantity ?? 0]));
}

function assertProductCapacity(product: {
  name: string;
  stockStatus: "PREORDER" | "IN_STOCK" | "OUT_OF_STOCK";
  stockQuantity: number | null;
  preorderLimit: number | null;
}, requested: number, committed: number) {
  if (product.stockStatus === "OUT_OF_STOCK") {
    throw new OrderServiceError("PRODUCT_UNAVAILABLE", `${product.name} is currently out of stock.`, 409);
  }

  const limit = product.stockStatus === "IN_STOCK" ? product.stockQuantity : product.preorderLimit;
  if (limit !== null && committed + requested > limit) {
    const remaining = Math.max(0, limit - committed);
    throw new OrderServiceError("PRODUCT_UNAVAILABLE", `${product.name} has only ${remaining} available. Please update your cart.`, 409);
  }
}

export async function createGuestOrder(input: unknown) {
  const parsed = guestOrderSchema.safeParse(input);
  if (!parsed.success) throw new OrderServiceError("INVALID_ORDER", "Please check the checkout details and try again.", 400);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const existing = await transaction.order.findUnique({ where: { checkoutToken: parsed.data.checkoutToken }, select: { id: true, orderNumber: true, publicAccessToken: true } });
        if (existing) {
          const publicAccessToken = existing.publicAccessToken ?? makePublicAccessToken();
          if (!existing.publicAccessToken) await transaction.order.update({ where: { id: existing.id }, data: { publicAccessToken } });
          return { orderNumber: existing.orderNumber, publicAccessToken, reused: true };
        }

        const productIds = parsed.data.items.map((item) => item.productId);
        await lockProductRows(transaction, productIds);
        const products = await transaction.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, priceTHB: true, stockStatus: true, active: true, stockQuantity: true, preorderLimit: true } });
        const byId = new Map(products.map((product) => [product.id, product]));
        if (products.length !== productIds.length) throw new OrderServiceError("PRODUCT_UNAVAILABLE", "One or more products are no longer available.", 409);
        const committed = await getCommittedQuantities(transaction, productIds);

        const lineItems = parsed.data.items.map((item) => {
          const product = byId.get(item.productId);
          if (!product || !product.active) throw new OrderServiceError("PRODUCT_UNAVAILABLE", "One or more products are no longer available.", 409);
          assertProductCapacity(product, item.quantity, committed.get(product.id) ?? 0);
          return { productId: product.id, productNameSnapshot: product.name, priceSnapshot: product.priceTHB, quantity: item.quantity, lineTotal: product.priceTHB * item.quantity };
        });
        const subtotal = lineItems.reduce((total, item) => total + item.lineTotal, 0);

        const order = await transaction.order.create({
          data: {
            orderNumber: makeOrderNumber(),
            checkoutToken: parsed.data.checkoutToken,
            publicAccessToken: makePublicAccessToken(),
            customerName: parsed.data.customerName,
            phone: parsed.data.phone,
            email: parsed.data.email,
            deliveryAddress: parsed.data.deliveryAddress,
            note: parsed.data.note,
            subtotal,
            totalTHB: subtotal,
            deliveryMethod: parsed.data.deliveryMethod,
            status: "PENDING",
            items: { create: lineItems },
          },
          select: { orderNumber: true, publicAccessToken: true },
        });
        return { orderNumber: order.orderNumber, publicAccessToken: order.publicAccessToken, reused: false };
      });
    } catch (error) {
      const serviceError = toOrderError(error);
      if (serviceError.code === "DATABASE_ERROR" && attempt < 2) continue;
      throw serviceError;
    }
  }

  throw new OrderServiceError("DATABASE_ERROR", "We could not complete the order. Please try again.", 500);
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
}

export function listOrders() {
  return prisma.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getOrderByNumberAndToken(orderNumber: string, publicAccessToken: string) {
  return prisma.order.findUnique({
    where: { orderNumber, publicAccessToken },
    select: {
      orderNumber: true,
      customerName: true,
      deliveryAddress: true,
      subtotal: true,
      totalTHB: true,
      deliveryMethod: true,
      status: true,
      createdAt: true,
      items: { select: { productNameSnapshot: true, priceSnapshot: true, quantity: true, lineTotal: true } },
    },
  });
}

export async function getAdminOrders() {
  return prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      email: true,
      subtotal: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      email: true,
      deliveryAddress: true,
      deliveryMethod: true,
      note: true,
      subtotal: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          priceSnapshot: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
}

export async function getOrderStatistics() {
  const [total, pending, confirmed, processing, completed, cancelled] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
  ]);
  return { total, pending, confirmed, processing, completed, cancelled };
}

export async function updateOrderStatus(id: string, input: unknown) {
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) throw new OrderServiceError("INVALID_STATUS", "Choose a valid order status.", 400);

  try {
    return await prisma.$transaction(async (transaction) => {
      const lockedOrder = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`);
      if (lockedOrder.length === 0) throw new OrderServiceError("ORDER_NOT_FOUND", "Order not found.", 404);

      const order = await transaction.order.findUnique({
        where: { id },
        select: { id: true, status: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!order) throw new OrderServiceError("ORDER_NOT_FOUND", "Order not found.", 404);

      const productIds = order.items.map((item) => item.productId);
      await lockProductRows(transaction, productIds);

      if (order.status === "CANCELLED" && parsed.data !== "CANCELLED") {
        const products = await transaction.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, active: true, stockStatus: true, stockQuantity: true, preorderLimit: true },
        });
        const byId = new Map(products.map((product) => [product.id, product]));
        const committed = await getCommittedQuantities(transaction, productIds);
        for (const item of order.items) {
          const product = byId.get(item.productId);
          if (!product || !product.active) throw new OrderServiceError("PRODUCT_UNAVAILABLE", "This cancelled order cannot be reopened because a product is no longer available.", 409);
          assertProductCapacity(product, item.quantity, committed.get(item.productId) ?? 0);
        }
      }

      return transaction.order.update({
        where: { id },
        data: { status: parsed.data },
        select: { id: true, orderNumber: true, status: true },
      });
    });
  } catch (error) {
    if (error instanceof OrderServiceError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new OrderServiceError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    throw new OrderServiceError("DATABASE_ERROR", "We could not update the order. Please try again.", 500);
  }
}
