#!/usr/bin/env node
// Capture the tower either once or from the configured view manifest.
//
//   screenshot.js URL OUT_PNG
//   screenshot.js --manifest MANIFEST BASE_URL OUT_DIR DATE_TAG SHA_SHORT

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CAPTURES = [
  { suffix: '', viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 },
  { suffix: '-phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { suffix: '-desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

function launchOptions() {
  if (process.env.FAR_KEEPER_CHROMIUM_PATH) {
    console.log(`screenshot: using executablePath=${process.env.FAR_KEEPER_CHROMIUM_PATH}`);
    return { executablePath: process.env.FAR_KEEPER_CHROMIUM_PATH };
  }
  return {};
}

async function capture(browser, url, output, viewport, deviceScaleFactor) {
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  try {
    const page = await context.newPage();
    console.log(`screenshot: navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(750);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    console.log(`screenshot: writing ${output}`);
    await page.screenshot({ path: output, fullPage: true });
  } finally {
    await context.close();
  }
}

async function singleShot(url, output) {
  const browser = await chromium.launch(launchOptions());
  try {
    await capture(browser, url, output, CAPTURES[0].viewport, CAPTURES[0].deviceScaleFactor);
  } finally {
    await browser.close();
  }
  console.log('screenshot: done');
}

async function manifestRun(manifestPath, baseUrl, outputDir, dateTag, shaShort) {
  const views = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(views) || views.length === 0) {
    throw new Error(`manifest ${manifestPath} is empty or not an array`);
  }

  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch(launchOptions());

  try {
    for (const view of views) {
      if (!view.name || !/^[a-z0-9-]+$/.test(view.name) || typeof view.url_path !== 'string') {
        throw new Error(`invalid manifest entry: ${JSON.stringify(view)}`);
      }
      const url = new URL(view.url_path, base).toString();
      const viewSuffix = view.name === 'home' ? '' : `-${view.name}`;

      for (const shot of CAPTURES) {
        const output = path.join(outputDir, `${dateTag}-${shaShort}${viewSuffix}${shot.suffix}.png`);
        await capture(browser, url, output, shot.viewport, shot.deviceScaleFactor);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`screenshot: done — ${views.length} view(s), ${CAPTURES.length} widths each`);
}

(async function () {
  const args = process.argv.slice(2);
  if (args[0] === '--manifest') {
    const [, manifestPath, baseUrl, outputDir, dateTag, shaShort] = args;
    if (!manifestPath || !baseUrl || !outputDir || !dateTag || !shaShort) {
      console.error('screenshot: usage — screenshot.js --manifest MANIFEST BASE_URL OUT_DIR DATE_TAG SHA_SHORT');
      process.exit(2);
    }
    await manifestRun(manifestPath, baseUrl, outputDir, dateTag, shaShort);
    return;
  }

  const [url, output] = args;
  if (!url || !output) {
    console.error('screenshot: usage — screenshot.js URL OUT_PNG');
    console.error('              or — screenshot.js --manifest MANIFEST BASE_URL OUT_DIR DATE_TAG SHA_SHORT');
    process.exit(2);
  }
  await singleShot(url, output);
})().catch((error) => {
  console.error('screenshot: failed —', error.message);
  process.exit(1);
});
