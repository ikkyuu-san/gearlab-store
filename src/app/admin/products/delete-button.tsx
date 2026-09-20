"use client";

import { useTransition } from "react";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  function handleDelete() {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    startTransition(() => deleteProductAction(id));
  }
  return <button className="admin-table-action admin-danger" type="button" onClick={handleDelete} disabled={pending}>{pending ? "Deleting…" : "Delete"}</button>;
}
