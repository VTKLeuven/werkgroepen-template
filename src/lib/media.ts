import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/ico",
]);

export function uploadDir() {
  return process.env.UPLOAD_DIR || "uploads";
}

export function mediaPath(fileName: string) {
  return `${uploadDir().replace(/\/$/, "")}/${fileName}`;
}

export async function saveUploadedImage(file: File | null, alt?: string) {
  if (!file || file.size === 0) return null;

  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() || ".bin";
  const mimeType = file.type || (extension === ".ico" ? "image/x-icon" : "");

  if (!allowedImageTypes.has(mimeType)) {
    throw new Error(
      "Only JPEG, PNG, WebP, GIF, SVG, and ICO images are supported.",
    );
  }

  const fileName = `${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(mediaPath(fileName), bytes);

  return prisma.mediaAsset.create({
    data: {
      fileName,
      originalName: file.name,
      mimeType,
      size: file.size,
      alt,
    },
  });
}
