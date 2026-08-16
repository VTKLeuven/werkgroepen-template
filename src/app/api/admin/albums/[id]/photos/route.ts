import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  addPhotoToAlbum,
  photoStorageStatus,
  PhotoUploadError,
} from "@/lib/photos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Compression is CPU-bound and this runs on a small VM, so files are handled one
// after another rather than all at once. The uploader in the admin sends them a
// few at a time for the same reason: a 300 photo drop should not become a single
// request that either succeeds after ten minutes or fails completely.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json(
      { error: "You must be signed in to upload photos." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!album) {
    return Response.json({ error: "That album no longer exists." }, { status: 404 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "The upload was interrupted. Try again with fewer photos at once." },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return Response.json({ error: "Choose at least one photo." }, { status: 400 });
  }

  const lastPhoto = await prisma.photo.findFirst({
    where: { albumId: album.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let sortOrder = (lastPhoto?.sortOrder ?? -1) + 1;
  const uploaded: string[] = [];
  const failed: { name: string; error: string }[] = [];
  let quotaReached = false;

  for (const file of files) {
    try {
      const photo = await addPhotoToAlbum(album.id, file, sortOrder);
      uploaded.push(photo.id);
      sortOrder += 1;
    } catch (error) {
      const message =
        error instanceof PhotoUploadError
          ? error.message
          : "That photo could not be processed.";

      failed.push({ name: file.name, error: message });

      // Once the disk allowance is gone, every later file fails the same way.
      // Stop rather than grinding through the rest of the batch.
      if (error instanceof PhotoUploadError && error.status === 507) {
        quotaReached = true;
        break;
      }
    }
  }

  if (uploaded.length > 0) {
    // The first photo of a new album becomes its cover unless one is set.
    await prisma.photoAlbum.updateMany({
      where: { id: album.id, coverPhotoId: null },
      data: { coverPhotoId: uploaded[0] },
    });

    revalidatePath("/photos");
    revalidatePath(`/photos/${album.slug}`);
    revalidatePath("/admin/photos");
    revalidatePath("/");
  }

  return Response.json({
    uploaded: uploaded.length,
    failed,
    quotaReached,
    storage: await photoStorageStatus(),
  });
}
