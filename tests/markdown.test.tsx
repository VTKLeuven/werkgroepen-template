import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent } from "../src/components/markdown-content";
import {
  applyMarkdownCommand,
  type MarkdownCommand,
} from "../src/components/markdown-editor";

test("the toolbar inserts the requested Markdown syntax", () => {
  const cases: [MarkdownCommand, string, string][] = [
    ["h1", "Title", "# Title"],
    ["h2", "Title", "## Title"],
    ["h3", "Title", "### Title"],
    ["bold", "strong", "**strong**"],
    ["italic", "emphasis", "_emphasis_"],
    ["bullet", "one\ntwo", "- one\n- two"],
    ["numbered", "one\ntwo", "1. one\n2. two"],
    ["quote", "words", "> words"],
  ];

  for (const [command, source, expected] of cases) {
    assert.equal(
      applyMarkdownCommand(source, 0, source.length, command).value,
      expected,
    );
  }

  assert.match(applyMarkdownCommand("code", 0, 4, "code").value, /```\ncode\n```/);
  assert.equal(
    applyMarkdownCommand("OpenAI", 0, 6, "link").value,
    "[OpenAI](https://example.com)",
  );
  assert.equal(applyMarkdownCommand("", 0, 0, "rule").value, "---");
});

test("preview renders content without enabling raw HTML or unsafe URLs", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent>{`# Heading

- Item

<script>alert(1)</script>

[unsafe](javascript:alert(1))

![photo](/media/example)`}</MarkdownContent>,
  );

  assert.match(html, /<h2>Heading<\/h2>/);
  assert.match(html, /<ul>/);
  assert.match(html, /src="\/media\/example"/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /javascript:/i);
});

test("headings follow the hierarchy of their host section", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent headingOffset={2}>{"# Nested heading"}</MarkdownContent>,
  );

  assert.match(html, /<h3>Nested heading<\/h3>/);
  assert.doesNotMatch(html, /<h1>/);
});
