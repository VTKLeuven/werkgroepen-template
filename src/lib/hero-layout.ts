export type HeroTextPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "centerLeft"
  | "center"
  | "centerRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

export const heroTextPositions: {
  value: HeroTextPosition;
  label: string;
}[] = [
  { value: "topLeft", label: "Top left" },
  { value: "topCenter", label: "Top center" },
  { value: "topRight", label: "Top right" },
  { value: "centerLeft", label: "Center left" },
  { value: "center", label: "Center" },
  { value: "centerRight", label: "Center right" },
  { value: "bottomLeft", label: "Bottom left" },
  { value: "bottomCenter", label: "Bottom center" },
  { value: "bottomRight", label: "Bottom right" },
];

export const DEFAULT_HERO_OVERLAY_INTENSITY = 70;

export function clampHeroOverlayIntensity(
  intensity: number | undefined | null,
): number {
  if (typeof intensity !== "number" || !Number.isFinite(intensity)) {
    return DEFAULT_HERO_OVERLAY_INTENSITY;
  }
  return Math.min(100, Math.max(0, intensity));
}

function formatAlpha(alpha: number): number {
  return Number(Math.min(1, Math.max(0, alpha)).toFixed(4));
}

export function heroOverlayGradient(
  position: HeroTextPosition,
  intensity: number = DEFAULT_HERO_OVERLAY_INTENSITY,
): string {
  const clamped = clampHeroOverlayIntensity(intensity);
  const ratio = clamped / 70;

  if (position.endsWith("Left")) {
    const s1 = formatAlpha(0.7 * ratio);
    const s2 = formatAlpha(0.35 * ratio);
    const s3 = formatAlpha(0.1 * ratio);
    return `linear-gradient(to right, rgba(0, 0, 0, ${s1}), rgba(0, 0, 0, ${s2}), rgba(0, 0, 0, ${s3}))`;
  }

  if (position.endsWith("Right")) {
    const s1 = formatAlpha(0.7 * ratio);
    const s2 = formatAlpha(0.35 * ratio);
    const s3 = formatAlpha(0.1 * ratio);
    return `linear-gradient(to left, rgba(0, 0, 0, ${s1}), rgba(0, 0, 0, ${s2}), rgba(0, 0, 0, ${s3}))`;
  }

  const c1 = formatAlpha(0.62 * ratio);
  const c2 = formatAlpha(0.16 * ratio);
  return `radial-gradient(circle at center, rgba(0, 0, 0, ${c1}), rgba(0, 0, 0, ${c2}) 72%)`;
}

export function heroTextPositionClasses(
  position: HeroTextPosition,
  intensity: number = DEFAULT_HERO_OVERLAY_INTENSITY,
) {
  const vertical = position.startsWith("top")
    ? "items-start"
    : position.startsWith("bottom")
      ? "items-end"
      : "items-center";
  const horizontal = position.endsWith("Left")
    ? "justify-start"
    : position.endsWith("Right")
      ? "justify-end"
      : "justify-center";
  const text = position.endsWith("Left")
    ? "text-left"
    : position.endsWith("Right")
      ? "text-right"
      : "text-center";
  const copy = position.endsWith("Left")
    ? ""
    : position.endsWith("Right")
      ? "ml-auto"
      : "mx-auto";
  const overlay = position.endsWith("Left")
    ? "bg-gradient-to-r from-black/70 via-black/35 to-black/10"
    : position.endsWith("Right")
      ? "bg-gradient-to-l from-black/70 via-black/35 to-black/10"
      : "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.62),rgba(0,0,0,0.16)_72%)]";

  return {
    container: `${vertical} ${horizontal}`,
    content: text,
    copy,
    overlay,
    overlayGradient: heroOverlayGradient(position, intensity),
  };
}
