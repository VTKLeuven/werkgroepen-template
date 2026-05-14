"use client";

import { useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();

  function move(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const next = [...items];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    setItems(next);

    startTransition(async () => {
      await updateTeamMemberOrder(
        academicYearId,
        next.map((item) => item.id),
      );
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
        {items.map((member) => (
          <div
            key={member.id}
            draggable
            onDragStart={() => setDraggedId(member.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => move(member.id)}
            onDragEnd={() => setDraggedId(null)}
            className="group cursor-grab rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-2">
              <GripVertical size={16} className="text-[#9b948a]" />
              <span className="text-xs font-semibold text-[#9b948a]">Drag</span>
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
      <p className="mt-3 text-sm text-[#6f6860]">
        {isPending ? "Saving order..." : "Drag a card to change the public order."}
      </p>
    </div>
  );
}
