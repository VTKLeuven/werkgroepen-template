import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { mediaPath } from "@/lib/media";
import { slugify } from "@/lib/format";
import { zipArchive, type ZipEntry } from "@/lib/zip";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Streams a whole album back as a ZIP.
 *
 * The archive is generated on the fly and never staged on disk: a 5 GB album
 * would not fit anywhere on an 18 GB VM alongside the photos it contains. Only
 * one photo is held in memory at a time.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.email) {
    return new Response("You must be signed in to download an album.", {
      status: 401,
    });
  }

  const { id } = await params;
  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    select: {
      slug: true,
      titleEn: true,
      titleNl: true,
      photos: {
        orderBy: { sortOrder: "asc" },
        select: {
          fileName: true,
          originalName: true,
          size: true,
          createdAt: true,
        },
      },
    },
  });

  if (!album) {
    return new Response("That album no longer exists.", { status: 404 });
  }

  if (album.photos.length === 0) {
    return new Response("That album has no photos yet.", { status: 404 });
  }

  const entries: ZipEntry[] = album.photos.map((photo) => ({
    // Keep the name the werkgroep uploaded, but always with the extension the
    // stored file actually has: everything is re-encoded to JPEG on upload.
    name: `${photo.originalName.replace(/\.[^.]*$/, "")}.jpg`,
    size: photo.size,
    modifiedAt: photo.createdAt,
    read: async () => new Uint8Array(await readFile(mediaPath(photo.fileName))),
  }));

  const fileName = `${slugify(album.titleNl || album.titleEn || album.slug) || "album"}.zip`;
  const stream = Readable.toWeb(
    Readable.from(zipArchive(entries)),
  ) as ReadableStream<Uint8Array>;

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      // No Content-Length: the total is only known once the last entry is
      // written, so the response is chunked instead.
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
