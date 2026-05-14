import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/admin-actions";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/partners", label: "Partners" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#211f1c]">
      <header className="border-b border-black/10 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#006d77]">
              Admin
            </p>
            <h1 className="text-2xl font-semibold">{title}</h1>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#211f1c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#605a52] transition hover:bg-white hover:text-[#211f1c]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <section>{children}</section>
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
