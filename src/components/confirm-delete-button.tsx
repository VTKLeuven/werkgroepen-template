"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  itemName,
  /** Icon only, for use inside a photo tile where there is no room for a label. */
  compact = false,
}: {
  itemName: string;
  compact?: boolean;
}) {
  const confirm = (event: React.MouseEvent) => {
    if (!window.confirm(`Delete ${itemName}? This cannot be undone.`)) {
      event.preventDefault();
    }
  };

  if (compact) {
    return (
      <button
        onClick={confirm}
        title={`Delete ${itemName}`}
        aria-label={`Delete ${itemName}`}
        className="grid h-7 w-7 place-items-center rounded-full text-white transition hover:bg-red-500/80"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <button
      onClick={confirm}
      className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
    >
      <Trash2 size={15} />
      Delete
    </button>
  );
}
