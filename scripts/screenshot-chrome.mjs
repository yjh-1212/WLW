/**
 * 顶部栏、状态栏、省级平台面板的局部放大巡检。
 * 用法：先 npm run dev，再 node scripts/screenshot-chrome.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/?intro=0';

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 3 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'chrome-topbar-left.png'), clip: { x: 0, y: 0, width: 640, height: 72 } });
  await page.screenshot({ path: path.join(OUT, 'chrome-topbar-mid.png'), clip: { x: 620, y: 0, width: 660, height: 72 } });
  await page.screenshot({ path: path.join(OUT, 'chrome-topbar-right.png'), clip: { x: 1260, y: 0, width: 660, height: 72 } });
  await page.screenshot({ path: path.join(OUT, 'chrome-statusbar.png'), clip: { x: 0, y: 1040, width: 1920, height: 40 } });

  await page.evaluate(() => window.__LOGISTICS_MAP__?.drillProvince?.('河南'));
  await page.waitForTimeout(3800);
  await page.screenshot({ path: path.join(OUT, 'chrome-province-combined.png'), fullPage: false });

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
};

run();
