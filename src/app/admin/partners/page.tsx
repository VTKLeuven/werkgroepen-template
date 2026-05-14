import { Handshake, Trash2 } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
} from "@/components/admin-shell";
import { deletePartner, savePartner } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireAdmin();
  const partners = await prisma.partner.findMany({
    include: { logoMedia: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <AdminShell title="Partners">
      <div className="grid gap-6">
        <Panel title="Add partner">
          <PartnerForm />
        </Panel>

        <Panel title="Existing partners">
          <div className="grid gap-4">
            {partners.map((partner) => (
              <div key={partner.id} className="rounded-3xl border border-black/10 p-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] p-2 text-center text-xs font-semibold">
                    {partner.logoMediaId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(partner.logoMediaId) ?? ""}
                        alt=""
                        className="max-h-full object-contain"
                      />
                    ) : (
                      partner.name
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{partner.nameEn}</h3>
                    <p className="text-sm text-[#6f6860]">{partner.websiteUrl}</p>
                  </div>
                </div>
                <PartnerForm partner={partner} />
                <form action={deletePartner} className="mt-3">
                  <input type="hidden" name="id" value={partner.id} />
                  <button className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                    <Trash2 size={15} />
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}

function PartnerForm({
  partner,
}: {
  partner?: {
    id: string;
    name: string;
    nameEn: string;
    nameNl: string;
    websiteUrl: string;
    sortOrder: number;
    isVisible: boolean;
  };
}) {
  return (
    <form action={savePartner} className="grid gap-4" encType="multipart/form-data">
      {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Name EN">
          <input
            name="nameEn"
            required
            defaultValue={partner?.nameEn ?? partner?.name}
            className={inputClass}
          />
        </Field>
        <Field label="Name NL">
          <input
            name="nameNl"
            required
            defaultValue={partner?.nameNl ?? partner?.name}
            className={inputClass}
          />
        </Field>
        <Field label="Website URL">
          <input
            name="websiteUrl"
            type="url"
            required
            defaultValue={partner?.websiteUrl}
            className={inputClass}
          />
        </Field>
        <Field label="Logo">
          <input name="logo" type="file" accept="image/*" className={inputClass} />
        </Field>
        <Field label="Sort order">
          <input
            name="sortOrder"
            type="number"
            defaultValue={partner?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-3 pt-7 text-sm font-semibold">
          <input
            name="isVisible"
            type="checkbox"
            defaultChecked={partner?.isVisible ?? true}
            className="h-5 w-5"
          />
          Visible on public site
        </label>
      </div>
      <button className={`${buttonClass} w-fit gap-2`}>
        <Handshake size={16} />
        {partner ? "Save partner" : "Add partner"}
      </button>
    </form>
  );
}
