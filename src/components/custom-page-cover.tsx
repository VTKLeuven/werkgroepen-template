export type CustomPageCoverMode = "full" | "fit" | "fill" | "crop";

export function CustomPageCover({
  src,
  alt,
  mode,
  positionX = 50,
  positionY = 50,
  zoom = 1,
  className = "",
}: {
  src: string;
  alt: string;
  mode: CustomPageCoverMode;
  positionX?: number;
  positionY?: number;
  zoom?: number;
  className?: string;
}) {
  if (mode === "full") {
    return (
      <div className={`overflow-hidden bg-[var(--surface)] ${className}`}>
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
      className={`aspect-[16/7] overflow-hidden bg-[var(--surface)] ${className}`}
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
