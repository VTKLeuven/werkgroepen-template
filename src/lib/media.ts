import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function uploadDir() {
  return process.env.UPLOAD_DIR || "uploads";
}

export function mediaPath(fileName: string) {
  return `${uploadDir().replace(/\/$/, "")}/${fileName}`;
}

export async function saveUploadedImage(file: File | null, alt?: string) {
  if (!file || file.size === 0) return null;

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, GIF, and SVG images are supported.");
  }

  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() || ".bin";
  const fileName = `${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(mediaPath(fileName), bytes);

  return prisma.mediaAsset.create({
    data: {
      fileName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      alt,
    },
  });
}
