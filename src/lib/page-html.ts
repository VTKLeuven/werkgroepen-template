import { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";

// HTML in custom page content is sanitized against an allow list when the page
// is rendered, never when it is saved, so tightening these rules also applies to
// pages that already exist.

// Classes page HTML may use. Each is styled in globals.css under
// .markdown-content, so content cannot borrow site chrome or Tailwind utilities
// (for example to cover the page with a fixed overlay).
export const pageHtmlClasses = [
  "cols-2",
  "cols-3",
  "card",
  "callout",
  "button",
  "button-outline",
  "center",
  "lead",
  "muted",
] as const;

type PropertyDefinition = NonNullable<
  NonNullable<SanitizeSchema["attributes"]>[string]
>[number];

const defaultAttributes = defaultSchema.attributes ?? {};

// The sanitizer checks the tag specific className rule before the "*" one, and
// an element whose classes all fail that rule keeps none. Tags with their own
// className rule (footnotes, task lists, code languages) therefore need the
// page classes added there too.
function withPageClasses(definitions: PropertyDefinition[]) {
  return definitions.map((definition): PropertyDefinition =>
    typeof definition !== "string" && definition[0] === "className"
      ? [...definition, ...pageHtmlClasses]
      : definition,
  );
}

export const pageHtmlSchema: SanitizeSchema = {
  ...defaultSchema,
  // `style` is unwrapped otherwise, which prints its CSS as page text.
  strip: [...(defaultSchema.strip ?? []), "style"],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "abbr",
    "audio",
    "cite",
    "figcaption",
    "figure",
    "iframe",
    "mark",
    "small",
    "u",
    "video",
  ],
  attributes: {
    ...Object.fromEntries(
      Object.entries(defaultAttributes).map(([tagName, definitions]) => [
        tagName,
        withPageClasses(definitions),
      ]),
    ),
    "*": [...(defaultAttributes["*"] ?? []), ["className", ...pageHtmlClasses]],
    audio: ["controls", "loop", "preload", "src"],
    // Only the address survives; rehypePageEmbeds checks it against
    // pageEmbedProviders and sets every other iframe attribute itself.
    iframe: ["src", "title"],
    source: [...(defaultAttributes.source ?? []), "src", "type"],
    video: ["controls", "loop", "muted", "playsInline", "poster", "preload", "src"],
  },
  protocols: {
    ...defaultSchema.protocols,
    poster: ["http", "https"],
  },
};

type EmbedKind = "video" | "frame";

export const pageEmbedProviders: {
  label: string;
  host: string;
  path: RegExp;
  kind: EmbedKind;
}[] = [
  { label: "YouTube", host: "www.youtube.com", path: /^\/embed\//, kind: "video" },
  { label: "YouTube", host: "youtube.com", path: /^\/embed\//, kind: "video" },
  { label: "YouTube", host: "www.youtube-nocookie.com", path: /^\/embed\//, kind: "video" },
  { label: "Vimeo", host: "player.vimeo.com", path: /^\/video\//, kind: "video" },
  { label: "Google Maps", host: "www.google.com", path: /^\/maps\/embed/, kind: "frame" },
  {
    label: "Google Forms, Docs, Sheets and Slides",
    host: "docs.google.com",
    path: /^\/(forms|document|spreadsheets|presentation)\//,
    kind: "frame",
  },
  { label: "Google Calendar", host: "calendar.google.com", path: /^\/calendar\/embed/, kind: "frame" },
  { label: "Google Drive", host: "drive.google.com", path: /^\/file\/d\/[^/]+\/preview/, kind: "frame" },
  { label: "Microsoft Forms", host: "forms.office.com", path: /^\//, kind: "frame" },
  { label: "Spotify", host: "open.spotify.com", path: /^\/embed\//, kind: "frame" },
  { label: "Canva", host: "www.canva.com", path: /^\/design\//, kind: "frame" },
];

export function pageEmbedFor(src: string) {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;

  const provider = pageEmbedProviders.find(
    ({ host, path }) => url.hostname === host && path.test(url.pathname),
  );
  return provider ? { src: url.href, kind: provider.kind } : null;
}

const embedSandbox = [
  "allow-forms",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-presentation",
  // Safe together only because every allowed host is cross origin: the frame
  // keeps its own origin and cannot reach this site's DOM or cookies.
  "allow-same-origin",
  "allow-scripts",
].join(" ");

const defaultFrameHeight = 480;

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function frameHeight(value: unknown) {
  const height = Number(value);
  return Number.isFinite(height) && height >= 80 && height <= 2000
    ? Math.round(height)
    : defaultFrameHeight;
}

function collectIds(node: HastNode, ids: Set<string>) {
  const id = node.properties?.id;
  if (typeof id === "string") ids.add(id);
  node.children?.forEach((child) => collectIds(child, ids));
}

function transform(node: HastNode, ids: Set<string>, clobberPrefix: string) {
  if (!node.children) return;

  node.children = node.children.filter((child) => {
    if (child.type !== "element") return true;

    if (child.tagName === "iframe") {
      const embed = pageEmbedFor(String(child.properties?.src ?? ""));
      if (!embed) return false;

      const title = child.properties?.title;
      child.children = [];
      child.properties = {
        src: embed.src,
        title: typeof title === "string" && title ? title : "Embedded content",
        className: ["page-embed", `page-embed-${embed.kind}`],
        loading: "lazy",
        referrerPolicy: "strict-origin-when-cross-origin",
        sandbox: embedSandbox,
        allow:
          embed.kind === "video"
            ? "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            : "fullscreen",
        allowFullScreen: true,
        ...(embed.kind === "frame"
          ? { height: frameHeight(child.properties?.height) }
          : {}),
      };
      return true;
    }

    // The sanitizer prefixes every id to prevent DOM clobbering, but leaves
    // links alone. Point in-page links (#contact, footnotes) at the prefixed id.
    const href = child.properties?.href;
    if (child.tagName === "a" && typeof href === "string" && href.startsWith("#")) {
      const target = href.slice(1);
      if (!ids.has(target) && ids.has(clobberPrefix + target)) {
        child.properties = { ...child.properties, href: `#${clobberPrefix}${target}` };
      }
    }

    transform(child, ids, clobberPrefix);
    return true;
  });
}

// Runs after rehype-sanitize: only iframes from pageEmbedProviders stay, with
// fixed sandbox and permission attributes.
export function rehypePageEmbeds() {
  return (tree: HastNode) => {
    const ids = new Set<string>();
    collectIds(tree, ids);
    transform(tree, ids, pageHtmlSchema.clobberPrefix ?? "");
  };
}
