import Markdown from "react-markdown";

export function MarkdownContent({
  children,
  className = "",
  headingOffset = 1,
}: {
  children: string | null | undefined;
  className?: string;
  headingOffset?: 1 | 2 | 3;
}) {
  const source = children?.trim();

  if (!source) return null;

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <Markdown
        skipHtml
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
