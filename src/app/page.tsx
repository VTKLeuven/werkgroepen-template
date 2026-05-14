import { PublicSite } from "@/components/public-site";
import { normalizeLocale } from "@/lib/i18n";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const data = await getSiteData();
  const params = await searchParams;
  const locale = normalizeLocale(params.lang, data.settings.defaultLocale);

  return <PublicSite data={data} locale={locale} />;
}
