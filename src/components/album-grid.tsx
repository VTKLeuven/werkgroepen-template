import Link from "next/link";
import { Images } from "lucide-react";
import { formatAlbumDate, photoUrl } from "@/lib/format";
import { localized, localizeHref, type PublicLocale, uiText } from "@/lib/i18n";
import type { LanguageMode } from "@/generated/prisma/client";

export type AlbumCard = {
  id: string;
  slug: string;
  titleEn: string;
  titleNl: string;
  takenOn: Date | null;
  coverPhotoId: string | null;
  _count: { photos: number };
};

/**
 * The album grid, shared by the homepage preview strip and the Photos page so
 * both stay identical when either changes.
 */
export function AlbumGrid({
  albums,
  locale,
  languageMode,
}: {
  albums: AlbumCard[];
  locale: PublicLocale;
  languageMode: LanguageMode;
}) {
  const text = uiText[locale];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {albums.map((album) => {
        const title = localized(locale, album.titleEn, album.titleNl);
        const cover = photoUrl(album.coverPhotoId, "thumb");
        const count = album._count.photos;

        return (
          <Link
            key={album.id}
            href={localizeHref(`/photos/${album.slug}`, locale, languageMode)}
            className="group overflow-hidden rounded-3xl bg-[var(--surface)] shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <div className="aspect-[4/3] bg-[var(--background)]">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center text-[var(--primary)]">
                  <Images size={40} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="site-text-xl font-semibold">{title}</h3>
              <p className="site-text-sm mt-2 text-[var(--muted)]">
                {count} {count === 1 ? text.singlePhoto : text.photoCount}
                {album.takenOn
                  ? ` · ${formatAlbumDate(
                      album.takenOn,
                      locale === "nl" ? "nl-BE" : "en-GB",
                    )}`
                  : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
