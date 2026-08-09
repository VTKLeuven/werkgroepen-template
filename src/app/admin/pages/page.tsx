import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminShell, Panel } from "@/components/admin-shell";
import {
  getAdminLanguageConfig,
  getAdminLocalizedValue,
} from "@/components/admin-localized-field";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { PageSaveConfirmation } from "@/components/page-save-confirmation";
import {
  CustomPageForm,
  type CustomPagePreviewConfig,
} from "@/components/custom-page-form";
import { deleteCustomPage } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { defaultTheme } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; editing?: string }>;
}) {
  await requireAdmin();
  const [pages, siteSettings, themeSettings, params] = await Promise.all([
    prisma.customPage.findMany({
      include: { coverMedia: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSettings.findUnique({
      where: { id: "site" },
      include: { logoMedia: true },
    }),
    prisma.themeSettings.findUnique({ where: { id: "theme" } }),
    searchParams,
  ]);
  const savedPage = pages.find((page) => page.id === params.saved);
  const languageConfig = getAdminLanguageConfig(siteSettings);
  const theme = themeSettings ?? defaultTheme;
  const previewConfig: CustomPagePreviewConfig = {
    headerName: {
      en: siteSettings?.headerNameEn ?? siteSettings?.siteNameEn ?? "Website",
      nl: siteSettings?.headerNameNl ?? siteSettings?.siteNameNl ?? "Website",
    },
    logoMode: siteSettings?.logoMode ?? "iconWithText",
    logoUrl: mediaUrl(siteSettings?.logoMediaId),
    colors: {
      background: theme.backgroundColor,
      surface: theme.surfaceColor,
      text: theme.textColor,
      muted: theme.mutedColor,
      primary: theme.primaryColor,
      accent: theme.accentColor,
      header: theme.headerColor,
    },
    typography: {
      body: theme.bodyFontScale,
      heading: theme.headingFontScale,
    },
  };

  return (
    <AdminShell
      title="Pages"
      description="Create standalone content pages and choose which ones appear in the website header."
    >
      {savedPage ? (
        <PageSaveConfirmation
          title={getAdminLocalizedValue(
            languageConfig,
            savedPage.titleEn,
            savedPage.titleNl,
          )}
          summary={coverSummary(savedPage)}
          publicHref={
            savedPage.isPublished ? `/pages/${savedPage.slug}` : null
          }
          closeHref={`/admin/pages?editing=${encodeURIComponent(savedPage.id)}#page-${encodeURIComponent(savedPage.id)}`}
        />
      ) : null}
      <div className="grid gap-6">
        <Panel title="Add page">
          <details className="rounded-2xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Add a new page
            </summary>
            <div className="mt-5">
              <CustomPageForm
                languageConfig={languageConfig}
                previewConfig={previewConfig}
              />
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
                  id={`page-${page.id}`}
                  open={page.id === params.saved || page.id === params.editing}
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
                          {` · ${coverSummary(page)}`}
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
                    <CustomPageForm
                      page={{
                        id: page.id,
                        slug: page.slug,
                        titleEn: page.titleEn,
                        titleNl: page.titleNl,
                        eyebrowEn: page.eyebrowEn,
                        eyebrowNl: page.eyebrowNl,
                        supportingTextEn: page.supportingTextEn,
                        supportingTextNl: page.supportingTextNl,
                        contentEn: page.contentEn,
                        contentNl: page.contentNl,
                        coverMediaId: page.coverMediaId,
                        coverName: page.coverMedia?.originalName ?? null,
                        coverUrl: mediaUrl(page.coverMediaId),
                        coverDisplayMode: page.coverDisplayMode,
                        coverWidth: page.coverWidth,
                        coverPositionX: page.coverPositionX,
                        coverPositionY: page.coverPositionY,
                        coverZoom: page.coverZoom,
                        coverBorderWidth: page.coverBorderWidth,
                        coverBorderStyle: page.coverBorderStyle,
                        coverBorderColor: page.coverBorderColor,
                        coverBorderRadius: page.coverBorderRadius,
                        coverFrameShadow: page.coverFrameShadow,
                        coverPlacement: page.coverPlacement,
                        coverSideWidth: page.coverSideWidth,
                        isPublished: page.isPublished,
                        showInNavigation: page.showInNavigation,
                      }}
                      languageConfig={languageConfig}
                      previewConfig={previewConfig}
                    />
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

function coverSummary(page: {
  coverDisplayMode: "full" | "flexible" | "fit" | "fill" | "crop";
  coverWidth: number;
  coverPlacement: "above" | "left" | "right";
  coverSideWidth: number;
}) {
  const mode =
    page.coverDisplayMode === "flexible"
      ? `flexible image at ${Math.round(page.coverWidth)}%`
      : `${page.coverDisplayMode} image`;
  const placement =
    page.coverPlacement === "above"
      ? "above the content"
      : `${page.coverPlacement} of the content at ${Math.round(
          page.coverSideWidth,
        )}% column width`;

  return `${mode}, ${placement}`;
}
