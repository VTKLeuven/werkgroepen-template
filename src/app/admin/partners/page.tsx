import { Handshake } from "lucide-react";
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
import { PartnerOrderBoard } from "@/components/partner-order-board";
import { deletePartner, savePartner } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireAdmin();
  const [partners, siteSettings] = await Promise.all([
    prisma.partner.findMany({
      include: { logoMedia: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
  ]);
  const languageConfig = getAdminLanguageConfig(siteSettings);

  return (
    <AdminShell
      title="Partners"
      description="Manage the organizations shown on the website and arrange them visually."
    >
      <div className="grid gap-6">
        <Panel
          title="Public order"
          description="This is the order visitors see. Drag cards or use the arrow buttons; there are no sort numbers to maintain."
        >
          <PartnerOrderBoard
            key={partners
              .map(
                (partner) =>
                  `${partner.id}:${partner.updatedAt.toISOString()}:${partner.isVisible}`,
              )
              .join(",")}
            partners={partners.map((partner) => ({
              id: partner.id,
              name: getAdminLocalizedValue(
                languageConfig,
                partner.nameEn,
                partner.nameNl,
                partner.name,
              ),
              logoUrl: mediaUrl(partner.logoMediaId),
              isVisible: partner.isVisible,
            }))}
          />
        </Panel>

        <Panel title="Add partner">
          <details className="rounded-2xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Add a new partner
            </summary>
            <div className="mt-4">
              <PartnerForm languageConfig={languageConfig} />
            </div>
          </details>
        </Panel>

        <Panel title="Partner details">
          <div className="grid gap-3">
            {partners.length === 0 ? (
              <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
                No partners added yet.
              </p>
            ) : null}
            {partners.map((partner) => {
              const name = getAdminLocalizedValue(
                languageConfig,
                partner.nameEn,
                partner.nameNl,
                partner.name,
              );

              return (
                <details
                  key={partner.id}
                  className="rounded-3xl border border-black/10 bg-white p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center gap-4">
                      <div className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] p-2 text-center text-xs font-semibold">
                        {partner.logoMediaId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(partner.logoMediaId) ?? ""}
                            alt=""
                            className="max-h-full object-contain"
                          />
                        ) : (
                          name
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{name}</h3>
                        <p className="truncate text-sm text-[#6f6860]">
                          {partner.websiteUrl}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#9b948a]">
                          {partner.isVisible ? "Visible on website" : "Hidden"}
                        </p>
                      </div>
                    </div>
                  </summary>
                  <div className="mt-5">
                    <PartnerForm
                      partner={partner}
                      languageConfig={languageConfig}
                    />
                    <form action={deletePartner} className="mt-3">
                      <input type="hidden" name="id" value={partner.id} />
                      <ConfirmDeleteButton itemName={name} />
                    </form>
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}

function PartnerForm({
  partner,
  languageConfig,
}: {
  partner?: {
    id: string;
    name: string;
    nameEn: string;
    nameNl: string;
    websiteUrl: string;
    isVisible: boolean;
    logoMediaId?: string | null;
  };
  languageConfig: AdminLanguageConfig;
}) {
  return (
    <form action={savePartner} className="grid gap-4">
      {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
      <LocalizedAdminField
        label="Name"
        name="name"
        enValue={partner?.nameEn}
        nlValue={partner?.nameNl}
        fallbackValue={partner?.name}
        required
        {...languageConfig}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Website URL">
          <input
            name="websiteUrl"
            type="url"
            required
            defaultValue={partner?.websiteUrl}
            className={inputClass}
          />
        </Field>
        <Field label={partner?.logoMediaId ? "Replace logo" : "Logo"}>
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-semibold lg:col-span-2">
          <input
            name="isVisible"
            type="checkbox"
            defaultChecked={partner?.isVisible ?? true}
            className="h-5 w-5 accent-[#006d77]"
          />
          Visible on public website
        </label>
      </div>
      <button className={`${buttonClass} w-fit gap-2`}>
        <Handshake size={16} />
        {partner ? "Save partner" : "Add partner"}
      </button>
    </form>
  );
}
