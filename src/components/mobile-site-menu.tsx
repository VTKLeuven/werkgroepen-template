"use client";

import { Menu } from "lucide-react";
import { useRef } from "react";

export function MobileSiteMenu({ children }: { children: React.ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detailsRef} className="group relative shrink-0 md:hidden">
      <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-black/10 bg-[var(--background)] text-[var(--muted)] [&::-webkit-details-marker]:hidden">
        <Menu size={18} />
        <span className="sr-only">Open navigation</span>
      </summary>
      <div
        className="site-text-sm absolute right-0 top-[calc(100%+0.75rem)] flex max-h-[70vh] min-w-52 flex-col gap-3 overflow-y-auto rounded-2xl border border-black/10 bg-[var(--header)] p-4 font-semibold text-[var(--muted)] shadow-xl"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            detailsRef.current?.removeAttribute("open");
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
