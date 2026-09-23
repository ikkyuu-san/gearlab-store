"use client";

import { useActionState } from "react";
import { updateOrderPaymentStatusAction, type OrderActionState } from "./actions";

export function OrderPaymentStatusForm({ id, currentStatus }: { id: string; currentStatus: "UNPAID" | "PAID" }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(updateOrderPaymentStatusAction.bind(null, id), {});

  return (
    <form className="admin-order-status-form" action={action}>
      <label htmlFor="payment-status">Payment state</label>
      <div className="admin-order-status-controls">
        <select id="payment-status" name="paymentStatus" defaultValue={currentStatus} disabled={pending}>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save payment state"}</button>
      </div>
      {state.error ? <p className="admin-error" role="alert">{state.error}</p> : null}
      <p className="admin-form-hint">Manual record only. No payment or banking details are stored.</p>
    </form>
  );
}
