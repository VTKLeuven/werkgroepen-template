"use client";

import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Pencil,
  Quote,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

export type MarkdownCommand =
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "code"
  | "link"
  | "bullet"
  | "numbered"
  | "quote"
  | "rule";

type EditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const toolbar: {
  command: MarkdownCommand;
  label: string;
  icon: typeof Bold;
}[] = [
  { command: "h1", label: "Heading 1", icon: Heading1 },
  { command: "h2", label: "Heading 2", icon: Heading2 },
  { command: "h3", label: "Heading 3", icon: Heading3 },
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "code", label: "Code block", icon: Code2 },
  { command: "link", label: "Link", icon: Link2 },
  { command: "bullet", label: "Bulleted list", icon: List },
  { command: "numbered", label: "Numbered list", icon: ListOrdered },
  { command: "quote", label: "Quote", icon: Quote },
  { command: "rule", label: "Horizontal line", icon: Minus },
];

type SubmitControl = HTMLButtonElement | HTMLInputElement;
type FormUploadLock = {
  count: number;
  controls: Map<SubmitControl, boolean>;
  previousBusy: string | null;
};

const formUploadLocks = new WeakMap<HTMLFormElement, FormUploadLock>();

function lockFormWhileUploading(form: HTMLFormElement) {
  const existing = formUploadLocks.get(form);
  if (existing) {
    existing.count += 1;
    return;
  }

  const controls = new Map<SubmitControl, boolean>();
  form
    .querySelectorAll<SubmitControl>(
      'button[type="submit"], button:not([type]), input[type="submit"]',
    )
    .forEach((control) => {
      controls.set(control, control.disabled);
      control.disabled = true;
    });

  formUploadLocks.set(form, {
    count: 1,
    controls,
    previousBusy: form.getAttribute("aria-busy"),
  });
  form.setAttribute("aria-busy", "true");
}

function unlockFormAfterUploading(form: HTMLFormElement) {
  const lock = formUploadLocks.get(form);
  if (!lock) return;

  lock.count -= 1;
  if (lock.count > 0) return;

  lock.controls.forEach((wasDisabled, control) => {
    control.disabled = wasDisabled;
  });
  if (lock.previousBusy === null) form.removeAttribute("aria-busy");
  else form.setAttribute("aria-busy", lock.previousBusy);
  formUploadLocks.delete(form);
}

export function MarkdownEditor({
  name,
  ariaLabel,
  value,
  defaultValue = "",
  onChange,
  required = false,
  placeholder = "Write with Markdown…",
  minHeight = "15rem",
  headingOffset = 1,
}: {
  name: string;
  ariaLabel: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  minHeight?: string;
  headingOffset?: 1 | 2 | 3;
}) {
  const [internalSource, setInternalSource] = useState(defaultValue);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const source = value ?? internalSource;
  const sourceRef = useRef(source);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    if (!uploading) return;
    const form = textareaRef.current?.form;
    if (!form) return;

    lockFormWhileUploading(form);
    return () => unlockFormAfterUploading(form);
  }, [uploading]);

  function update(nextValue: string) {
    sourceRef.current = nextValue;
    if (value === undefined) setInternalSource(nextValue);
    onChange?.(nextValue);
  }

  function run(command: MarkdownCommand) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? source.length;
    const end = textarea?.selectionEnd ?? start;
    const result = applyMarkdownCommand(source, start, end, command);
    update(result.value);
    setMode("edit");
    focusSelection(result.selectionStart, result.selectionEnd);
  }

  function focusSelection(start: number, end: number) {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
    });
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;

    const textarea = textareaRef.current;
    const insertionStart = textarea?.selectionStart ?? source.length;
    const insertionEnd = textarea?.selectionEnd ?? insertionStart;
    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("alt", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "The image could not be uploaded.");
      }

      const alt = file.name.replace(/\.[^.]+$/, "") || "Image";
      const result = replaceSelection(
        sourceRef.current,
        insertionStart,
        insertionEnd,
        `![${alt}](${payload.url})`,
      );
      update(result.value);
      setMode("edit");
      focusSelection(result.selectionStart, result.selectionEnd);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "The image could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <div
      aria-busy={uploading}
      className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-[#f8f7f4] p-2">
        <div className="flex rounded-full border border-black/10 bg-white p-1 text-xs font-semibold">
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
              mode === "edit" ? "bg-[#121827] text-white" : "text-[#6f6860]"
            }`}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            type="button"
            aria-pressed={mode === "preview"}
            onClick={() => {
              if (required && !source.trim()) {
                setMode("edit");
                focusSelection(0, 0);
                return;
              }
              setMode("preview");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
              mode === "preview" ? "bg-[#121827] text-white" : "text-[#6f6860]"
            }`}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>

        {mode === "edit" ? (
          <div
            role="toolbar"
            className="flex flex-wrap items-center gap-0.5"
            aria-label={`${ariaLabel} formatting`}
          >
            {toolbar.map(({ command, label, icon: Icon }) => (
              <button
                key={command}
                type="button"
                disabled={uploading}
                aria-label={label}
                title={label}
                onClick={() => run(command)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#3f4654] transition hover:bg-white hover:text-[#006d77] hover:shadow-sm disabled:cursor-wait disabled:opacity-40"
              >
                <Icon size={16} />
              </button>
            ))}
            <button
              type="button"
              aria-label="Upload image"
              title="Upload image"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#3f4654] transition hover:bg-white hover:text-[#006d77] hover:shadow-sm disabled:cursor-wait disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ImageIcon size={16} />
              )}
            </button>
          </div>
        ) : null}
      </div>

      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        name={name}
        value={source}
        required={required}
        readOnly={uploading}
        placeholder={placeholder}
        hidden={mode !== "edit"}
        style={{ minHeight }}
        onChange={(event) => update(event.target.value)}
        className="block w-full resize-y bg-[#f4f6fb] px-4 py-4 font-mono text-sm leading-7 text-[#171c2a] outline-none focus:bg-white"
      />
      {mode === "preview" ? (
        <div
          role="region"
          aria-label={`${ariaLabel} preview`}
          style={{ minHeight }}
          className="bg-white px-5 py-5"
        >
          {source.trim() ? (
            <MarkdownContent headingOffset={headingOffset}>{source}</MarkdownContent>
          ) : (
            <p className="text-sm italic text-[#9b948a]">Nothing to preview yet.</p>
          )}
        </div>
      ) : null}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
        hidden
        tabIndex={-1}
        onChange={(event) => void uploadImage(event.target.files?.[0])}
      />
      {uploading ? (
        <p
          aria-live="polite"
          className="border-t border-[#006d77]/10 bg-[#edf8f8] px-4 py-2 text-xs font-semibold text-[#006d77]"
        >
          Uploading image… Save will be available when it finishes.
        </p>
      ) : null}
      {uploadError ? (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
        >
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

export function applyMarkdownCommand(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  command: MarkdownCommand,
): EditResult {
  if (command === "h1" || command === "h2" || command === "h3") {
    return prefixLines(
      value,
      selectionStart,
      selectionEnd,
      `${"#".repeat(Number(command.slice(1)))} `,
      true,
    );
  }

  if (command === "bullet") {
    return prefixLines(value, selectionStart, selectionEnd, "- ");
  }

  if (command === "numbered") {
    return prefixLines(value, selectionStart, selectionEnd, (_, index) => `${index + 1}. `);
  }

  if (command === "quote") {
    return prefixLines(value, selectionStart, selectionEnd, "> ");
  }

  if (command === "bold") {
    return wrapSelection(value, selectionStart, selectionEnd, "**", "**", "bold text");
  }

  if (command === "italic") {
    return wrapSelection(value, selectionStart, selectionEnd, "_", "_", "italic text");
  }

  if (command === "link") {
    const selected = value.slice(selectionStart, selectionEnd) || "link text";
    const inserted = `[${selected}](https://example.com)`;
    const result = replaceSelection(value, selectionStart, selectionEnd, inserted);
    const urlStart = selectionStart + inserted.lastIndexOf("https://");
    return {
      ...result,
      selectionStart: urlStart,
      selectionEnd: urlStart + "https://example.com".length,
    };
  }

  if (command === "code") {
    const selected = value.slice(selectionStart, selectionEnd) || "code";
    const leading = selectionStart > 0 && value[selectionStart - 1] !== "\n" ? "\n\n" : "";
    const trailing = selectionEnd < value.length && value[selectionEnd] !== "\n" ? "\n\n" : "";
    const inserted = `${leading}\`\`\`\n${selected}\n\`\`\`${trailing}`;
    const result = replaceSelection(value, selectionStart, selectionEnd, inserted);
    const contentStart = selectionStart + leading.length + 4;
    return {
      ...result,
      selectionStart: contentStart,
      selectionEnd: contentStart + selected.length,
    };
  }

  const leading = selectionStart > 0 && !value.slice(0, selectionStart).endsWith("\n\n")
    ? "\n\n"
    : "";
  const trailing = selectionEnd < value.length && !value.slice(selectionEnd).startsWith("\n\n")
    ? "\n\n"
    : "";
  return replaceSelection(value, selectionStart, selectionEnd, `${leading}---${trailing}`);
}

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string,
): EditResult {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const result = replaceSelection(
    value,
    selectionStart,
    selectionEnd,
    `${before}${selected}${after}`,
  );
  return {
    ...result,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selected.length,
  };
}

function prefixLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string | ((line: string, index: number) => string),
  replaceHeading = false,
): EditResult {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selected = value.slice(lineStart, lineEnd);
  const transformed = selected
    .split("\n")
    .map((line, index) => {
      const cleanLine = replaceHeading ? line.replace(/^#{1,6}\s+/, "") : line;
      const linePrefix = typeof prefix === "function" ? prefix(cleanLine, index) : prefix;
      return `${linePrefix}${cleanLine}`;
    })
    .join("\n");

  return {
    value: `${value.slice(0, lineStart)}${transformed}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + transformed.length,
  };
}

function replaceSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  inserted: string,
): EditResult {
  const cursor = selectionStart + inserted.length;
  return {
    value: `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}
