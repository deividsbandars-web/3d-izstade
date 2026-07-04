import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = process.argv[2] || 'http://127.0.0.1:5173';
const outDir = path.resolve(process.argv[3] || 'review_artifacts/warpala-expo-marketplaces');
const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const boothSlots = [
  {
    band: 'arrival',
    boothType: 'standard',
    heldUntil: null,
    kind: 'standard',
    lane: 'left',
    nodeType: 'booth',
    priceCents: 150000,
    priceLabel: 'EUR 1,500',
    reservationId: null,
    rotationY: 0,
    screenClass: 'support',
    slotId: 'arrival-left-standard-0',
    sponsorTier: 'standard',
    status: 'available',
    tier: 'common',
    xOffset: -14,
    zOffset: -42,
  },
  {
    band: 'showcase',
    boothType: 'premium',
    heldUntil: null,
    kind: 'endcap',
    lane: 'center',
    nodeType: 'booth',
    priceCents: 350000,
    priceLabel: 'EUR 3,500',
    reservationId: null,
    rotationY: 0,
    screenClass: 'presentation',
    slotId: 'showcase-center-endcap-0',
    sponsorTier: 'gold',
    status: 'available',
    tier: 'premium',
    xOffset: 0,
    zOffset: -10,
  },
  {
    band: 'media',
    boothType: 'hero',
    heldUntil: null,
    kind: 'hero',
    lane: 'right',
    nodeType: 'booth',
    priceCents: 750000,
    priceLabel: 'EUR 7,500',
    reservationId: null,
    rotationY: 0,
    screenClass: 'large-format',
    slotId: 'media-right-hero-0',
    sponsorTier: 'hero',
    status: 'available',
    tier: 'hero',
    xOffset: 16,
    zOffset: 28,
  },
  {
    band: 'discovery',
    boothType: 'standard',
    heldUntil: null,
    kind: 'standard',
    lane: 'right',
    nodeType: 'booth',
    priceCents: 120000,
    priceLabel: 'EUR 1,200',
    reservationId: null,
    rotationY: 0,
    screenClass: 'support',
    slotId: 'discovery-right-standard-0',
    sponsorTier: 'standard',
    status: 'assigned',
    tier: 'common',
    xOffset: 12,
    zOffset: 54,
  },
];

async function screenshotStats(filePath) {
  const stats = await sharp(filePath).stats();
  if (stats.entropy < 0.2) {
    throw new Error(`${filePath} appears visually blank`);
  }
  return { entropy: stats.entropy, path: filePath };
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 8) {
    throw new Error(`${label} has ${overflow}px horizontal overflow`);
  }
  return overflow;
}

async function assertTextAbsent(page, text) {
  const found = await page.getByText(text, { exact: false }).count();
  if (found > 0) {
    throw new Error(`Outdated marketplace copy is still visible: ${text}`);
  }
}

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];

try {
  for (const viewport of [
    { height: 900, name: 'desktop', width: 1440 },
    { height: 844, name: 'mobile', width: 390 },
  ]) {
    const context = await browser.newContext({
      hasTouch: viewport.name === 'mobile',
      isMobile: viewport.name === 'mobile',
      viewport: { height: viewport.height, width: viewport.width },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/expo/booth-slots', (route) => route.fulfill({
      body: JSON.stringify({ generatedAt: new Date().toISOString(), slots: boothSlots }),
      contentType: 'application/json',
      status: 200,
    }));

    await page.goto(`${baseUrl}/expo/booth-marketplace`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.getByRole('heading', { name: /Rent a sponsor booth/i }).waitFor({ timeout: 10_000 });
    await page.getByRole('heading', { name: 'Choose a location' }).waitFor({ timeout: 10_000 });
    await page.getByText('Selected booth location').waitFor({ timeout: 10_000 });
    await assertTextAbsent(page, 'server-authored');
    await assertTextAbsent(page, 'Payment creates the public scene assignment');
    const boothChatButtons = await page.getByRole('button', { name: /Open global chat/i }).count();
    if (viewport.name === 'mobile' && boothChatButtons > 0) {
      throw new Error('Mobile booth marketplace should not show the closed global chat bubble');
    }
    const boothOverflow = await assertNoHorizontalOverflow(page, `booth marketplace ${viewport.name}`);
    const boothPath = path.join(outDir, `booth-marketplace-${viewport.name}.png`);
    await page.screenshot({ fullPage: true, path: boothPath });

    await page.goto(`${baseUrl}/expo/city-screens`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.getByRole('heading', { name: /Rent a specific screen/i }).waitFor({ timeout: 10_000 });
    await page.locator('section[aria-label="Selected city screen map"]').waitFor({ timeout: 10_000 });
    await page.getByText('Selected screen').waitFor({ timeout: 10_000 });
    await page.getByText('Screen code').waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: /Show Right Marquee hero screen/i }).click();
    await page.locator('section[aria-label="Selected city screen map"]').getByRole('heading', { name: /Right Marquee hero screen/i }).waitFor({ timeout: 10_000 });
    await page.getByText('Your campaign').first().waitFor({ timeout: 10_000 });
    await page.getByRole('link', { name: /Rent this screen/i }).first().waitFor({ timeout: 10_000 });
    await assertTextAbsent(page, 'Video supported with quality and distance limits');
    const cityScreenChatButtons = await page.getByRole('button', { name: /Open global chat/i }).count();
    if (viewport.name === 'mobile' && cityScreenChatButtons > 0) {
      throw new Error('Mobile city screen marketplace should not show the closed global chat bubble');
    }
    const cityScreenOverflow = await assertNoHorizontalOverflow(page, `city screen marketplace ${viewport.name}`);
    const cityScreenPath = path.join(outDir, `city-screen-marketplace-${viewport.name}.png`);
    await page.screenshot({ fullPage: true, path: cityScreenPath });

    await page.goto(`${baseUrl}/expo/sponsor-packages`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.getByRole('heading', { name: /Sponsor a Web3D expo city/i }).waitFor({ timeout: 10_000 });
    await page.getByRole('heading', { name: /Request a sponsor quote/i }).waitFor({ timeout: 10_000 });
    await page.getByText('Buyer links').waitFor({ timeout: 10_000 });
    await assertTextAbsent(page, 'local backup');
    await assertTextAbsent(page, 'backend lead flow');
    await assertTextAbsent(page, 'Sponsor lead inbox');
    const sponsorChatButtons = await page.getByRole('button', { name: /Open global chat/i }).count();
    if (viewport.name === 'mobile' && sponsorChatButtons > 0) {
      throw new Error('Mobile sponsor packages should not show the closed global chat bubble');
    }
    const sponsorOverflow = await assertNoHorizontalOverflow(page, `sponsor packages ${viewport.name}`);
    const sponsorPath = path.join(outDir, `sponsor-packages-${viewport.name}.png`);
    await page.screenshot({ fullPage: true, path: sponsorPath });

    results.push({
      boothOverflow,
      boothScreenshot: await screenshotStats(boothPath),
      cityScreenOverflow,
      cityScreenScreenshot: await screenshotStats(cityScreenPath),
      errors,
      sponsorOverflow,
      sponsorScreenshot: await screenshotStats(sponsorPath),
      viewport,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'result.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
