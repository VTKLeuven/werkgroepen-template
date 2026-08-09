import { auth } from "@/auth";
import { mediaUrl } from "@/lib/format";
import { saveUploadedImage } from "@/lib/media";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ error: "You must be signed in to upload images." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const asset = await saveUploadedImage(file, String(formData.get("alt") ?? ""));

    if (!asset) {
      return Response.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    return Response.json({ url: mediaUrl(asset.id) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The image could not be uploaded.",
      },
      { status: 400 },
    );
  }
}
