import assert from "node:assert/strict";
import test from "node:test";
import {
  localizedOptional,
  localizeHref,
} from "../src/lib/i18n";

test("optional translations stay empty instead of borrowing another language", () => {
  assert.equal(localizedOptional("en", "", "Nederlandse tekst"), "");
  assert.equal(localizedOptional("nl", "English text", ""), "");
  assert.equal(localizedOptional("en", "\u200B\u2060", "Nederlandse tekst"), "");
});

test("localized hash links contain one fragment", () => {
  assert.equal(localizeHref("#events", "nl", "dutchOnly"), "/#events");
  assert.equal(
    localizeHref("/#events#events#contact", "en", "englishOnly"),
    "/#events",
  );
  assert.equal(
    localizeHref("/#partners", "nl", "bilingual"),
    "/?lang=nl#partners",
  );
});
