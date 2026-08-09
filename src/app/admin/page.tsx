import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Languages,
  Palette,
  Users,
} from "lucide-react";
import { AdminShell, Panel } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [team, events, partners, settings, currentYear, visibleSections] =
    await Promise.all([
      prisma.teamMember.count(),
      prisma.event.count(),
      prisma.partner.count(),
      prisma.siteSettings.findUnique({ where: { id: "site" } }),
      prisma.academicYear.findFirst({ where: { isCurrent: true } }),
      prisma.siteSection.count({ where: { isVisible: true } }),
    ]);

  const languageLabel =
    settings?.languageMode === "englishOnly"
      ? "English"
      : settings?.languageMode === "dutchOnly"
        ? "Dutch"
        : "English + Dutch";

  return (
    <AdminShell
      title="Dashboard"
      description="A clear overview of your public website and the content you can edit."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Metric
          label="Team members"
          value={team}
          detail={currentYear ? `Current team: ${currentYear.label}` : "No current year"}
          href="/admin/team"
        />
        <Metric
          label="Events"
          value={events}
          detail="Published and draft events"
          href="/admin/events"
        />
        <Metric
          label="Partners"
          value={partners}
          detail="Visible and hidden partners"
          href="/admin/partners"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="Continue editing"
          description="Go straight to the most common website tasks."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink
              href="/admin/settings"
              title="Customize website"
              description="Brand, hero, colors, type and page sections"
              icon={Palette}
            />
            <QuickLink
              href="/admin/events"
              title="Manage events"
              description="Add an event or update a published page"
              icon={CalendarDays}
            />
            <QuickLink
              href="/admin/team"
              title="Update the team"
              description="People, academic years and public order"
              icon={Users}
            />
          </div>
        </Panel>

        <Panel title="Website setup">
          <dl className="grid gap-4 text-sm">
            <StatusRow
              icon={Languages}
              label="Public language"
              value={languageLabel}
            />
            <StatusRow
              icon={Palette}
              label="Header logo"
              value={
                settings?.logoMode === "wordmark"
                  ? "Full-width logo"
                  : "Square icon + text"
              }
            />
            <StatusRow
              icon={ArrowRight}
              label="Homepage sections"
              value={`${visibleSections} visible`}
            />
          </dl>
        </Panel>
      </div>
    </AdminShell>
  );
}

function Metric({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#6f6860]">{label}</p>
          <p className="mt-3 text-5xl font-semibold">{value}</p>
          <p className="mt-3 text-xs text-[#9b948a]">{detail}</p>
        </div>
        <ArrowRight
          size={19}
          className="text-[#9b948a] transition group-hover:translate-x-1 group-hover:text-[#006d77]"
        />
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Palette;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-black/10 p-4 transition hover:border-[#006d77]/30 hover:bg-[#e9f4f3]/55"
    >
      <Icon size={20} className="text-[#006d77]" />
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#6f6860]">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#006d77]">
        Open
        <ArrowRight size={13} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Palette;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f1e8] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#006d77] shadow-sm">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-[#6f6860]">{label}</dt>
        <dd className="truncate font-semibold">{value}</dd>
      </div>
    </div>
  );
}
