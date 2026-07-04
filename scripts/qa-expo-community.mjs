import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = process.argv[2] || 'http://127.0.0.1:5173';
const outDir = path.resolve(process.argv[3] || 'review_artifacts/warpala-expo-community');
const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const mockCommunity = {
  entries: [
    { authorLabel: 'City host', body: 'Meet, share and discover what is happening around Sponsor Boulevard.', createdAt: new Date().toISOString(), id: 'qa-message', kind: 'message', status: 'approved', title: 'Today in the city' },
    { authorLabel: 'Demo team', body: 'Short community adverts stay readable and are reviewed before publishing.', createdAt: new Date().toISOString(), id: 'qa-advert', kind: 'advert', status: 'approved', title: 'Small advert space' },
  ],
  graffiti: [
    { authorLabel: 'Visitor', color: '#22d3ee', createdAt: new Date().toISOString(), id: 'qa-mark-1', markText: 'HELLO', placement: { rotationY: 0, surfaceLabel: 'Current city spot', x: -4, y: 2.7, z: -28 }, status: 'approved', wallSlot: 0 },
    { authorLabel: 'Visitor', color: '#f59e0b', createdAt: new Date().toISOString(), id: 'qa-mark-2', logoUrl: `${baseUrl}/community-logo.png`, markText: 'WP', placement: { rotationY: 0.2, surfaceLabel: 'Sponsor lane', x: 18, y: 2.8, z: -42 }, status: 'approved', wallSlot: 1 },
  ],
  limits: { advertBody: 180, graffitiPerHour: 3, graffitiVisibleMinutes: 10, markText: 12, messageBody: 240, title: 48, voiceBytes: 800000, voiceSeconds: 15 },
  persistence: 'process-memory',
};

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const logoPng = await sharp(Buffer.from(`
  <svg width="96" height="54" viewBox="0 0 96 54" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="54" rx="8" fill="#0e7490"/>
    <text x="48" y="34" fill="#ecfeff" font-family="Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle">WP</text>
  </svg>
`)).png().toBuffer();

try {
  for (const target of [
    { height: 900, name: 'desktop', width: 1440 },
    { height: 844, name: 'mobile', width: 390 },
  ]) {
    const context = await browser.newContext({
      hasTouch: target.name === 'mobile',
      isMobile: target.name === 'mobile',
      viewport: { height: target.height, width: target.width },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/community-logo.png', (route) => route.fulfill({ body: logoPng, contentType: 'image/png', status: 200 }));
    await page.route('**/api/expo/community', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockCommunity), status: 200 }));
    await page.goto(`${baseUrl}/expo-3d?communityQa=1`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.locator('canvas').waitFor({ timeout: 20_000 });
    await page.waitForTimeout(2500);
    const canvasPath = path.join(outDir, `community-canvas-${target.name}.png`);
    await page.locator('canvas').screenshot({ path: canvasPath });
    const canvasStats = await sharp(canvasPath).stats();
    if (canvasStats.entropy < 0.2) throw new Error(`${target.name} canvas is visually blank`);
    const cityPath = path.join(outDir, `community-city-${target.name}.png`);
    await page.screenshot({ path: cityPath });
    if (target.name === 'mobile') {
      await page.getByRole('button', { name: 'Explore' }).click();
    }
    const guide = page.locator('[data-expo-city-guide]').first();
    await guide.waitFor({ state: 'visible', timeout: 10_000 });
    const guideBox = await guide.boundingBox();
    for (const label of ['Sponsor booths', 'Rent city screen', 'City board', 'Modular home', 'Request quote']) {
      await guide.getByRole('button', { name: new RegExp(label, 'i') }).waitFor({ state: 'visible', timeout: 5000 });
    }
    await guide.getByText('Messages, voice notes and sprays').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('Live visitors').first().waitFor({ state: 'visible', timeout: 5000 });
    if (await guide.getByText('Messages and graffiti').count()) {
      throw new Error(`${target.name} city guide still shows old graffiti wording`);
    }
    const cityBoardButton = guide.getByRole('button', { name: /City board/i });
    const cityBoardButtonBox = await cityBoardButton.boundingBox();
    if (!guideBox || !cityBoardButtonBox) throw new Error(`${target.name} city guide is not visible`);
    const guidePath = path.join(outDir, `community-guide-${target.name}.png`);
    await page.screenshot({ path: guidePath });
    const cityBoardHitTarget = await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      const button = target?.closest?.('button');
      return button ? `BUTTON.${button.textContent?.trim() || ''}` : target ? `${target.tagName}.${target.className}` : 'none';
    }, { x: cityBoardButtonBox.x + (cityBoardButtonBox.width / 2), y: cityBoardButtonBox.y + (cityBoardButtonBox.height / 2) });
    if (!cityBoardHitTarget.startsWith('BUTTON')) {
      throw new Error(`${target.name} city guide button is covered by ${cityBoardHitTarget}`);
    }
    await cityBoardButton.evaluate((button) => button.click());
    await page.locator('.expo-community-panel').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByText('Temporary city sprays').waitFor({ state: 'visible', timeout: 5000 });
    const sprayButton = page.getByRole('button', { exact: true, name: 'Spray' });
    const tabBox = await sprayButton.boundingBox();
    const entryBox = await page.locator('.expo-community-entry').first().boundingBox();
    if (!tabBox) throw new Error('Spray tab has no visible bounds');
    const hitTarget = await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      return target ? `${target.tagName}.${target.className}` : 'none';
    }, { x: tabBox.x + (tabBox.width / 2), y: tabBox.y + (tabBox.height / 2) });
    await sprayButton.evaluate((button) => button.click());
    await page.getByPlaceholder('Up to 12 characters').fill('WARPALA');
    await page.getByText('Spray target: your current city spot').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'Pick spot in city' }).evaluate((button) => button.click());
    await page.getByText('Aim at a nearby city surface').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('canvas').click({ position: { x: Math.floor(target.width / 2), y: Math.floor(target.height / 2) } });
    await page.locator('.expo-community-panel').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByText('Spray spot selected').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText(/Spray target: selected .+ near X/i).waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('Approved sprays appear as temporary city marks for about 10 minutes').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    const panelPath = path.join(outDir, `community-panel-${target.name}.png`);
    await page.screenshot({ path: panelPath });
    results.push({ canvasEntropy: canvasStats.entropy, canvasPath, cityBoardButtonBox, cityBoardHitTarget, cityPath, entryBox, errors, guideBox, guidePath, hitTarget, panelPath, tabBox, viewport: target });
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'result.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
