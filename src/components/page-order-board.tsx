"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { updateCustomPageOrder } from "@/lib/admin-actions";

type OrderedPage = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  showInNavigation: boolean;
};

export function PageOrderBoard({ pages }: { pages: OrderedPage[] }) {
  const [items, setItems] = useState(pages);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: OrderedPage[]) {
    const previous = items;
    setItems(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateCustomPageOrder(next.map((page) => page.id));
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
    const [page] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, page);
    persist(next);
  }

  function dropOn(targetId: string) {
    if (!draggedId) return;
    move(
      items.findIndex((page) => page.id === draggedId),
      items.findIndex((page) => page.id === targetId),
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
        Add a page below to start building your page menu.
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((page, index) => (
          <div
            key={page.id}
            draggable={!isPending}
            onDragStart={() => setDraggedId(page.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(page.id)}
            onDragEnd={() => setDraggedId(null)}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
          >
            <GripVertical
              size={18}
              className="shrink-0 cursor-grab text-[#9b948a]"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{page.title}</p>
              <p className="truncate text-xs text-[#9b948a]">/pages/{page.slug}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                <span
                  className={
                    page.isPublished
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {page.isPublished ? "Published" : "Draft"}
                </span>
                {page.showInNavigation ? (
                  <span className="text-[#006d77]">Header</span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <MoveButton
                direction="up"
                label={`Move ${page.title} up`}
                disabled={index === 0 || isPending}
                onClick={() => move(index, index - 1)}
              />
              <MoveButton
                direction="down"
                label={`Move ${page.title} down`}
                disabled={index === items.length - 1 || isPending}
                onClick={() => move(index, index + 1)}
              />
            </div>
          </div>
        ))}
      </div>
      <p
        className={`mt-3 text-sm ${
          saveError ? "font-semibold text-red-700" : "text-[#6f6860]"
        }`}
        aria-live="polite"
      >
        {saveError
          ? "The page order could not be saved. Your previous order was restored."
          : isPending
            ? "Saving page order…"
            : "Drag a page or use the arrow buttons. Changes save automatically."}
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
