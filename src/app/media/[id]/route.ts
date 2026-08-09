import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { mediaPath } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });

  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(mediaPath(asset.fileName));
    return new NextResponse(file, {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
