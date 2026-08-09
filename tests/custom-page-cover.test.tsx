import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomPageCover } from "../src/components/custom-page-cover";

test("custom-page cover modes preserve their distinct image behavior", () => {
  const full = renderToStaticMarkup(
    <CustomPageCover src="/photo.png" alt="Photo" mode="full" />,
  );
  const fit = renderToStaticMarkup(
    <CustomPageCover src="/photo.png" alt="Photo" mode="fit" />,
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

  assert.match(full, /h-auto w-full/);
  assert.doesNotMatch(full, /aspect-\[16\/7\]/);
  assert.match(fit, /object-contain/);
  assert.match(fill, /object-cover/);
  assert.doesNotMatch(fill, /transform:/);
  assert.match(crop, /object-position:25% 70%/);
  assert.match(crop, /transform:scale\(1\.5\)/);
});
