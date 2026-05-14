import Link from "next/link";
import { AdminShell, Panel } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [team, events, partners] = await Promise.all([
    prisma.teamMember.count(),
    prisma.event.count(),
    prisma.partner.count(),
  ]);

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-5 lg:grid-cols-3">
        <Metric label="Team members" value={team} href="/admin/team" />
        <Metric label="Events" value={events} href="/admin/events" />
        <Metric label="Partners" value={partners} href="/admin/partners" />
      </div>
      <div className="mt-6">
        <Panel
          title="Content workflow"
          description="Start with settings and colors, then add the people, events, and partner logos that make this subdivision recognizable."
        >
          <Link
            href="/"
            className="inline-flex rounded-full bg-[#211f1c] px-5 py-2.5 text-sm font-semibold text-white"
          >
            View public site
          </Link>
        </Panel>
      </div>
    </AdminShell>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <p className="text-sm font-semibold text-[#6f6860]">{label}</p>
      <p className="mt-3 text-5xl font-semibold">{value}</p>
    </Link>
  );
}
