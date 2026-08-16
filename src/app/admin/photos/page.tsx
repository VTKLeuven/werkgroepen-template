import Link from "next/link";
import { Download, Images, Star } from "lucide-react";
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
import { PhotoUploader } from "@/components/photo-uploader";
import {
  deletePhoto,
  deletePhotoAlbum,
  savePhotoAlbum,
  setAlbumCover,
} from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { photoUrl } from "@/lib/format";
import { formatBytes, photoStorageStatus } from "@/lib/photos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string }>;
}) {
  await requireAdmin();

  const [{ album: openAlbumId }, albums, siteSettings, storage] =
    await Promise.all([
      searchParams,
      prisma.photoAlbum.findMany({
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              originalName: true,
              size: true,
              thumbSize: true,
              width: true,
              height: true,
            },
          },
        },
        orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
      }),
      prisma.siteSettings.findUnique({ where: { id: "site" } }),
      photoStorageStatus(),
    ]);

  const languageConfig = getAdminLanguageConfig(siteSettings);

  return (
    <AdminShell
      title="Photos"
      description="Group photos into albums, publish the ones visitors should see, and download or delete whole albums."
    >
      <div className="grid gap-6">
        <Panel
          title="Storage"
          description="Every album shares one allowance. When it runs out, delete an album you no longer need online — there is no way to buy more space on the server."
        >
          <StorageMeter storage={storage} />
        </Panel>

        <Panel title="New album">
          <details
            open={albums.length === 0}
            className="rounded-2xl border border-black/10 p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold">
              Create an album
            </summary>
            <div className="mt-4">
              <AlbumForm languageConfig={languageConfig} />
            </div>
          </details>
        </Panel>

        <Panel title="Albums">
          <div className="grid gap-3">
            {albums.length === 0 ? (
              <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
                No albums yet. Create one above, then add photos to it.
              </p>
            ) : null}

            {albums.map((album) => {
              const title = getAdminLocalizedValue(
                languageConfig,
                album.titleEn,
                album.titleNl,
                album.slug,
              );
              const albumBytes = album.photos.reduce(
                (total, photo) => total + photo.size + photo.thumbSize,
                0,
              );

              return (
                <details
                  key={album.id}
                  open={openAlbumId === album.id}
                  className="rounded-3xl border border-black/10 bg-white p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center gap-4">
                      <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] text-[#8b8379]">
                        {album.coverPhotoId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl(album.coverPhotoId, "thumb") ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Images size={22} strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{title}</h3>
                        <p className="truncate text-sm text-[#6f6860]">
                          {album.photos.length}{" "}
                          {album.photos.length === 1 ? "photo" : "photos"} ·{" "}
                          {formatBytes(albumBytes)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#9b948a]">
                          {album.isPublished
                            ? "Visible on website"
                            : "Draft, hidden from visitors"}
                        </p>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-5 grid gap-5">
                    <AlbumForm album={album} languageConfig={languageConfig} />

                    <div className="rounded-2xl border border-black/10 p-4">
                      <PhotoUploader albumId={album.id} />
                    </div>

                    {album.photos.length > 0 ? (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">
                          Photos in this album
                        </h4>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                          {album.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#f5f1e8] ring-1 ring-black/5"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl(photo.id, "thumb") ?? ""}
                                alt={photo.originalName}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                                <form action={setAlbumCover}>
                                  <input
                                    type="hidden"
                                    name="photoId"
                                    value={photo.id}
                                  />
                                  <button
                                    title="Use as album cover"
                                    aria-label="Use as album cover"
                                    className="grid h-7 w-7 place-items-center rounded-full text-white transition hover:bg-white/25"
                                  >
                                    <Star
                                      size={14}
                                      fill={
                                        album.coverPhotoId === photo.id
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  </button>
                                </form>
                                <span className="truncate text-[10px] font-semibold text-white/80">
                                  {formatBytes(photo.size)}
                                </span>
                                <form action={deletePhoto}>
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={photo.id}
                                  />
                                  <ConfirmDeleteButton
                                    itemName={photo.originalName}
                                    compact
                                  />
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4">
                      {album.photos.length > 0 ? (
                        <Link
                          href={`/api/admin/albums/${album.id}/download`}
                          prefetch={false}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#3a352f] transition hover:border-black/20 hover:bg-[#faf8f3]"
                        >
                          <Download size={15} />
                          Download album ({formatBytes(albumBytes)})
                        </Link>
                      ) : null}
                      <form action={deletePhotoAlbum}>
                        <input type="hidden" name="id" value={album.id} />
                        <ConfirmDeleteButton
                          itemName={`${title} and its ${album.photos.length} ${
                            album.photos.length === 1 ? "photo" : "photos"
                          }`}
                        />
                      </form>
                    </div>
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

function StorageMeter({
  storage,
}: {
  storage: Awaited<ReturnType<typeof photoStorageStatus>>;
}) {
  const nearlyFull = storage.percentage >= 90;
  const busy = storage.percentage >= 75;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          {formatBytes(storage.used)} of {formatBytes(storage.limit)} used
        </p>
        <p className="text-sm text-[#6f6860]">
          {storage.count} {storage.count === 1 ? "photo" : "photos"} ·{" "}
          {formatBytes(storage.remaining)} free
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(storage.percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Photo storage used"
        className="h-3 overflow-hidden rounded-full bg-[#eae4d8]"
      >
        <div
          className={`h-full rounded-full transition-all ${
            nearlyFull ? "bg-red-500" : busy ? "bg-amber-500" : "bg-[#006d77]"
          }`}
          style={{ width: `${Math.max(storage.percentage, 1)}%` }}
        />
      </div>

      {storage.isFull ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Storage is full. New uploads are refused until you delete an album.
        </p>
      ) : nearlyFull ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Less than 10% left. Consider downloading an old album and deleting it
          from the website.
        </p>
      ) : null}
    </div>
  );
}

function AlbumForm({
  album,
  languageConfig,
}: {
  album?: {
    id: string;
    slug: string;
    titleEn: string;
    titleNl: string;
    descriptionEn: string | null;
    descriptionNl: string | null;
    takenOn: Date | null;
    isPublished: boolean;
  };
  languageConfig: AdminLanguageConfig;
}) {
  return (
    <form action={savePhotoAlbum} className="grid gap-4">
      {album ? <input type="hidden" name="id" value={album.id} /> : null}
      <LocalizedAdminField
        label="Album title"
        name="title"
        enValue={album?.titleEn}
        nlValue={album?.titleNl}
        required
        {...languageConfig}
      />
      <LocalizedAdminField
        label="Description"
        name="description"
        enValue={album?.descriptionEn ?? ""}
        nlValue={album?.descriptionNl ?? ""}
        markdown
        preserveEmpty
        {...languageConfig}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Date (optional)">
          <input
            name="takenOn"
            type="date"
            defaultValue={
              album?.takenOn
                ? album.takenOn.toISOString().slice(0, 10)
                : undefined
            }
            className={inputClass}
          />
        </Field>
        <Field label="Web address">
          <input
            name="slug"
            defaultValue={album?.slug}
            placeholder="Generated from the title"
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-semibold lg:col-span-2">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={album?.isPublished ?? false}
            className="h-5 w-5 accent-[#006d77]"
          />
          Visible on public website
        </label>
      </div>
      <button className={`${buttonClass} w-fit gap-2`}>
        <Images size={16} />
        {album ? "Save album" : "Create album"}
      </button>
    </form>
  );
}
