import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomPageCover } from "../src/components/custom-page-cover";
import {
  CoverSettingsEditor,
  type CoverSettings,
} from "../src/components/cover-settings-editor";

const flexibleSettings: CoverSettings = {
  mode: "flexible",
  width: 61,
  positionX: 50,
  positionY: 50,
  zoom: 1,
  borderWidth: 3,
  borderStyle: "solid",
  borderColor: "#123456",
  borderRadius: 20,
  shadow: "soft",
};

test("custom-page cover modes preserve their distinct image behavior", () => {
  const full = renderToStaticMarkup(
    <CustomPageCover src="/photo.png" alt="Photo" mode="full" />,
  );
  const fit = renderToStaticMarkup(
    <CustomPageCover src="/photo.png" alt="Photo" mode="fit" />,
  );
  const flexible = renderToStaticMarkup(
    <CustomPageCover
      src="/photo.png"
      alt="Photo"
      mode="flexible"
      width={68}
      borderWidth={5}
      borderStyle="dashed"
      borderColor="#123456"
      borderRadius={18}
      shadow="soft"
    />,
  );
  const fill = renderToStaticMarkup(
    <CustomPageCover src="/photo.png" alt="Photo" mode="fill" />,
  );
  const crop = renderToStaticMarkup(
    <CustomPageCover
      src="/photo.png"
      alt="Photo"
      mode="crop"
      positionX={25}
      positionY={70}
      zoom={1.5}
    />,
  );
  const sideFill = renderToStaticMarkup(
    <CustomPageCover
      src="/photo.png"
      alt="Photo"
      mode="fill"
      frameShape="side"
    />,
  );

  assert.match(full, /h-auto w-full/);
  assert.doesNotMatch(full, /aspect-\[16\/7\]/);
  assert.match(fit, /object-contain/);
  assert.match(flexible, /inline-size:68%/);
  assert.match(flexible, /data-cover-mode="flexible"/);
  assert.match(flexible, /data-cover-width="68"/);
  assert.match(flexible, /margin-inline:auto/);
  assert.match(flexible, /border-width:5px/);
  assert.match(flexible, /border-style:dashed/);
  assert.match(flexible, /border-color:#123456/);
  assert.match(flexible, /border-radius:18px/);
  assert.match(flexible, /shadow-md/);
  assert.doesNotMatch(flexible, /aspect-\[16\/7\]/);
  assert.match(fill, /object-cover/);
  assert.doesNotMatch(fill, /transform:/);
  assert.match(crop, /object-position:25% 70%/);
  assert.match(crop, /transform:scale\(1\.5\)/);
  assert.match(sideFill, /aspect-\[4\/3\]/);
});

test("cover editor submits flexible sizing for custom and About images", () => {
  const customPageEditor = renderToStaticMarkup(
    <CoverSettingsEditor
      namePrefix="cover"
      value={flexibleSettings}
      onChange={() => undefined}
      previewUrl="/photo.png"
    />,
  );
  const aboutEditor = renderToStaticMarkup(
    <CoverSettingsEditor
      namePrefix="aboutCover"
      value={flexibleSettings}
      onChange={() => undefined}
      previewUrl="/photo.png"
      frameShape="side"
    />,
  );

  assert.match(customPageEditor, /name="coverDisplayMode"/);
  assert.match(customPageEditor, /name="coverWidth"[^>]*value="61"/);
  assert.match(customPageEditor, /data-cover-width="61"/);
  assert.match(aboutEditor, /name="aboutCoverDisplayMode"/);
  assert.match(aboutEditor, /name="aboutCoverWidth"[^>]*value="61"/);
  assert.match(aboutEditor, /data-cover-width="61"/);
});
