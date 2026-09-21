"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/site/icon";
import { establishOrderAccessAction } from "./actions";

type AccessState = "checking" | "denied";

function clearAccessFromUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}

export function OrderAccessGate({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [state, setState] = useState<AccessState>("checking");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fragmentToken = hashParams.get("access");
    const legacyToken = new URLSearchParams(window.location.search).get("token");
    const token = fragmentToken ?? legacyToken;

    if (!token) {
      queueMicrotask(() => setState("denied"));
      return;
    }

    clearAccessFromUrl();
    establishOrderAccessAction(orderNumber, token)
      .then((result) => {
        if (!result.ok) {
          setState("denied");
          return;
        }
        router.refresh();
      })
      .catch(() => setState("denied"));
  }, [orderNumber, router]);

  return <section className="confirmation-card" aria-live="polite">
    <span className="confirmation-mark"><Icon name={state === "checking" ? "box" : "arrow"} width={28} height={28} /></span>
    <p className="eyebrow">GearLab / Order confirmation</p>
    <h1>{state === "checking" ? "Opening your confirmation…" : "Confirmation unavailable."}</h1>
    <p className="confirmation-lead">{state === "checking" ? "Your secure order link is being verified." : "This order confirmation link is missing, invalid, or expired."}</p>
    {state === "denied" ? <a href="/shop" className="button button-primary">Continue shopping <Icon name="arrow" /></a> : null}
  </section>;
}
