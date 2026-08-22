import assert from "node:assert/strict";
import test from "node:test";
import {
  clampHeroOverlayIntensity,
  heroOverlayGradient,
  heroTextPositionClasses,
  heroTextPositions,
} from "../src/lib/hero-layout";

test("hero text positions cover a complete three-by-three grid", () => {
  assert.equal(heroTextPositions.length, 9);
  assert.deepEqual(
    new Set(heroTextPositions.map((position) => position.value)).size,
    9,
  );

  assert.deepEqual(heroTextPositionClasses("topRight"), {
    container: "items-start justify-end",
    content: "text-right",
    copy: "ml-auto",
    overlay: "bg-gradient-to-l from-black/70 via-black/35 to-black/10",
    overlayGradient:
      "linear-gradient(to left, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  });
  assert.deepEqual(heroTextPositionClasses("center"), {
    container: "items-center justify-center",
    content: "text-center",
    copy: "mx-auto",
    overlay:
      "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.62),rgba(0,0,0,0.16)_72%)]",
    overlayGradient:
      "radial-gradient(circle at center, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.16) 72%)",
  });
  assert.deepEqual(heroTextPositionClasses("bottomLeft"), {
    container: "items-end justify-start",
    content: "text-left",
    copy: "",
    overlay: "bg-gradient-to-r from-black/70 via-black/35 to-black/10",
    overlayGradient:
      "linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  });
});

test("hero overlay gradient default intensity 70 preserves exact appearance", () => {
  // Left aligned
  assert.equal(
    heroOverlayGradient("bottomLeft", 70),
    "linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  );
  assert.equal(
    heroOverlayGradient("topLeft"),
    "linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  );

  // Right aligned
  assert.equal(
    heroOverlayGradient("topRight", 70),
    "linear-gradient(to left, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  );
  assert.equal(
    heroOverlayGradient("bottomRight"),
    "linear-gradient(to left, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1))",
  );

  // Center aligned
  assert.equal(
    heroOverlayGradient("center", 70),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.16) 72%)",
  );
  assert.equal(
    heroOverlayGradient("topCenter"),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.16) 72%)",
  );
  assert.equal(
    heroOverlayGradient("bottomCenter"),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.16) 72%)",
  );
});

test("hero overlay gradient scales stops proportionally and supports 0 intensity transparency", () => {
  // 0 intensity: fully transparent
  assert.equal(
    heroOverlayGradient("bottomLeft", 0),
    "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))",
  );
  assert.equal(
    heroOverlayGradient("topRight", 0),
    "linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))",
  );
  assert.equal(
    heroOverlayGradient("center", 0),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0) 72%)",
  );

  // 35 intensity: half strength of 70
  assert.equal(
    heroOverlayGradient("centerLeft", 35),
    "linear-gradient(to right, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.175), rgba(0, 0, 0, 0.05))",
  );
  assert.equal(
    heroOverlayGradient("centerRight", 35),
    "linear-gradient(to left, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.175), rgba(0, 0, 0, 0.05))",
  );
  assert.equal(
    heroOverlayGradient("center", 35),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0.31), rgba(0, 0, 0, 0.08) 72%)",
  );

  // 100 intensity: max strength
  assert.equal(
    heroOverlayGradient("bottomLeft", 100),
    "linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1429))",
  );
  assert.equal(
    heroOverlayGradient("bottomRight", 100),
    "linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1429))",
  );
  assert.equal(
    heroOverlayGradient("center", 100),
    "radial-gradient(circle at center, rgba(0, 0, 0, 0.8857), rgba(0, 0, 0, 0.2286) 72%)",
  );
});

test("hero overlay intensity safely clamps values and handles invalid inputs", () => {
  assert.equal(clampHeroOverlayIntensity(-10), 0);
  assert.equal(clampHeroOverlayIntensity(-0.5), 0);
  assert.equal(clampHeroOverlayIntensity(120), 100);
  assert.equal(clampHeroOverlayIntensity(50), 50);
  assert.equal(clampHeroOverlayIntensity(Number.NaN), 70);
  assert.equal(clampHeroOverlayIntensity(undefined as unknown as number), 70);
  assert.equal(clampHeroOverlayIntensity(null as unknown as number), 70);

  // Gradient helper uses clamped intensity
  assert.equal(
    heroOverlayGradient("bottomLeft", -50),
    heroOverlayGradient("bottomLeft", 0),
  );
  assert.equal(
    heroOverlayGradient("bottomLeft", 200),
    heroOverlayGradient("bottomLeft", 100),
  );
  assert.equal(
    heroOverlayGradient("bottomLeft", Number.NaN),
    heroOverlayGradient("bottomLeft", 70),
  );
});
