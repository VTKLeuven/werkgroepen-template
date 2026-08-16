"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";

// Photos go up a few at a time rather than in one giant request. Compression on
// the VM is CPU-bound, so a small batch keeps each request short, lets progress
// move visibly, and means a dropped connection costs a handful of photos rather
// than the whole evening's upload.
const batchSize = 4;

type UploadResponse = {
  uploaded: number;
  failed: { name: string; error: string }[];
  quotaReached: boolean;
  storage: { used: number; limit: number };
};

export function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [finished, setFinished] = useState<number | null>(null);

  async function upload(files: File[]) {
    setBusy(true);
    setDone(0);
    setTotal(files.length);
    setProblems([]);
    setFinished(null);

    const failures: string[] = [];
    let uploaded = 0;

    for (let index = 0; index < files.length; index += batchSize) {
      const batch = files.slice(index, index + batchSize);
      const body = new FormData();
      for (const file of batch) body.append("file", file);

      try {
        const response = await fetch(`/api/admin/albums/${albumId}/photos`, {
          method: "POST",
          body,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          failures.push(
            payload?.error ?? `Upload failed (${response.status}).`,
          );
          break;
        }

        const result = (await response.json()) as UploadResponse;
        uploaded += result.uploaded;
        failures.push(...result.failed.map((item) => item.error));
        setDone(Math.min(index + batch.length, files.length));

        if (result.quotaReached) break;
      } catch {
        failures.push(
          "The connection dropped. The photos uploaded so far were kept.",
        );
        break;
      }
    }

    setProblems([...new Set(failures)].slice(0, 6));
    setFinished(uploaded);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    // Pull the new photos, the new count and the new storage bar from the server.
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-[#3a352f]">
        <span>Add photos</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
          multiple
          disabled={busy}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) void upload(files);
          }}
          className="min-h-11 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-[#006d77] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20 disabled:opacity-60"
        />
      </label>

      <p className="text-xs text-[#6f6860]">
        Select as many as you like. Photos are resized to 2560px and recompressed
        on upload, so a 12 MB photo from a camera lands around 600 KB. HEIC files
        from an iPhone are not supported — export them as JPEG first.
      </p>

      {busy ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#f5f1e8] px-4 py-3 text-sm font-semibold">
          <Loader2 size={16} className="animate-spin text-[#006d77]" />
          Uploading {done} of {total}…
        </div>
      ) : null}

      {!busy && finished !== null ? (
        <p className="flex items-center gap-2 rounded-2xl bg-[#eef6f0] px-4 py-3 text-sm font-semibold text-[#1f6b3f]">
          <ImagePlus size={16} />
          {finished} {finished === 1 ? "photo" : "photos"} added.
        </p>
      ) : null}

      {problems.length > 0 ? (
        <ul className="grid gap-1 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
