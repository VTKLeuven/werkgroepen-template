import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { logoutAction } from "@/lib/admin-actions";

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#211f1c]">
      <div className="mx-auto grid max-w-[1800px] gap-5 px-4 py-4 sm:px-8 lg:grid-cols-[9.5rem_minmax(0,1fr)] lg:py-6">
        <aside className="flex min-w-0 flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <AdminNav />
          <div className="mt-3 flex gap-2 border-t border-black/10 pt-3 lg:mt-auto lg:grid">
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#006d77] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#005d66] hover:shadow-md"
            >
              <ExternalLink size={15} />
              View website
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-[#3a352f] transition hover:border-black/20 hover:bg-[#faf8f3]">
                <LogOut size={15} />
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6f6860]">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[#6f6860]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  composite = false,
}: {
  label: string;
  children: React.ReactNode;
  composite?: boolean;
}) {
  if (composite) {
    return (
      <div className="grid min-w-0 gap-2 text-sm font-semibold text-[#3a352f]">
        <span>{label}</span>
        {children}
      </div>
    );
  }

  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#3a352f]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20";

export const textareaClass =
  "min-h-32 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-[#006d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg";
