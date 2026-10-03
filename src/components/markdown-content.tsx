import Markdown, { type Options as MarkdownOptions } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { pageHtmlSchema, rehypePageEmbeds } from "@/lib/page-html";

// Single tildes stay literal, so text written before GFM such as "~20 people"
// does not turn into strikethrough.
const remarkPlugins: MarkdownOptions["remarkPlugins"] = [
  [remarkGfm, { singleTilde: false }],
];

// rehype-raw must run first so the sanitizer sees the HTML as elements.
const htmlRehypePlugins: MarkdownOptions["rehypePlugins"] = [
  rehypeRaw,
  [rehypeSanitize, pageHtmlSchema],
  rehypePageEmbeds,
];

// The sanitizer already prefixes ids, so footnotes must not be prefixed twice.
const htmlRemarkRehypeOptions: MarkdownOptions["remarkRehypeOptions"] = {
  clobberPrefix: "",
};

export function MarkdownContent({
  children,
  className = "",
  headingOffset = 1,
  allowHtml = false,
}: {
  children: string | null | undefined;
  className?: string;
  headingOffset?: 1 | 2 | 3;
  // Renders HTML through the pageHtmlSchema allow list instead of dropping it.
  allowHtml?: boolean;
}) {
  const source = children?.trim();

  if (!source) return null;

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <Markdown
        skipHtml={!allowHtml}
        remarkPlugins={remarkPlugins}
        rehypePlugins={allowHtml ? htmlRehypePlugins : undefined}
        remarkRehypeOptions={allowHtml ? htmlRemarkRehypeOptions : undefined}
        components={{
          h1({ node, ...props }) {
            void node;
            if (headingOffset === 3) return <h4 {...props} />;
            if (headingOffset === 2) return <h3 {...props} />;
            return <h2 {...props} />;
          },
          h2({ node, ...props }) {
            void node;
            if (headingOffset === 3) return <h5 {...props} />;
            if (headingOffset === 2) return <h4 {...props} />;
            return <h3 {...props} />;
          },
          h3({ node, ...props }) {
            void node;
            if (headingOffset === 3) return <h6 {...props} />;
            if (headingOffset === 2) return <h5 {...props} />;
            return <h4 {...props} />;
          },
          a({ node, href, children: linkChildren, ...props }) {
            void node;
            const external = /^(https?:)?\/\//i.test(href ?? "");
            return (
              <a
                {...props}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
              >
                {linkChildren}
              </a>
            );
          },
          img({ node, alt = "", ...props }) {
            void node;
            // Markdown images can point at uploaded /media assets or remote URLs,
            // neither of which has dimensions known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            return <img {...props} alt={alt} loading="lazy" />;
          },
        }}
      >
        {source}
      </Markdown>
    </div>
  );
}
