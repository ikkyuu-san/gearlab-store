"use server";

import { headers } from "next/headers";
import { createGuestOrder, OrderServiceError } from "@/server/orders";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { setOrderAccessCookie } from "@/server/order-access";

export type GuestCheckoutPayload = {
  checkoutToken: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  deliveryMethod: "STANDARD";
  note: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type GuestCheckoutResult = { orderNumber: string } | { error: string };

export async function createGuestOrderAction(payload: GuestCheckoutPayload): Promise<GuestCheckoutResult> {
  try {
    const requestHeaders = await headers();
    const rateLimit = await enforceRateLimit("checkout", getClientIp(requestHeaders));
    if (!rateLimit.allowed) return { error: "Please wait a moment before trying again." };
    const order = await createGuestOrder(payload);
    if (!order.publicAccessToken) {
      logger.error("checkout.order_access_token_missing", { code: "ORDER_ACCESS_TOKEN_MISSING", route: "/checkout" });
      return { error: "We could not prepare your order confirmation. Please try again." };
    }
    await setOrderAccessCookie(order.orderNumber, order.publicAccessToken);
    return { orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    logger.error("checkout.order_creation_failed", { code: "UNEXPECTED_ERROR", route: "/checkout" });
    return { error: "We could not complete the order. Please try again." };
  }
}
