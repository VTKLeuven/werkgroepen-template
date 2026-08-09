"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { updateTeamMemberOrder } from "@/lib/admin-actions";

type OrderedMember = {
  id: string;
  name: string;
  functionName: string;
  imageUrl: string | null;
};

export function TeamOrderBoard({
  academicYearId,
  members,
}: {
  academicYearId: string;
  members: OrderedMember[];
}) {
  const [items, setItems] = useState(members);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function moveDraggedItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    moveItem(draggedIndex, targetIndex);
  }

  function moveByOffset(memberId: string, offset: -1 | 1) {
    const currentIndex = items.findIndex((item) => item.id === memberId);
    const targetIndex = currentIndex + offset;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    moveItem(currentIndex, targetIndex);
  }

  function moveItem(currentIndex: number, targetIndex: number) {
    const next = [...items];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItems(next);
    setSaveError(false);

    startTransition(async () => {
      try {
        await updateTeamMemberOrder(
          academicYearId,
          next.map((item) => item.id),
        );
      } catch {
        setItems(items);
        setSaveError(true);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
        No members assigned to this academic year yet.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((member, index) => (
          <div
            key={member.id}
            draggable={!isPending}
            onDragStart={() => setDraggedId(member.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveDraggedItem(member.id)}
            onDragEnd={() => setDraggedId(null)}
            className="group cursor-grab rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-[#9b948a]">
                <GripVertical size={16} />
                Drag
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveByOffset(member.id, -1)}
                  disabled={index === 0 || isPending}
                  aria-label={`Move ${member.name} up`}
                  title="Move up"
                  className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-[#605a52] transition hover:border-[#006d77]/30 hover:bg-[#e9f4f3] hover:text-[#006d77] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveByOffset(member.id, 1)}
                  disabled={index === items.length - 1 || isPending}
                  aria-label={`Move ${member.name} down`}
                  title="Move down"
                  className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-[#605a52] transition hover:border-[#006d77]/30 hover:bg-[#e9f4f3] hover:text-[#006d77] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </span>
            </div>
            <div className="mx-auto mt-2 aspect-square w-full max-w-24 overflow-hidden rounded-2xl bg-[#f5f1e8]">
              {member.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-3xl font-semibold text-[#006d77]">
                  {member.name.slice(0, 1)}
                </div>
              )}
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold">{member.name}</h3>
            <p className="line-clamp-2 text-xs leading-5 text-[#6f6860]">
              {member.functionName}
            </p>
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
          ? "Saving order..."
          : "Drag a card or use its arrow buttons to change the public order."}
      </p>
    </div>
  );
}
