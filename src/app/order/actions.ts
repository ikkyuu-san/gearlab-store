"use server";

import { z } from "zod";
import { logger } from "@/lib/logger";
import { getOrderByNumberAndToken } from "@/server/orders";
import { isValidPublicAccessToken, setOrderAccessCookie } from "@/server/order-access";

const orderAccessSchema = z.object({
  orderNumber: z.string().regex(/^GL-[0-9]{8}-[A-F0-9]{4}$/),
  token: z.string().refine(isValidPublicAccessToken),
});

export async function establishOrderAccessAction(orderNumber: string, token: string) {
  const parsed = orderAccessSchema.safeParse({ orderNumber, token });
  if (!parsed.success) return { ok: false as const, error: "This order confirmation link is invalid or expired." };

  try {
    const order = await getOrderByNumberAndToken(parsed.data.orderNumber, parsed.data.token);
    if (!order) return { ok: false as const, error: "This order confirmation link is invalid or expired." };

    await setOrderAccessCookie(parsed.data.orderNumber, parsed.data.token);

    return { ok: true as const };
  } catch {
    logger.error("order.confirmation_access_failed", { code: "DATABASE_ERROR", route: "/order/[orderNumber]" });
    return { ok: false as const, error: "We could not open this order confirmation. Please try again." };
  }
}
