"use client";

import { useActionState } from "react";
import { updateOrderStatusAction, type OrderActionState } from "./actions";

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export function OrderStatusForm({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(updateOrderStatusAction.bind(null, id), {});
  return (
    <form className="admin-order-status-form" action={action}>
      <label htmlFor="order-status">Update status</label>
      <div className="admin-order-status-controls">
        <select id="order-status" name="status" defaultValue={currentStatus} disabled={pending}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save status"}</button>
      </div>
      {state.error ? <p className="admin-error" role="alert">{state.error}</p> : null}
    </form>
  );
}
