"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin-auth";
import { OrderServiceError, updateOrderStatus } from "@/server/orders";

export type OrderActionState = { error?: string };

export async function updateOrderStatusAction(id: string, _state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  try {
    await updateOrderStatus(id, formData.get("status"));
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    return { error: "We could not update the order. Please try again." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/");
  revalidatePath("/shop");
  redirect(`/admin/orders/${id}?status=updated`);
}
