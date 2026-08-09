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

export function heroTextPositionClasses(position: HeroTextPosition) {
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
  };
}
