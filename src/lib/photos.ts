import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { mediaPath, uploadDir } from "@/lib/media";
import { prisma } from "@/lib/prisma";

// The VM this runs on has 18 GB of disk in total, shared with Postgres, the
// Docker images and the OS. Album photos are the only thing here that grows
// without bound, so they get a hard ceiling of their own and the werkgroep
// decides what to delete once it is reached.
const defaultStorageLimit = 10 * 1024 * 1024 * 1024;

// Cameras and phones produce 4000-6000px files of 5-15 MB. Nobody views those at
// full size on a website, and keeping them would fill the disk after ~1500
// photos. 2560px on the long edge still prints fine and looks sharp on a retina
// screen, and mozjpeg at 82 is visually hard to tell from the original while
// landing around 400-800 KB.
const fullMaxEdge = 2560;
const fullQuality = 82;

// Only ever shown in a grid, so it can be far smaller and WebP.
const thumbMaxEdge = 640;
const thumbQuality = 72;

// Generous: this is the size *before* compression. Anything larger is almost
// certainly not a photo.
const maximumUploadSize = 40 * 1024 * 1024;

const acceptedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/tiff",
]);

export class PhotoUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PhotoUploadError";
    this.status = status;
  }
}

export function photoStorageLimit() {
  const configured = Number.parseInt(
    process.env.PHOTO_STORAGE_LIMIT_BYTES ?? "",
    10,
  );

  return Number.isFinite(configured) && configured > 0
    ? configured
    : defaultStorageLimit;
}

/**
 * Bytes currently on disk for album photos, thumbnails included.
 *
 * Postgres sums INTEGER columns as BIGINT, so the total is not capped at 2 GB
 * the way an individual row is, and 10 GB stays exact in a JS number.
 */
export async function photoStorageUsage() {
  const totals = await prisma.photo.aggregate({
    _sum: { size: true, thumbSize: true },
  });

  return (totals._sum.size ?? 0) + (totals._sum.thumbSize ?? 0);
}

export async function photoStorageStatus() {
  const [used, count] = await Promise.all([
    photoStorageUsage(),
    prisma.photo.count(),
  ]);
  const limit = photoStorageLimit();

  return {
    used,
    limit,
    count,
    remaining: Math.max(0, limit - used),
    percentage: limit > 0 ? Math.min(100, (used / limit) * 100) : 0,
    isFull: used >= limit,
  };
}

export type CompressedPhoto = {
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
};

/**
 * Re-encodes one upload into a display copy and a thumbnail.
 *
 * `rotate()` bakes in the EXIF orientation before the metadata is dropped,
 * otherwise portrait photos from a phone come out sideways once the tags are
 * gone. Metadata is dropped on purpose: it strips GPS coordinates from photos
 * that get published, and saves a few KB per file.
 */
export async function compressPhoto(input: Buffer): Promise<CompressedPhoto> {
  const pipeline = sharp(input, { failOn: "error" }).rotate();
  let metadata;

  try {
    metadata = await pipeline.metadata();
  } catch {
    throw new PhotoUploadError(
      "That file could not be read as an image. HEIC photos from an iPhone are not supported; export them as JPEG first.",
    );
  }

  if (!metadata.width || !metadata.height) {
    throw new PhotoUploadError("That file could not be read as an image.");
  }

  const resized = pipeline.resize({
    width: fullMaxEdge,
    height: fullMaxEdge,
    fit: "inside",
    withoutEnlargement: true,
  });

  const [full, thumb] = await Promise.all([
    resized
      .clone()
      // A PNG with transparency would otherwise go black where it was clear.
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: fullQuality, mozjpeg: true, progressive: true })
      .toBuffer({ resolveWithObject: true }),
    resized
      .clone()
      .resize({
        width: thumbMaxEdge,
        height: thumbMaxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .webp({ quality: thumbQuality })
      .toBuffer(),
  ]);

  return {
    full: full.data,
    thumb,
    width: full.info.width,
    height: full.info.height,
  };
}

/**
 * Compresses one upload and files it under an album.
 *
 * The quota is checked against the compressed size, after the work is done but
 * before anything touches the disk, so a photo that fits after compression is
 * still accepted when the original would not have been.
 */
export async function addPhotoToAlbum(
  albumId: string,
  file: File,
  sortOrder: number,
) {
  if (file.size === 0) {
    throw new PhotoUploadError("That file is empty.");
  }

  if (file.size > maximumUploadSize) {
    throw new PhotoUploadError(
      `${file.name} is larger than ${formatBytes(maximumUploadSize)} and was skipped.`,
      413,
    );
  }

  if (file.type && !acceptedTypes.has(file.type)) {
    throw new PhotoUploadError(
      `${file.name} is not a supported image (JPEG, PNG, WebP, GIF, AVIF or TIFF).`,
      415,
    );
  }

  const compressed = await compressPhoto(
    Buffer.from(await file.arrayBuffer()),
  );
  const addedBytes = compressed.full.length + compressed.thumb.length;
  const [used, limit] = [await photoStorageUsage(), photoStorageLimit()];

  if (used + addedBytes > limit) {
    throw new PhotoUploadError(
      `Storage is full (${formatBytes(used)} of ${formatBytes(limit)} used). Delete an album before uploading more.`,
      507,
    );
  }

  const fileName = `${randomUUID()}.jpg`;
  const thumbName = `${randomUUID()}.webp`;

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(mediaPath(fileName), compressed.full);
  await writeFile(mediaPath(thumbName), compressed.thumb);

  try {
    return await prisma.photo.create({
      data: {
        albumId,
        fileName,
        thumbName,
        originalName: file.name.slice(0, 200) || "photo.jpg",
        size: compressed.full.length,
        thumbSize: compressed.thumb.length,
        width: compressed.width,
        height: compressed.height,
        sortOrder,
      },
    });
  } catch (error) {
    // Never leave bytes on disk that no row accounts for: the quota is computed
    // from the table, so an orphan file would be invisible to it forever.
    await removePhotoFiles([fileName, thumbName]);
    throw error;
  }
}

/** Best effort: a file that is already gone must not block deleting the row. */
export async function removePhotoFiles(fileNames: string[]) {
  await Promise.all(
    fileNames.map(async (name) => {
      try {
        await unlink(mediaPath(name));
      } catch {
        // Already removed, or never written.
      }
    }),
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  // One decimal is useful at "9.4 GB", noise at "150 MB".
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}
