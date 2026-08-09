"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { updatePartnerOrder } from "@/lib/admin-actions";

type OrderedPartner = {
  id: string;
  name: string;
  logoUrl: string | null;
  isVisible: boolean;
};

export function PartnerOrderBoard({ partners }: { partners: OrderedPartner[] }) {
  const [items, setItems] = useState(partners);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: OrderedPartner[]) {
    const previous = items;
    setItems(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updatePartnerOrder(next.map((partner) => partner.id));
      } catch {
        setItems(previous);
        setSaveError(true);
      }
    });
  }

  function move(currentIndex: number, targetIndex: number) {
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      currentIndex >= items.length ||
      targetIndex >= items.length ||
      currentIndex === targetIndex
    ) {
      return;
    }

    const next = [...items];
    const [partner] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, partner);
    persist(next);
  }

  function dropOn(targetId: string) {
    if (!draggedId) return;
    move(
      items.findIndex((partner) => partner.id === draggedId),
      items.findIndex((partner) => partner.id === targetId),
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
        Add a partner below to start building this section.
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((partner, index) => (
          <div
            key={partner.id}
            draggable={!isPending}
            onDragStart={() => setDraggedId(partner.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(partner.id)}
            onDragEnd={() => setDraggedId(null)}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
          >
            <GripVertical
              size={18}
              className="shrink-0 cursor-grab text-[#9b948a]"
              aria-hidden="true"
            />
            <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5f1e8] p-1 text-center text-[9px] font-semibold">
              {partner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.logoUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                partner.name
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{partner.name}</p>
              <p className="text-xs text-[#9b948a]">
                {partner.isVisible ? "Visible" : "Hidden"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <MoveButton
                direction="up"
                label={`Move ${partner.name} up`}
                disabled={index === 0 || isPending}
                onClick={() => move(index, index - 1)}
              />
              <MoveButton
                direction="down"
                label={`Move ${partner.name} down`}
                disabled={index === items.length - 1 || isPending}
                onClick={() => move(index, index + 1)}
              />
            </div>
          </div>
        ))}
      </div>
      <p
        className={`mt-3 text-sm ${saveError ? "font-semibold text-red-700" : "text-[#6f6860]"}`}
        aria-live="polite"
      >
        {saveError
          ? "The order could not be saved. Your previous order was restored."
          : isPending
          ? "Saving partner order…"
          : "Drag a partner or use the arrow buttons. Changes save automatically."}
      </p>
    </div>
  );
}

function MoveButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      aria-label={label}
      title={direction === "up" ? "Move up" : "Move down"}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-[#605a52] transition hover:border-[#006d77]/30 hover:bg-[#e9f4f3] hover:text-[#006d77] disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon size={15} />
    </button>
  );
}
