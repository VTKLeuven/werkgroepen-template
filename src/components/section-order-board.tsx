"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Menu,
} from "lucide-react";
import { updateSiteSections } from "@/lib/admin-actions";

export type EditableSection = {
  key: "about" | "team" | "events" | "contact" | "partners";
  isVisible: boolean;
  showInNavigation: boolean;
};

const sectionText: Record<
  EditableSection["key"],
  { title: string; description: string }
> = {
  about: {
    title: "About",
    description: "Your introduction and story",
  },
  team: {
    title: "Team",
    description: "Current academic-year team",
  },
  events: {
    title: "Events",
    description: "Upcoming and previous events",
  },
  contact: {
    title: "Contact",
    description: "Email and social links",
  },
  partners: {
    title: "Partners",
    description: "Partner logos and links",
  },
};

export function SectionOrderBoard({ sections }: { sections: EditableSection[] }) {
  const [items, setItems] = useState(sections);
  const [draggedKey, setDraggedKey] = useState<EditableSection["key"] | null>(
    null,
  );
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(next: EditableSection[]) {
    const previous = items;
    setItems(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateSiteSections(next);
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
    const [section] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, section);
    persist(next);
  }

  function update(
    key: EditableSection["key"],
    changes: Partial<EditableSection>,
  ) {
    persist(
      items.map((section) => {
        if (section.key !== key) return section;
        const next = { ...section, ...changes };
        if (!next.isVisible) next.showInNavigation = false;
        return next;
      }),
    );
  }

  return (
    <div data-auto-save>
      <div className="grid gap-2">
        {items.map((section, index) => {
          const text = sectionText[section.key];
          return (
            <div
              key={section.key}
              draggable={!isPending}
              onDragStart={() => setDraggedKey(section.key)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggedKey) return;
                move(
                  items.findIndex((item) => item.key === draggedKey),
                  index,
                );
              }}
              onDragEnd={() => setDraggedKey(null)}
              className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                section.isVisible
                  ? "border-black/10 bg-white"
                  : "border-black/5 bg-[#f5f1e8] text-[#777067]"
              }`}
            >
              <span className="hidden cursor-grab text-[#9b948a] sm:block">
                <GripVertical size={18} />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {section.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                  {text.title}
                </p>
                <p className="mt-0.5 text-xs text-[#8b847b]">{text.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={section.isVisible}
                    disabled={isPending}
                    onChange={(event) =>
                      update(section.key, { isVisible: event.target.checked })
                    }
                    className="h-4 w-4 accent-[#006d77]"
                  />
                  Show
                </label>
                <label className="flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={section.showInNavigation}
                    disabled={!section.isVisible || isPending}
                    onChange={(event) =>
                      update(section.key, {
                        showInNavigation: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#006d77]"
                  />
                  <Menu size={13} />
                  Menu
                </label>
                <MoveButton
                  direction="up"
                  label={`Move ${text.title} up`}
                  disabled={index === 0 || isPending}
                  onClick={() => move(index, index - 1)}
                />
                <MoveButton
                  direction="down"
                  label={`Move ${text.title} down`}
                  disabled={index === items.length - 1 || isPending}
                  onClick={() => move(index, index + 1)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p
        className={`mt-3 text-sm ${saveError ? "font-semibold text-red-700" : "text-[#6f6860]"}`}
        aria-live="polite"
      >
        {saveError
          ? "The page structure could not be saved. Your previous setup was restored."
          : isPending
          ? "Saving page structure…"
          : "Visibility, menu placement, and order save automatically."}
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
