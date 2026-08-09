"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { Field, inputClass } from "@/components/admin-shell";
import {
  CustomPageCover,
  type CustomPageCoverBorderStyle,
  type CustomPageCoverFrameShape,
  type CustomPageCoverMode,
  type CustomPageCoverShadow,
} from "@/components/custom-page-cover";

export type CoverSettings = {
  mode: CustomPageCoverMode;
  width: number;
  positionX: number;
  positionY: number;
  zoom: number;
  borderWidth: number;
  borderStyle: CustomPageCoverBorderStyle;
  borderColor: string;
  borderRadius: number;
  shadow: CustomPageCoverShadow;
};

const coverModes: {
  value: CustomPageCoverMode;
  title: string;
  description: string;
}[] = [
  {
    value: "full",
    title: "Full image",
    description: "Show the complete image at full available width.",
  },
  {
    value: "flexible",
    title: "Flexible size",
    description: "Show the complete image at an adjustable width.",
  },
  {
    value: "fit",
    title: "Fit",
    description: "Keep the whole image visible inside a fixed frame.",
  },
  {
    value: "fill",
    title: "Fill",
    description: "Fill the frame with an automatic centered crop.",
  },
  {
    value: "crop",
    title: "Crop & position",
    description: "Zoom and drag the image to choose the visible portion.",
  },
];

export function CoverSettingsEditor({
  namePrefix,
  value,
  onChange,
  previewUrl,
  previewAlt = "",
  frameShape = "wide",
}: {
  namePrefix: string;
  value: CoverSettings;
  onChange: (nextValue: CoverSettings) => void;
  previewUrl: string | null;
  previewAlt?: string;
  frameShape?: CustomPageCoverFrameShape;
}) {
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    positionX: number;
    positionY: number;
  } | null>(null);

  function patch(nextValue: Partial<CoverSettings>) {
    onChange({ ...value, ...nextValue });
  }

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || value.mode !== "crop") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX =
      ((event.clientX - dragStart.current.clientX) / bounds.width) * 100;
    const deltaY =
      ((event.clientY - dragStart.current.clientY) / bounds.height) * 100;
    patch({
      positionX: clamp(
        dragStart.current.positionX - deltaX / value.zoom,
        0,
        100,
      ),
      positionY: clamp(
        dragStart.current.positionY - deltaY / value.zoom,
        0,
        100,
      ),
    });
  }

  return (
    <div>
      <input
        type="hidden"
        name={`${namePrefix}PositionX`}
        value={value.positionX}
      />
      <input
        type="hidden"
        name={`${namePrefix}PositionY`}
        value={value.positionY}
      />

      <fieldset>
        <legend className="text-sm font-semibold">Image layout</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {coverModes.map((mode) => (
            <label
              key={mode.value}
              className={`cursor-pointer rounded-2xl border p-3 transition ${
                value.mode === mode.value
                  ? "border-[#006d77] bg-[#006d77]/5 ring-2 ring-[#006d77]/10"
                  : "border-black/10 hover:border-black/20"
              }`}
            >
              <span className="flex items-start gap-2">
                <input
                  name={`${namePrefix}DisplayMode`}
                  type="radio"
                  value={mode.value}
                  checked={value.mode === mode.value}
                  onChange={() => patch({ mode: mode.value })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#006d77]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">
                    {mode.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-[#6f6860]">
                    {mode.description}
                  </span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {value.mode === "flexible" ? (
        <label className="mt-5 block text-sm font-semibold">
          <span className="flex items-center justify-between gap-3">
            Image size
            <output>{Math.round(value.width)}%</output>
          </span>
          <input
            name={`${namePrefix}Width`}
            type="range"
            min="25"
            max="100"
            step="1"
            value={value.width}
            onChange={(event) => patch({ width: Number(event.target.value) })}
            className="mt-2 w-full accent-[#006d77]"
          />
          <span className="mt-1 block text-xs font-normal leading-5 text-[#6f6860]">
            The complete image and its frame keep their natural aspect ratio.
          </span>
        </label>
      ) : (
        <input
          type="hidden"
          name={`${namePrefix}Width`}
          value={value.width}
        />
      )}

      {value.mode === "crop" ? (
        <div className="mt-5">
          <label className="block text-sm font-semibold">
            <span className="flex items-center justify-between gap-3">
              Zoom
              <output>{Math.round(value.zoom * 100)}%</output>
            </span>
            <input
              name={`${namePrefix}Zoom`}
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={value.zoom}
              onChange={(event) => patch({ zoom: Number(event.target.value) })}
              className="mt-2 w-full accent-[#006d77]"
            />
          </label>
          <p className="mt-1 text-xs text-[#6f6860]">
            Drag the image below to position the crop.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <RangeField
              label="Horizontal position"
              value={value.positionX}
              min={0}
              max={100}
              onChange={(positionX) => patch({ positionX })}
            />
            <RangeField
              label="Vertical position"
              value={value.positionY}
              min={0}
              max={100}
              onChange={(positionY) => patch({ positionY })}
            />
          </div>
        </div>
      ) : (
        <input type="hidden" name={`${namePrefix}Zoom`} value={value.zoom} />
      )}

      <fieldset className="mt-6 border-t border-black/10 pt-5">
        <legend className="px-1 text-sm font-semibold">Frame style</legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <RangeField
            label="Border thickness"
            name={`${namePrefix}BorderWidth`}
            value={value.borderWidth}
            min={0}
            max={16}
            suffix="px"
            onChange={(borderWidth) => patch({ borderWidth })}
          />
          <RangeField
            label="Corner radius"
            name={`${namePrefix}BorderRadius`}
            value={value.borderRadius}
            min={0}
            max={64}
            step={2}
            suffix="px"
            onChange={(borderRadius) => patch({ borderRadius })}
          />
          <Field label="Border pattern">
            <select
              name={`${namePrefix}BorderStyle`}
              value={value.borderStyle}
              onChange={(event) =>
                patch({
                  borderStyle: event.target
                    .value as CustomPageCoverBorderStyle,
                })
              }
              className={inputClass}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
          </Field>
          <Field label="Shadow">
            <select
              name={`${namePrefix}FrameShadow`}
              value={value.shadow}
              onChange={(event) =>
                patch({ shadow: event.target.value as CustomPageCoverShadow })
              }
              className={inputClass}
            >
              <option value="none">None</option>
              <option value="soft">Soft</option>
              <option value="strong">Strong</option>
            </select>
          </Field>
          <Field label="Border color">
            <span className="flex min-w-0 items-center gap-2 rounded-2xl border border-black/10 bg-white p-2">
              <input
                type="color"
                value={value.borderColor}
                aria-label="Cover border color picker"
                onChange={(event) => patch({ borderColor: event.target.value })}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent"
              />
              <input
                name={`${namePrefix}BorderColor`}
                value={value.borderColor}
                pattern="#[0-9a-fA-F]{6}"
                aria-label="Cover border hex value"
                onChange={(event) => patch({ borderColor: event.target.value })}
                className="min-w-0 flex-1 bg-transparent px-1 font-mono text-xs font-medium uppercase outline-none"
              />
            </span>
          </Field>
        </div>
      </fieldset>

      <div
        title={
          value.mode === "crop" && previewUrl
            ? "Drag to position the cover crop"
            : undefined
        }
        onPointerDown={(event) => {
          if (value.mode !== "crop" || !previewUrl) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStart.current = {
            clientX: event.clientX,
            clientY: event.clientY,
            positionX: value.positionX,
            positionY: value.positionY,
          };
        }}
        onPointerMove={moveCrop}
        onPointerUp={() => {
          dragStart.current = null;
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
        className={`mt-4 ${
          value.mode === "crop" && previewUrl
            ? "cursor-grab touch-none active:cursor-grabbing"
            : ""
        }`}
      >
        {previewUrl ? (
          <CustomPageCover
            src={previewUrl}
            alt={previewAlt}
            mode={value.mode}
            width={value.width}
            positionX={value.positionX}
            positionY={value.positionY}
            zoom={value.zoom}
            borderWidth={value.borderWidth}
            borderStyle={value.borderStyle}
            borderColor={value.borderColor}
            borderRadius={value.borderRadius}
            shadow={value.shadow}
            frameShape={frameShape}
          />
        ) : (
          <div
            className={`grid place-items-center rounded-2xl border border-black/10 bg-[#f5f1e8] text-[#9b948a] ${
              frameShape === "side" ? "aspect-[4/3]" : "aspect-[16/7]"
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-semibold">
              <ImageIcon size={18} />
              Select an image to preview it
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function RangeField({
  label,
  name,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  name?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs font-semibold text-[#3a352f]">
      <span className="flex items-center justify-between gap-2">
        {label}
        {suffix ? (
          <output>
            {Math.round(value)}{suffix}
          </output>
        ) : null}
      </span>
      <input
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block w-full accent-[#006d77]"
      />
    </label>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
