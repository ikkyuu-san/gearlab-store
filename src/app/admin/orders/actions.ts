"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { OrderServiceError, updateOrderPaymentStatus, updateOrderStatus } from "@/server/orders";

export type OrderActionState = { error?: string };

export async function updateOrderStatusAction(id: string, _state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  try {
    const order = await updateOrderStatus(id, formData.get("status"));
    revalidatePath(`/order/${encodeURIComponent(order.orderNumber)}`);
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    return { error: "We could not update the order. Please try again." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/");
  revalidatePath("/shop");
  redirect(`/admin/orders/${id}?notice=status-updated`);
}

export async function updateOrderPaymentStatusAction(id: string, _state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  try {
    await updateOrderPaymentStatus(id, formData.get("paymentStatus"));
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    return { error: "We could not update the payment status. Please try again." };
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?notice=payment-updated`);
}
