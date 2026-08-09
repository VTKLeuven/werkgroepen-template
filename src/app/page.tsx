import { PublicSite } from "@/components/public-site";
import { resolveLocale } from "@/lib/i18n";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const data = await getSiteData();
  const params = await searchParams;
  const locale = resolveLocale(
    params.lang,
    data.settings.defaultLocale,
    data.settings.languageMode,
  );

  return <PublicSite data={data} locale={locale} />;
}
