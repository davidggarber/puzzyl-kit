import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';

let boilerplateScript: string;

test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'error',
    build: {
      write: false,
      lib: {
        entry: resolve('src', 'boilerplate.ts'),
        name: 'QrTest',
        formats: ['iife'],
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunk = outputs.flatMap(output => 'output' in output ? output.output : [])
    .find(output => output.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') {
    throw new Error('Boilerplate test bundle was not generated');
  }
  boilerplateScript = chunk.code;
});

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => route.fulfill({
    contentType: 'text/html',
    body: '<div id="pageBody"></div>',
  }));
});

test('QR parameter accepts document-relative image paths', async ({ page }) => {
  for (const path of ['img.png', 'QR/img.png', './QR/img.png', '../QR/img.png', ' QR/img.png ']) {
    await page.goto('http://qr.test/puzzles/page.html');
    await page.addScriptTag({
      content: boilerplateScript + `
        QrTest.urlArgs.qr = ${JSON.stringify(path)};
        QrTest.urlArgs.iframe = true;
        QrTest.testBoilerplate({});
      `,
    });
    await expect(page.locator('#qr')).toHaveAttribute('src', path.trim());
    expect(await page.locator('#qr').evaluate(img => (img as HTMLImageElement).src))
      .toBe(new URL(path.trim(), page.url()).href);
  }
});

test('QR parameter rejects absolute URLs and ambiguous paths with a warning', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => {
    if (message.type() === 'warning') {
      warnings.push(message.text());
    }
  });
  for (const path of [
    true, ' ', 'https://other.test/img.png', 'HTTPS://other.test/img.png',
    '//other.test/img.png', '/QR/img.png', '\\\\other.test\\img.png',
    'QR\\img.png', 'data:image/png;base64,abc', 'javascript:alert(1)',
    'file:///tmp/img.png', 'C:/QR/img.png', 'ht\ttps://other.test/img.png',
    '\n//other.test/img.png', 'QR/\0img.png',
  ]) {
    warnings.length = 0;
    await page.goto('http://qr.test/puzzles/page.html');
    await page.addScriptTag({
      content: boilerplateScript + `
        QrTest.urlArgs.qr = ${JSON.stringify(path)};
        QrTest.urlArgs.iframe = true;
        QrTest.testBoilerplate({});
      `,
    });
    await expect(page.locator('#qr')).toHaveCount(0);
    expect(warnings).toContain('The qr URL parameter must be a relative path.');
  }
});
