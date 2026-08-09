"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check, ExternalLink, X } from "lucide-react";

export function PageSaveConfirmation({
  title,
  summary,
  publicHref,
}: {
  title: string;
  summary: string;
  publicHref: string | null;
}) {
  const router = useRouter();

  function close() {
    router.replace("/admin/pages", { scroll: false });
  }

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.replace("/admin/pages", { scroll: false });
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-save-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl shadow-black/25">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={22} strokeWidth={2.5} />
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close confirmation"
            className="grid h-9 w-9 place-items-center rounded-full text-[#6f6860] transition hover:bg-black/5 hover:text-[#231f20]"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="page-save-title" className="mt-5 text-xl font-semibold">
          Page saved
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6860]">
          <strong className="text-[#231f20]">{title}</strong> now uses {summary}.
          The values shown here were read back from the database.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {publicHref ? (
            <Link
              href={publicHref}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[#006d77]"
            >
              View page
              <ExternalLink size={15} />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-[#211f1c] px-5 py-2 text-sm font-semibold text-white"
          >
            Continue editing
          </button>
        </div>
      </div>
    </div>
  );
}
