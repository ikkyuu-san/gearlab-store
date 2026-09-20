"use client";

export default function AdminOrdersError({ reset }: { reset: () => void }) {
  return (
    <section className="admin-panel admin-empty">
      <p className="eyebrow">Orders unavailable</p>
      <h2>We couldn’t load orders right now.</h2>
      <p>Please try again. Your order data has not been changed.</p>
      <button className="button button-secondary" type="button" onClick={reset}>Try again</button>
    </section>
  );
}
