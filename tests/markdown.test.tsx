import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent } from "../src/components/markdown-content";
import {
  applyMarkdownCommand,
  type MarkdownCommand,
} from "../src/components/markdown-editor";
import { pageEmbedFor } from "../src/lib/page-html";

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

test("GFM tables and strikethrough render, single tildes stay literal", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent>{`About ~20 people, ~~cancelled~~

| Day | Time |
| --- | ---- |
| Mon | 20:00 |`}</MarkdownContent>,
  );

  assert.match(html, /About ~20 people/);
  assert.match(html, /<del>cancelled<\/del>/);
  assert.match(html, /<table>/);
  assert.match(html, /<td>20:00<\/td>/);
});

test("HTML stays skipped unless a page opts in", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent>{`<div class="card">card</div>

<iframe src="https://www.youtube.com/embed/abc"></iframe>`}</MarkdownContent>,
  );

  assert.doesNotMatch(html, /<div class="card"/);
  assert.doesNotMatch(html, /<iframe/);
});

test("page HTML keeps safe markup and Markdown inside it", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent allowHtml>{`<div class="cols-2 fixed inset-0">
<div class="card">

**Bold** inside a card

</div>
<a class="button z-50" href="https://example.com">Go</a>
</div>

<details><summary>More</summary>

- item

</details>

<a href="#contact">Contact</a>

<h2 id="contact">Contact</h2>`}</MarkdownContent>,
  );

  assert.match(html, /<div class="cols-2">/);
  assert.match(html, /<div class="card">\s*<p><strong>Bold<\/strong> inside a card<\/p>/);
  assert.match(html, /<a class="button" href="https:\/\/example.com" target="_blank" rel="noreferrer">/);
  assert.match(html, /<details><summary>More<\/summary>\s*<ul>/);
  assert.match(html, /<a href="#user-content-contact">/);
  assert.match(html, /<h3 id="user-content-contact">/);
  assert.doesNotMatch(html, /fixed|inset-0|z-50/);
});

test("page HTML removes scripts, handlers, styles and unsafe URLs", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent allowHtml>{`<script>alert(1)</script>
<img src="x" onerror="alert(1)">
<svg><script>alert(1)</script></svg>
<a href="javascript:alert(1)">a</a> <a href=" JaVaScRiPt:alert(1)">b</a>
<a href="data:text/html,<script>alert(1)</script>">c</a>
<p style="position:fixed;inset:0" onclick="alert(1)">p</p>
<style>body{display:none}</style>
<form action="/admin"><button formaction="/admin">x</button></form>
<object data="https://example.com/x.swf"></object><embed src="https://example.com/x.swf">
<meta http-equiv="refresh" content="0;url=https://example.com">
<base href="https://example.com/">
<video src="https://example.com/v.mp4" poster="javascript:alert(1)" autoplay></video>
<div id="__next" name="x">clobber</div>`}</MarkdownContent>,
  );

  assert.doesNotMatch(html, /<script|<svg|<style|<form|<object|<embed|<meta|<base/i);
  assert.doesNotMatch(html, /alert|javascript:|data:/i);
  assert.doesNotMatch(html, /onerror|onclick|style=|formaction|autoplay|display:none/i);
  assert.match(html, /<video src="https:\/\/example.com\/v.mp4"><\/video>/);
  assert.match(html, /id="user-content-__next"/);
});

test("page HTML only keeps iframes from known embed providers", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent allowHtml>{`<iframe width="560" height="315" src="https://www.youtube.com/embed/abc" allow="camera; microphone" onload="alert(1)"></iframe>

<iframe src="https://docs.google.com/forms/d/e/abc/viewform?embedded=true" height="900" srcdoc="<script>alert(1)</script>"></iframe>

<iframe src="https://example.com/embed/abc"></iframe>
<iframe src="http://www.youtube.com/embed/abc"></iframe>
<iframe src="https://www.youtube.com.example.com/embed/abc"></iframe>
<iframe src="https://www.google.com/url?q=https://example.com"></iframe>
<iframe src="/admin"></iframe>`}</MarkdownContent>,
  );

  assert.equal(html.match(/<iframe/g)?.length, 2);
  assert.match(html, /src="https:\/\/www.youtube.com\/embed\/abc"[^>]*class="page-embed page-embed-video"/);
  assert.match(html, /src="https:\/\/docs.google.com\/forms\/d\/e\/abc\/viewform\?embedded=true"[^>]*height="900"/);
  assert.match(html, /sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"/);
  assert.doesNotMatch(html, /camera|microphone|alert|srcdoc|allow-top-navigation/);
});

test("embed providers require HTTPS and an exact host", () => {
  assert.deepEqual(pageEmbedFor("https://www.youtube-nocookie.com/embed/abc"), {
    src: "https://www.youtube-nocookie.com/embed/abc",
    kind: "video",
  });
  assert.equal(pageEmbedFor("https://www.google.com/maps/embed?pb=x")?.kind, "frame");
  assert.equal(pageEmbedFor("http://player.vimeo.com/video/1"), null);
  assert.equal(pageEmbedFor("https://evil.youtube.com/embed/abc"), null);
  assert.equal(pageEmbedFor("https://user:pass@www.youtube.com/embed/abc"), null);
  assert.equal(pageEmbedFor("https://www.google.com/search?q=x"), null);
  assert.equal(pageEmbedFor("javascript:alert(1)"), null);
  assert.equal(pageEmbedFor("not a url"), null);
});
