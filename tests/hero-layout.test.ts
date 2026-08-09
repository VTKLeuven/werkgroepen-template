import assert from "node:assert/strict";
import test from "node:test";
import {
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
  });
  assert.deepEqual(heroTextPositionClasses("center"), {
    container: "items-center justify-center",
    content: "text-center",
    copy: "mx-auto",
    overlay:
      "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.62),rgba(0,0,0,0.16)_72%)]",
  });
  assert.deepEqual(heroTextPositionClasses("bottomLeft"), {
    container: "items-end justify-start",
    content: "text-left",
    copy: "",
    overlay: "bg-gradient-to-r from-black/70 via-black/35 to-black/10",
  });
});
