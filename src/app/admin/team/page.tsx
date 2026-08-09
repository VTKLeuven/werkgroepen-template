import Link from "next/link";
import { CheckCircle2, UserPlus } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
} from "@/components/admin-shell";
import {
  LocalizedAdminField,
  getAdminLanguageConfig,
  getAdminLocalizedValue,
  type AdminLanguageConfig,
} from "@/components/admin-localized-field";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
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
  const [params, years, siteSettings] = await Promise.all([
    searchParams,
    prisma.academicYear.findMany({
      orderBy: [{ sortOrder: "desc" }, { label: "desc" }],
    }),
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
  ]);
  const languageConfig = getAdminLanguageConfig(siteSettings);
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
          description="Add each year once, then mark the active year as current. Years are listed newest first; older teams remain available here as an archive."
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
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <form action={saveAcademicYear} className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <Field label="New academic year">
                  <input
                    name="label"
                    placeholder="2026-2027"
                    required
                    className={inputClass}
                  />
                </Field>
              </div>
              <button className={`${buttonClass} w-fit`}>
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
            description="This mirrors the compact team grid on the website. Drag cards or use their arrow buttons to set the order for this academic year."
          >
            <TeamOrderBoard
              key={`${selectedYear.id}:${selectedMemberships
                .map(
                  ({ teamMember }) =>
                    `${teamMember.id}:${teamMember.updatedAt.toISOString()}`,
                )
                .join(",")}`}
              academicYearId={selectedYear.id}
              members={selectedMemberships.map(({ teamMember }) => ({
                id: teamMember.id,
                name: teamMember.name,
                functionName: getAdminLocalizedValue(
                  languageConfig,
                  teamMember.functionNameEn,
                  teamMember.functionNameNl,
                  teamMember.functionName,
                ),
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
              <TeamForm
                years={years}
                selectedYearId={selectedYear?.id}
                languageConfig={languageConfig}
              />
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
                        {getAdminLocalizedValue(
                          languageConfig,
                          member.functionNameEn,
                          member.functionNameNl,
                          member.functionName,
                        )}
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
                  <TeamForm
                    member={member}
                    years={years}
                    languageConfig={languageConfig}
                  />
                  <form action={deleteTeamMember} className="mt-3">
                    <input type="hidden" name="id" value={member.id} />
                    <ConfirmDeleteButton itemName={member.name} />
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
  languageConfig,
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
  languageConfig: AdminLanguageConfig;
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
        <LocalizedAdminField
          label="Function"
          name="functionName"
          enValue={member?.functionNameEn}
          nlValue={member?.functionNameNl}
          fallbackValue={member?.functionName}
          required
          className={
            languageConfig.languageMode === "bilingual" ? "lg:col-span-2" : ""
          }
          {...languageConfig}
        />
        <Field label="Profile URL">
          <input
            name="url"
            type="url"
            defaultValue={member?.url ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Portrait">
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
            className={inputClass}
          />
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
