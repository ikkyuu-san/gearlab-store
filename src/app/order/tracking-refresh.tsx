"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshOrderStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="tracking-refresh"
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing…" : "Refresh status"}
    </button>
  );
}
