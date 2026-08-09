"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({ itemName }: { itemName: string }) {
  return (
    <button
      onClick={(event) => {
        if (!window.confirm(`Delete ${itemName}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
      className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
    >
      <Trash2 size={15} />
      Delete
    </button>
  );
}
