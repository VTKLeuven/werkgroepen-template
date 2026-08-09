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
      <header className="border-b border-black/10 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#006d77]">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6f6860]">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#005d66] hover:shadow-md"
            >
              <ExternalLink size={16} />
              View website
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#3a352f] transition hover:border-black/20 hover:bg-[#faf8f3]">
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0">
          <AdminNav />
        </aside>
        <section className="min-w-0">{children}</section>
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#3a352f]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20";

export const textareaClass =
  "min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-[#006d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg";
