import Link from "next/link";
import { ExternalLink, FilePlus2 } from "lucide-react";
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
import { PageOrderBoard } from "@/components/page-order-board";
import { deleteCustomPage, saveCustomPage } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  await requireAdmin();
  const [pages, siteSettings] = await Promise.all([
    prisma.customPage.findMany({
      include: { coverMedia: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
  ]);
  const languageConfig = getAdminLanguageConfig(siteSettings);

  return (
    <AdminShell
      title="Pages"
      description="Create standalone content pages and choose which ones appear in the website header."
    >
      <div className="grid gap-6">
        <Panel
          title="Header order"
          description="Published pages marked for the header appear after the homepage links in this order."
        >
          <PageOrderBoard
            key={pages
              .map(
                (page) =>
                  `${page.id}:${page.updatedAt.toISOString()}:${page.isPublished}:${page.showInNavigation}`,
              )
              .join(",")}
            pages={pages.map((page) => ({
              id: page.id,
              title: getAdminLocalizedValue(
                languageConfig,
                page.titleEn,
                page.titleNl,
              ),
              slug: page.slug,
              isPublished: page.isPublished,
              showInNavigation: page.showInNavigation,
            }))}
          />
        </Panel>

        <Panel title="Add page">
          <details className="rounded-2xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Add a new page
            </summary>
            <div className="mt-5">
              <PageForm languageConfig={languageConfig} />
            </div>
          </details>
        </Panel>

        <Panel title="Page details">
          <div className="grid gap-3">
            {pages.length === 0 ? (
              <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
                No standalone pages have been added yet.
              </p>
            ) : null}
            {pages.map((page) => {
              const title = getAdminLocalizedValue(
                languageConfig,
                page.titleEn,
                page.titleNl,
              );

              return (
                <details
                  key={page.id}
                  className="rounded-3xl border border-black/10 bg-white p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center gap-4">
                      <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] text-center text-xs font-semibold text-[#6f6860]">
                        {page.coverMediaId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(page.coverMediaId) ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          "Page"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{title}</h3>
                        <p className="truncate text-sm text-[#6f6860]">
                          /pages/{page.slug}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#9b948a]">
                          {page.isPublished ? "Published" : "Draft"}
                          {page.showInNavigation ? " · Header" : ""}
                        </p>
                      </div>
                      {page.isPublished ? (
                        <Link
                          href={`/pages/${page.slug}`}
                          target="_blank"
                          className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[#006d77] sm:inline-flex"
                        >
                          View
                          <ExternalLink size={13} />
                        </Link>
                      ) : null}
                    </div>
                  </summary>
                  <div className="mt-5">
                    <PageForm page={page} languageConfig={languageConfig} />
                    <form action={deleteCustomPage} className="mt-3">
                      <input type="hidden" name="id" value={page.id} />
                      <ConfirmDeleteButton itemName={`page “${title}”`} />
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

function PageForm({
  page,
  languageConfig,
}: {
  page?: {
    id: string;
    slug: string;
    titleEn: string;
    titleNl: string;
    eyebrowEn: string | null;
    eyebrowNl: string | null;
    supportingTextEn: string | null;
    supportingTextNl: string | null;
    contentEn: string;
    contentNl: string;
    coverMediaId: string | null;
    coverMedia: { originalName: string } | null;
    isPublished: boolean;
    showInNavigation: boolean;
  };
  languageConfig: AdminLanguageConfig;
}) {
  return (
    <form action={saveCustomPage} encType="multipart/form-data" className="grid gap-5">
      {page ? <input type="hidden" name="id" value={page.id} /> : null}
      <LocalizedAdminField
        label="Title"
        name="title"
        enValue={page?.titleEn}
        nlValue={page?.titleNl}
        required
        {...languageConfig}
      />
      <LocalizedAdminField
        label="Eyebrow (optional)"
        name="eyebrow"
        enValue={page?.eyebrowEn}
        nlValue={page?.eyebrowNl}
        preserveEmpty
        placeholder="Small label above the title"
        {...languageConfig}
      />
      <LocalizedAdminField
        label="Supporting text (optional)"
        name="supportingText"
        enValue={page?.supportingTextEn}
        nlValue={page?.supportingTextNl}
        preserveEmpty
        multiline
        placeholder="A short introduction below the title"
        {...languageConfig}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Cover photo (optional)">
          <input
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
            className={inputClass}
          />
          {page?.coverMedia ? (
            <p className="mt-2 text-xs text-[#6f6860]">
              Current: {page.coverMedia.originalName}
            </p>
          ) : null}
          {page?.coverMediaId ? (
            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-[#6f6860]">
              <input name="removeCover" type="checkbox" className="h-4 w-4" />
              Remove the current cover photo
            </label>
          ) : null}
        </Field>
        <details className="rounded-2xl border border-black/10 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced URL setting
          </summary>
          <div className="mt-4">
            <Field label="Page address">
              <input
                name="slug"
                defaultValue={page?.slug ?? ""}
                className={inputClass}
                placeholder="Generated from the title when empty"
              />
            </Field>
            <p className="mt-2 text-xs leading-5 text-[#6f6860]">
              The public URL will start with /pages/. Duplicate addresses get a
              number automatically.
            </p>
          </div>
        </details>
      </div>
      <LocalizedAdminField
        label="Content"
        name="content"
        enValue={page?.contentEn}
        nlValue={page?.contentNl}
        preserveEmpty
        markdown
        {...languageConfig}
      />
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={page?.isPublished ?? false}
            className="h-5 w-5"
          />
          Published
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            name="showInNavigation"
            type="checkbox"
            defaultChecked={page?.showInNavigation ?? false}
            className="h-5 w-5"
          />
          Show in website header
        </label>
      </div>
      <button className={`${buttonClass} w-fit gap-2`}>
        <FilePlus2 size={16} />
        {page ? "Save page" : "Add page"}
      </button>
    </form>
  );
}
