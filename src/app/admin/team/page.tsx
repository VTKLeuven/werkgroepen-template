import Link from "next/link";
import { CheckCircle2, Trash2, UserPlus } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
} from "@/components/admin-shell";
import { TeamOrderBoard } from "@/components/team-order-board";
import {
  deleteTeamMember,
  saveAcademicYear,
  saveTeamMember,
  setCurrentAcademicYear,
} from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const years = await prisma.academicYear.findMany({
    orderBy: [{ sortOrder: "desc" }, { label: "desc" }],
  });
  const selectedYear =
    years.find((year) => year.id === params.year) ??
    years.find((year) => year.isCurrent) ??
    years[0] ??
    null;
  const [members, selectedMemberships] = await Promise.all([
    prisma.teamMember.findMany({
      include: {
        imageMedia: true,
        academicYears: { include: { academicYear: true } },
      },
      orderBy: [{ name: "asc" }],
    }),
    selectedYear
      ? prisma.teamMemberYear.findMany({
          where: { academicYearId: selectedYear.id },
          include: { teamMember: { include: { imageMedia: true } } },
          orderBy: [{ sortOrder: "asc" }, { teamMember: { name: "asc" } }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <AdminShell title="Team">
      <div className="grid gap-6">
        <Panel
          title="Academic years"
          description="Only the year marked as current is shown on the public website. Older years stay available as an archive."
        >
          <div className="mb-5 flex flex-wrap gap-2">
            {years.map((year) => (
              <Link
                key={year.id}
                href={`/admin/team?year=${year.id}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedYear?.id === year.id
                    ? "bg-[#006d77] text-white"
                    : "bg-[#f5f1e8] text-[#3a352f]"
                }`}
              >
                {year.label}
                {year.isCurrent ? <CheckCircle2 size={15} /> : null}
              </Link>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <form action={saveAcademicYear} className="grid gap-3 sm:grid-cols-2">
              <Field label="New academic year">
                <input
                  name="label"
                  placeholder="2026-2027"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Sort order">
                <input
                  name="sortOrder"
                  type="number"
                  placeholder="2026"
                  className={inputClass}
                />
              </Field>
              <button className={`${buttonClass} w-fit sm:col-span-2`}>
                Add academic year
              </button>
            </form>
            {selectedYear ? (
              <form action={setCurrentAcademicYear} className="self-end">
                <input type="hidden" name="id" value={selectedYear.id} />
                <button className="rounded-full bg-[#211f1c] px-5 py-2.5 text-sm font-semibold text-white">
                  Make {selectedYear.label} current
                </button>
              </form>
            ) : null}
          </div>
        </Panel>

        {selectedYear ? (
          <Panel
            title={`Public layout for ${selectedYear.label}`}
            description="This mirrors the compact team grid on the website. Drag cards to change the order for this academic year."
          >
            <TeamOrderBoard
              academicYearId={selectedYear.id}
              members={selectedMemberships.map(({ teamMember }) => ({
                id: teamMember.id,
                name: teamMember.name,
                functionName: teamMember.functionNameEn || teamMember.functionName,
                imageUrl: mediaUrl(teamMember.imageMediaId),
              }))}
            />
          </Panel>
        ) : null}

        <Panel title="Add team member">
          <details className="rounded-2xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Add a new person
            </summary>
            <div className="mt-4">
              <TeamForm years={years} selectedYearId={selectedYear?.id} />
            </div>
          </details>
        </Panel>

        <Panel title="People">
          <div className="grid gap-3">
            {members.map((member) => (
              <details
                key={member.id}
                className="rounded-3xl border border-black/10 bg-white p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] font-semibold">
                      {member.imageMediaId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(member.imageMediaId) ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{member.name}</h3>
                      <p className="truncate text-sm text-[#6f6860]">
                        {member.functionNameEn}
                      </p>
                      <p className="mt-1 text-xs text-[#9b948a]">
                        {member.academicYears
                          .map(({ academicYear }) => academicYear.label)
                          .join(", ") || "No academic year assigned"}
                      </p>
                    </div>
                  </div>
                </summary>
                <div className="mt-5">
                  <TeamForm member={member} years={years} />
                  <form action={deleteTeamMember} className="mt-3">
                    <input type="hidden" name="id" value={member.id} />
                    <button className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}

function TeamForm({
  member,
  years,
  selectedYearId,
}: {
  member?: {
    id: string;
    name: string;
    functionName: string;
    functionNameEn: string;
    functionNameNl: string;
    url: string | null;
    isVisible: boolean;
    academicYears?: { academicYearId: string }[];
  };
  years: { id: string; label: string; isCurrent: boolean }[];
  selectedYearId?: string;
}) {
  const assignedYearIds = new Set(
    member?.academicYears?.map((year) => year.academicYearId) ??
      (selectedYearId ? [selectedYearId] : years.find((year) => year.isCurrent)?.id ? [years.find((year) => year.isCurrent)!.id] : []),
  );

  return (
    <form action={saveTeamMember} className="grid gap-4" encType="multipart/form-data">
      {member ? <input type="hidden" name="id" value={member.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Name">
          <input
            name="name"
            required
            defaultValue={member?.name}
            className={inputClass}
          />
        </Field>
        <Field label="Function EN">
          <input
            name="functionNameEn"
            required
            defaultValue={member?.functionNameEn ?? member?.functionName}
            className={inputClass}
          />
        </Field>
        <Field label="Function NL">
          <input
            name="functionNameNl"
            required
            defaultValue={member?.functionNameNl ?? member?.functionName}
            className={inputClass}
          />
        </Field>
        <Field label="Profile URL">
          <input
            name="url"
            type="url"
            defaultValue={member?.url ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Portrait">
          <input name="image" type="file" accept="image/*" className={inputClass} />
        </Field>
        <label className="flex items-center gap-3 pt-7 text-sm font-semibold">
          <input
            name="isVisible"
            type="checkbox"
            defaultChecked={member?.isVisible ?? true}
            className="h-5 w-5"
          />
          Visible when assigned to the current year
        </label>
      </div>
      <fieldset className="rounded-2xl border border-black/10 p-4">
        <legend className="px-2 text-sm font-semibold">Academic years</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((year) => (
            <label key={year.id} className="flex items-center gap-3 text-sm">
              <input
                name="academicYearIds"
                type="checkbox"
                value={year.id}
                defaultChecked={assignedYearIds.has(year.id)}
                className="h-5 w-5"
              />
              {year.label}
              {year.isCurrent ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  current
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>
      <button className={`${buttonClass} w-fit gap-2`}>
        <UserPlus size={16} />
        {member ? "Save member" : "Add member"}
      </button>
    </form>
  );
}
