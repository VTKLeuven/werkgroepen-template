"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Menu,
} from "lucide-react";
import { updateNavigation } from "@/lib/admin-actions";

export type EditableSection = {
  type: "section";
  key: "about" | "team" | "events" | "contact" | "partners";
  sortOrder: number;
  isVisible: boolean;
  showInNavigation: boolean;
};

export type EditableCustomPageNavigation = {
  type: "page";
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  isPublished: boolean;
  showInNavigation: boolean;
};

export type EditableNavigationItem =
  | EditableSection
  | EditableCustomPageNavigation;

const sectionText: Record<
  EditableSection["key"],
  { title: string; description: string }
> = {
  about: { title: "About", description: "Your introduction and story" },
  team: { title: "Team", description: "Current academic-year team" },
  events: { title: "Events", description: "Upcoming and previous events" },
  contact: { title: "Contact", description: "Email and social links" },
  partners: { title: "Partners", description: "Partner logos and links" },
};

function itemId(item: EditableNavigationItem) {
  return item.type === "section" ? `section:${item.key}` : `page:${item.id}`;
}

export function NavigationOrderBoard({
  items: initialItems,
}: {
  items: EditableNavigationItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: EditableNavigationItem[]) {
    const previous = items;
    setItems(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateNavigation(
          next.map((item) =>
            item.type === "section"
              ? {
                  type: item.type,
                  key: item.key,
                  isVisible: item.isVisible,
                  showInNavigation: item.showInNavigation,
                }
              : {
                  type: item.type,
                  id: item.id,
                  showInNavigation: item.showInNavigation,
                },
          ),
        );
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
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);
    persist(next);
  }

  function updateItem(
    id: string,
    changes: Partial<Pick<EditableNavigationItem, "showInNavigation">> & {
      isVisible?: boolean;
    },
  ) {
    persist(
      items.map((item) => {
        if (itemId(item) !== id) return item;
        if (item.type === "page") {
          return { ...item, showInNavigation: Boolean(changes.showInNavigation) };
        }

        const next = { ...item, ...changes };
        if (!next.isVisible) next.showInNavigation = false;
        return next;
      }),
    );
  }

  return (
    <div data-auto-save>
      <div className="grid gap-2">
        {items.map((item, index) => {
          const id = itemId(item);
          const isSection = item.type === "section";
          const title = isSection ? sectionText[item.key].title : item.title;
          const description = isSection
            ? sectionText[item.key].description
            : `/pages/${item.slug}`;
          const isAvailable = isSection ? item.isVisible : item.isPublished;

          return (
            <div
              key={id}
              draggable={!isPending}
              onDragStart={() => setDraggedId(id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggedId) return;
                move(
                  items.findIndex((candidate) => itemId(candidate) === draggedId),
                  index,
                );
              }}
              onDragEnd={() => setDraggedId(null)}
              className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
                isAvailable
                  ? "border-black/10 bg-white"
                  : "border-black/5 bg-[#f5f1e8] text-[#777067]"
              }`}
            >
              <span className="hidden cursor-grab text-[#9b948a] sm:block">
                <GripVertical size={18} />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {isSection ? (
                    item.isVisible ? <Eye size={15} /> : <EyeOff size={15} />
                  ) : (
                    <FileText size={15} />
                  )}
                  <span className="truncate">{title}</span>
                  {!isSection ? (
                    <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#777067]">
                      {item.isPublished ? "Page" : "Draft page"}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#8b847b]">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isSection ? (
                  <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={item.isVisible}
                      disabled={isPending}
                      onChange={(event) =>
                        updateItem(id, { isVisible: event.target.checked })
                      }
                      className="h-4 w-4 accent-[#006d77]"
                    />
                    Show
                  </label>
                ) : null}
                <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={item.showInNavigation}
                    disabled={(isSection && !item.isVisible) || isPending}
                    onChange={(event) =>
                      updateItem(id, {
                        showInNavigation: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#006d77]"
                  />
                  <Menu size={13} />
                  Header
                </label>
                <MoveButton
                  direction="up"
                  label={`Move ${title} up`}
                  disabled={index === 0 || isPending}
                  onClick={() => move(index, index - 1)}
                />
                <MoveButton
                  direction="down"
                  label={`Move ${title} down`}
                  disabled={index === items.length - 1 || isPending}
                  onClick={() => move(index, index + 1)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p
        className={`mt-3 text-sm ${
          saveError ? "font-semibold text-red-700" : "text-[#6f6860]"
        }`}
        aria-live="polite"
      >
        {saveError
          ? "The page and header order could not be saved. Your previous setup was restored."
          : isPending
            ? "Saving page and header order…"
            : "Homepage visibility, header placement, and the global order save automatically."}
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
      disabled={disabled}
      aria-label={label}
      title={direction === "up" ? "Move up" : "Move down"}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-[#605a52] transition hover:border-[#006d77]/30 hover:text-[#006d77] disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon size={14} />
    </button>
  );
}
