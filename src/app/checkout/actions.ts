"use server";

import { headers } from "next/headers";
import { createGuestOrder, OrderServiceError } from "@/server/orders";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export type GuestCheckoutPayload = {
  checkoutToken: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  note: string;
  items: Array<{ productId: string; quantity: number }>;
};

export async function createGuestOrderAction(payload: GuestCheckoutPayload) {
  try {
    const requestHeaders = await headers();
    const rateLimit = await enforceRateLimit("checkout", getClientIp(requestHeaders));
    if (!rateLimit.allowed) return { error: "Please wait a moment before trying again." };
    return await createGuestOrder(payload);
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    return { error: "We could not complete the order. Please try again." };
  }
}
