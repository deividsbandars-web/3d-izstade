import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:5173';
const outDir = path.resolve(process.argv[3] || 'review_artifacts/warpala-city-screen-campaign-flow');
const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const route = '/expo/admin?task=city-screen&screen=city-right-marquee-hero';
const results = [];

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });

try {
  for (const target of [
    { height: 1000, name: 'desktop', width: 1440 },
    { height: 844, name: 'mobile', width: 390 },
  ]) {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: { height: target.height, width: target.width },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.getByText('Choose dates and add the advertisement').waitFor({ timeout: 15_000 });
    const screenshotPath = path.join(outDir, `city-screen-campaign-${target.name}.png`);
    await page.screenshot({ fullPage: true, path: screenshotPath });

    results.push({
      errors,
      name: target.name,
      pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
      screenshotPath,
      statusLabel: await page.locator('.company-admin-campaign-status').textContent(),
      viewport: { height: target.height, width: target.width },
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'result.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
