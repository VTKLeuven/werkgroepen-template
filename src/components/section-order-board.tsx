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
import {
  updateHeaderNavigation,
  updateHomepageSections,
} from "@/lib/admin-actions";

export type EditableSection = {
  type: "section";
  key: "about" | "team" | "events" | "contact" | "partners" | "photos";
  sortOrder: number;
  homepageOrder: number;
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
  photos: {
    title: "Photos",
    description: "Photo albums, on their own page at /photos",
  },
};

function itemId(item: EditableNavigationItem) {
  return item.type === "section" ? `section:${item.key}` : `page:${item.id}`;
}

function moveItem<T>(items: T[], currentIndex: number, targetIndex: number) {
  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    currentIndex >= items.length ||
    targetIndex >= items.length ||
    currentIndex === targetIndex
  ) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(currentIndex, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function HomepageOrderBoard({
  items: initialItems,
  onItemsChange,
}: {
  items: EditableSection[];
  onItemsChange?: (items: EditableSection[]) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: EditableSection[]) {
    const previous = items;
    setItems(next);
    onItemsChange?.(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateHomepageSections(
          next.map((item) => ({ key: item.key, isVisible: item.isVisible })),
        );
      } catch {
        setItems(previous);
        onItemsChange?.(previous);
        setSaveError(true);
      }
    });
  }

  function move(currentIndex: number, targetIndex: number) {
    persist(moveItem(items, currentIndex, targetIndex));
  }

  return (
    <div data-auto-save>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <OrderRow
            key={item.key}
            title={sectionText[item.key].title}
            description={sectionText[item.key].description}
            icon={item.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
            muted={!item.isVisible}
            draggable={!isPending}
            onDragStart={() => setDraggedKey(item.key)}
            onDrop={() => {
              if (!draggedKey) return;
              move(
                items.findIndex((candidate) => candidate.key === draggedKey),
                index,
              );
            }}
            onDragEnd={() => setDraggedKey(null)}
            controls={
              <>
                <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={item.isVisible}
                    disabled={isPending}
                    onChange={(event) =>
                      persist(
                        items.map((candidate) =>
                          candidate.key === item.key
                            ? { ...candidate, isVisible: event.target.checked }
                            : candidate,
                        ),
                      )
                    }
                    className="h-4 w-4 accent-[#006d77]"
                  />
                  Show
                </label>
                <MoveButtons
                  title={sectionText[item.key].title}
                  index={index}
                  count={items.length}
                  pending={isPending}
                  onMove={move}
                />
              </>
            }
          />
        ))}
      </div>
      <SaveStatus
        error={saveError}
        pending={isPending}
        errorText="The homepage order could not be saved. Your previous setup was restored."
        savedText="Homepage visibility and order save automatically."
      />
    </div>
  );
}

export function HeaderNavigationBoard({
  items: initialItems,
  onItemsChange,
}: {
  items: EditableNavigationItem[];
  onItemsChange?: (items: EditableNavigationItem[]) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: EditableNavigationItem[]) {
    const previous = items;
    setItems(next);
    onItemsChange?.(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateHeaderNavigation(
          next.map((item) =>
            item.type === "section"
              ? {
                  type: item.type,
                  key: item.key,
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
        onItemsChange?.(previous);
        setSaveError(true);
      }
    });
  }

  function move(currentIndex: number, targetIndex: number) {
    persist(moveItem(items, currentIndex, targetIndex));
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
          const available = isSection ? item.isVisible : item.isPublished;

          return (
            <OrderRow
              key={id}
              title={title}
              description={description}
              icon={isSection ? <Menu size={15} /> : <FileText size={15} />}
              badge={!isSection ? (item.isPublished ? "Page" : "Draft") : undefined}
              muted={!available}
              draggable={!isPending}
              onDragStart={() => setDraggedId(id)}
              onDrop={() => {
                if (!draggedId) return;
                move(
                  items.findIndex((candidate) => itemId(candidate) === draggedId),
                  index,
                );
              }}
              onDragEnd={() => setDraggedId(null)}
              controls={
                <>
                  <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={item.showInNavigation}
                      disabled={!available || isPending}
                      onChange={(event) =>
                        persist(
                          items.map((candidate) =>
                            itemId(candidate) === id
                              ? {
                                  ...candidate,
                                  showInNavigation: event.target.checked,
                                }
                              : candidate,
                          ),
                        )
                      }
                      className="h-4 w-4 accent-[#006d77]"
                    />
                    Header
                  </label>
                  <MoveButtons
                    title={title}
                    index={index}
                    count={items.length}
                    pending={isPending}
                    onMove={move}
                  />
                </>
              }
            />
          );
        })}
      </div>
      <SaveStatus
        error={saveError}
        pending={isPending}
        errorText="The header order could not be saved. Your previous setup was restored."
        savedText="Header visibility and order save automatically."
      />
    </div>
  );
}

function OrderRow({
  title,
  description,
  icon,
  badge,
  muted,
  draggable,
  onDragStart,
  onDrop,
  onDragEnd,
  controls,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  muted: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  controls: React.ReactNode;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
        muted
          ? "border-black/5 bg-[#f5f1e8] text-[#777067]"
          : "border-black/10 bg-white"
      }`}
    >
      <span className="hidden cursor-grab text-[#9b948a] sm:block">
        <GripVertical size={18} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span className="truncate">{title}</span>
          {badge ? (
            <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#777067]">
              {badge}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-[#8b847b]">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{controls}</div>
    </div>
  );
}

function MoveButtons({
  title,
  index,
  count,
  pending,
  onMove,
}: {
  title: string;
  index: number;
  count: number;
  pending: boolean;
  onMove: (currentIndex: number, targetIndex: number) => void;
}) {
  return (
    <>
      <MoveButton
        direction="up"
        label={`Move ${title} up`}
        disabled={index === 0 || pending}
        onClick={() => onMove(index, index - 1)}
      />
      <MoveButton
        direction="down"
        label={`Move ${title} down`}
        disabled={index === count - 1 || pending}
        onClick={() => onMove(index, index + 1)}
      />
    </>
  );
}

function SaveStatus({
  error,
  pending,
  errorText,
  savedText,
}: {
  error: boolean;
  pending: boolean;
  errorText: string;
  savedText: string;
}) {
  return (
    <p
      className={`mt-3 text-sm ${
        error ? "font-semibold text-red-700" : "text-[#6f6860]"
      }`}
      aria-live="polite"
    >
      {error ? errorText : pending ? "Saving…" : savedText}
    </p>
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
