import { test, expect, Page } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';

let scratchScript: string;

test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'error',
    build: {
      write: false,
      lib: {
        entry: resolve('src', 'scratch.ts'),
        name: 'ScratchTest',
        formats: ['iife'],
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunk = outputs.flatMap(output => 'output' in output ? output.output : [])
    .find(output => output.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') {
    throw new Error('Scratch test bundle was not generated');
  }
  scratchScript = chunk.code;
});

test.beforeEach(async ({ page }) => {
  await page.route('http://scratch.test/**', route => route.fulfill({
    contentType: 'text/html',
    body: `<style>
      #page { position: relative; width: 800px; height: 600px; }
      #scratch-pad { position: absolute; left: 0; top: 0; width: 100%; pointer-events: none; }
      #scratch-pad.topmost { pointer-events: auto; }
      .scratch-div { position: absolute; pointer-events: none; padding: 2px; }
      #scratch-pad.topmost .scratch-div { pointer-events: auto; }
      #scratch-pad textarea { position: absolute; left: -1px; top: -1px; }
      .scratch-drag-handle { position: absolute; width: 20px; height: 20px; left: -14px; top: -14px; }
    </style><div id="page"><p>Puzzle content</p></div>`,
  }));
  await page.goto('http://scratch.test/');
  await page.addScriptTag({ content: scratchScript + '\nScratchTest.setupScratch();' });
  await page.keyboard.down('Control');
  await page.mouse.click(300, 300);
  await page.keyboard.up('Control');
  await page.locator('#scratch-pad textarea').fill('A movable note');
  await setHandleImage(page);
});

async function setHandleImage(page: Page) {
  await page.locator('.scratch-drag-handle').evaluate(handle => {
    (handle as HTMLImageElement).src = 'data:image/svg+xml,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>');
  });
}

async function dragNote(page: Page, dx: number, dy: number, cancel = false) {
  const handle = await page.locator('.scratch-drag-handle').boundingBox();
  if (!handle) {
    throw new Error('Scratch drag handle is not visible');
  }
  const x = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.move(x + dx, y + dy);
  if (cancel) {
    await page.keyboard.press('Escape');
  }
  await page.mouse.up();
}

for (const [direction, dx, dy] of [
  ['left/up', -150, -100],
  ['right/down', 250, 200],
  ['over the note', 40, 30],
] as const) {
  test(`drag handle moves note ${direction} even when the pad has no height`, async ({ page }) => {
    const note = page.locator('.scratch-div');
    const before = await note.evaluate(div => ({ left: div.style.left, top: div.style.top }));
    await expect(page.locator('#scratch-pad')).toHaveCSS('height', '0px');
    await dragNote(page, dx, dy);
    await expect(note).toHaveCSS('left', `${parseFloat(before.left) + dx}px`);
    await expect(note).toHaveCSS('top', `${parseFloat(before.top) + dy}px`);
    await expect(note).not.toHaveClass(/dragging/);
    await expect(page.locator('#scratch-pad textarea')).toBeFocused();
    await expect(page.locator('#scratch-pad textarea')).toHaveValue('A movable note');

    const prevented = await page.locator('#page').evaluate(el =>
      !el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true })));
    expect(prevented).toBe(false);
  });
}

test('drag handle moves a note across a full-page scratch pad', async ({ page }) => {
  await page.locator('#scratch-pad').evaluate(pad => { pad.style.height = '100%'; });
  const note = page.locator('.scratch-div');
  const before = await note.evaluate(div => ({ left: div.style.left, top: div.style.top }));
  await expect(page.locator('#scratch-pad')).toHaveCSS('height', '600px');
  await dragNote(page, -150, -100);
  await expect(note).toHaveCSS('left', `${parseFloat(before.left) - 150}px`);
  await expect(note).toHaveCSS('top', `${parseFloat(before.top) - 100}px`);
  await expect(note).not.toHaveClass(/dragging/);
});

for (const height of ['0px', '100%']) {
  test(`clicking outside a moved note flattens it with pad height ${height}`, async ({ page }) => {
    await page.locator('#scratch-pad').evaluate((pad, value) => {
      pad.style.height = value;
    }, height);
    await dragNote(page, -150, -100);
    await page.locator('#scratch-pad textarea').click();
    await expect(page.locator('#scratch-pad textarea')).toHaveCount(1);
    await page.mouse.click(700, 500);
    await expect(page.locator('#scratch-pad textarea')).toHaveCount(0);
    await expect(page.locator('.scratch-drag-handle')).toHaveCount(0);
    await expect(page.locator('#scratch-pad')).not.toHaveClass(/topmost/);
    await expect(page.locator('.scratch-div')).toHaveText('A movable note');
    await expect(page.locator('.scratch-div')).not.toHaveClass(/dragging/);
  });
}

test('flattening during a drag removes page drop listeners', async ({ page }) => {
  await page.locator('.scratch-drag-handle').dispatchEvent('dragstart', {
    clientX: 290,
    clientY: 290,
  });
  await expect(page.locator('.scratch-div')).toHaveClass(/dragging/);
  await page.locator('#page').dispatchEvent('click', { clientX: 700, clientY: 500 });
  await expect(page.locator('#scratch-pad textarea')).toHaveCount(0);
  await expect(page.locator('.scratch-div')).not.toHaveClass(/dragging/);
  const prevented = await page.locator('#page').evaluate(el =>
    !el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true })));
  expect(prevented).toBe(false);
});

test('cancelled drag and repeated activation do not leave stale drag handlers', async ({ page }) => {
  const note = page.locator('.scratch-div');
  const before = await note.evaluate(div => ({ left: div.style.left, top: div.style.top }));
  await dragNote(page, 120, 100, true);
  await expect(note).toHaveCSS('left', before.left);
  await expect(note).toHaveCSS('top', before.top);
  await expect(note).not.toHaveClass(/dragging/);

  await page.locator('#scratch-pad textarea').press('Escape');
  const bounds = await note.boundingBox();
  if (!bounds) {
    throw new Error('Flattened scratch note is not visible');
  }
  await page.keyboard.down('Control');
  await page.mouse.click(bounds.x + 5, bounds.y + 5);
  await page.keyboard.up('Control');
  await setHandleImage(page);
  await dragNote(page, -100, -100);
  await expect(note).toHaveCSS('left', `${parseFloat(before.left) - 100}px`);
  await expect(note).toHaveCSS('top', `${parseFloat(before.top) - 100}px`);
  await expect(page.locator('#scratch-pad textarea')).toHaveValue('A movable note');
});
