/**
 * 图标改造的局部放大回归：抽屉指标卡、图层行、底部状态条。
 * 用法：先 npm run dev，再 node scripts/screenshot-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/';

const CROPS = [
  { state: 'FOCUS_INFRA', name: 'icons-infra-drawer', selector: '#layer-controls' },
  { state: 'FOCUS_INFRA', name: 'icons-infra-strip', selector: '.infra-stat-strip' },
  { state: 'FOCUS_INFRA', name: 'icons-infra-panel', selector: '.infra-insight-panel' },
  { state: 'FOCUS_OPERATION', name: 'icons-operation-panel', selector: '.operation-insight-panel' },
  { state: 'FOCUS_DIGITAL', name: 'icons-digital-drawer', selector: '#layer-controls' },
  { state: 'FOCUS_DIGITAL', name: 'icons-digital-ticker', selector: '.digital-ticker' },
  { state: 'FOCUS_DIGITAL', name: 'icons-digital-panel', selector: '.digital-insight-panel' },
];

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(3500);

  let current = '';
  for (const crop of CROPS) {
    if (crop.state !== current) {
      await page.click(`button[data-map-state="${crop.state}"]`);
      await page.waitForTimeout(3200);
      current = crop.state;
    }
    const target = page.locator(crop.selector).first();
    await target.screenshot({ path: path.join(OUT, `${crop.name}.png`) });
  }

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
};

run();
