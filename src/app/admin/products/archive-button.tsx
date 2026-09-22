"use client";

import { useTransition } from "react";
import { archiveProductAction, unarchiveProductAction } from "./actions";

export function ArchiveProductButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      if (active) void archiveProductAction(id);
      else void unarchiveProductAction(id);
    });
  }

  return <button className="admin-table-action" type="button" onClick={handleToggle} disabled={pending}>
    {pending ? "Saving…" : active ? "Archive" : "Unarchive"}
  </button>;
}
