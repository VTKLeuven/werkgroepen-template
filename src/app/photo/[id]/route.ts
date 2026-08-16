import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { mediaPath } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serves one album photo. `?size=thumb` returns the grid-sized WebP, anything
 * else the full JPEG.
 *
 * Photos in an unpublished album are only readable by a signed-in admin,
 * otherwise a draft album would leak to anyone who guessed an id.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: {
      fileName: true,
      thumbName: true,
      album: { select: { isPublished: true } },
    },
  });

  if (!photo) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!photo.album.isPublished) {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const wantsThumb =
    new URL(request.url).searchParams.get("size") === "thumb";
  const fileName = wantsThumb ? photo.thumbName : photo.fileName;

  try {
    const file = await readFile(mediaPath(fileName));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": wantsThumb ? "image/webp" : "image/jpeg",
        // The bytes behind an id never change: a new upload is a new row.
        "Cache-Control": photo.album.isPublished
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
