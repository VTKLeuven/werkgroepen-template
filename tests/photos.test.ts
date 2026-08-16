import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { compressPhoto, formatBytes, PhotoUploadError } from "../src/lib/photos";

function solidImage(width: number, height: number, background = "#336699") {
  return sharp({ create: { width, height, channels: 3, background } })
    .jpeg()
    .toBuffer();
}

test("byte sizes read the way a person would write them", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
  assert.equal(formatBytes(10 * 1024 * 1024 * 1024), "10.0 GB");
  assert.equal(formatBytes(150 * 1024 * 1024), "150 MB");
});

test("oversized photos are scaled down to the display size", async () => {
  const result = await compressPhoto(await solidImage(5000, 3000));

  assert.equal(result.width, 2560);
  assert.equal(result.height, 1536);
  assert.equal((await sharp(result.full).metadata()).format, "jpeg");
  assert.equal((await sharp(result.thumb).metadata()).format, "webp");
});

test("photos smaller than the display size are never upscaled", async () => {
  const result = await compressPhoto(await solidImage(400, 300));

  assert.equal(result.width, 400);
  assert.equal(result.height, 300);
});

test("compression is a real saving, and the thumbnail is far smaller again", async () => {
  const original = await sharp({
    create: { width: 4000, height: 3000, channels: 3, background: "#c08040" },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
  const result = await compressPhoto(original);

  assert.ok(
    result.full.length < original.length,
    "the stored copy should be smaller than the upload",
  );
  assert.ok(
    result.thumb.length < result.full.length,
    "the thumbnail should be smaller than the stored copy",
  );
});

test("EXIF is dropped, so published photos carry no GPS location", async () => {
  const withExif = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#222222" },
  })
    .withExif({ IFD0: { Copyright: "werkgroep", Software: "test" } })
    .jpeg()
    .toBuffer();

  assert.ok((await sharp(withExif).metadata()).exif, "fixture should have EXIF");

  const result = await compressPhoto(withExif);
  assert.equal((await sharp(result.full).metadata()).exif, undefined);
});

test("transparency is flattened to white instead of turning black", async () => {
  const transparent = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  const result = await compressPhoto(transparent);
  const stats = await sharp(result.full).stats();

  for (const channel of stats.channels) {
    assert.ok(channel.mean > 250, `expected white, got mean ${channel.mean}`);
  }
});

test("a file that is not an image fails with a message a human can act on", async () => {
  await assert.rejects(
    () => compressPhoto(Buffer.from("definitely not an image")),
    (error: unknown) => {
      assert.ok(error instanceof PhotoUploadError);
      assert.match(error.message, /HEIC/);
      return true;
    },
  );
});
