export type CustomPageCoverMode =
  | "full"
  | "flexible"
  | "fit"
  | "fill"
  | "crop";
export type CustomPageCoverBorderStyle =
  | "solid"
  | "dashed"
  | "dotted"
  | "double";
export type CustomPageCoverShadow = "none" | "soft" | "strong";

const shadowClasses: Record<CustomPageCoverShadow, string> = {
  none: "",
  soft: "shadow-md shadow-black/10",
  strong: "shadow-xl shadow-black/15",
};

export function CustomPageCover({
  src,
  alt,
  mode,
  width = 75,
  positionX = 50,
  positionY = 50,
  zoom = 1,
  borderWidth = 0,
  borderStyle = "solid",
  borderColor = "#231f20",
  borderRadius = 32,
  shadow = "strong",
  className = "",
}: {
  src: string;
  alt: string;
  mode: CustomPageCoverMode;
  width?: number;
  positionX?: number;
  positionY?: number;
  zoom?: number;
  borderWidth?: number;
  borderStyle?: CustomPageCoverBorderStyle;
  borderColor?: string;
  borderRadius?: number;
  shadow?: CustomPageCoverShadow;
  className?: string;
}) {
  const frameStyle: React.CSSProperties = {
    borderWidth: `${clamp(borderWidth, 0, 16)}px`,
    borderStyle,
    borderColor,
    borderRadius: `${clamp(borderRadius, 0, 64)}px`,
  };
  const frameClassName = `overflow-hidden bg-[var(--surface)] ${shadowClasses[shadow]} ${className}`;

  if (mode === "full" || mode === "flexible") {
    return (
      <div
        className={frameClassName}
        style={
          mode === "flexible"
            ? {
                ...frameStyle,
                width: `${clamp(width, 25, 100)}%`,
                marginInline: "auto",
              }
            : frameStyle
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block h-auto w-full select-none"
        />
      </div>
    );
  }

  const isFit = mode === "fit";
  const isCrop = mode === "crop";

  return (
    <div
      className={`aspect-[16/7] ${frameClassName}`}
      style={frameStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`block h-full w-full select-none ${
          isFit ? "object-contain" : "object-cover"
        }`}
        style={
          isCrop
            ? {
                objectPosition: `${positionX}% ${positionY}%`,
                transform: `scale(${zoom})`,
              }
            : undefined
        }
      />
    </div>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
