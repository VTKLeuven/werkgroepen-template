"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Files,
  Handshake,
  House,
  Images,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings", label: "General", icon: Settings },
  { href: "/admin/homepage", label: "Homepage", icon: House },
  { href: "/admin/header", label: "Header", icon: Menu },
  { href: "/admin/pages", label: "Pages", icon: Files },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/photos", label: "Photos", icon: Images },
  { href: "/admin/partners", label: "Partners", icon: Handshake },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:flex ${
              isActive
                ? "bg-white text-[#211f1c] shadow-sm ring-1 ring-black/5"
                : "text-[#605a52] hover:bg-white/70 hover:text-[#211f1c]"
            }`}
          >
            <Icon
              size={16}
              className={isActive ? "text-[#006d77]" : "text-[#8b8379]"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
