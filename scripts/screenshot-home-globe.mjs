/**
 * 首页开场地球单帧取图：只看星空、正对中国的地球与国际通道飞线，用于调色。
 * 用法：先启动 dev server（5173），再 node scripts/screenshot-home-globe.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/';
const FRAMES = [1.6, 2.4, 3.2];

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.__LOGISTICS_MAP__?.homeIntro?.active), null, { timeout: 30000 });

  for (const seconds of FRAMES) {
    await page.evaluate((time) => {
      const runtime = window.__LOGISTICS_MAP__;
      const intro = runtime?.homeIntro;
      if (!intro?.active) return;
      const frozen = runtime.clock.getElapsedTime();
      runtime.clock.getElapsedTime = () => frozen;
      intro.startedAt = frozen - time;
    }, seconds);
    await page.waitForTimeout(260);
    const tag = seconds.toFixed(1).replace('.', 'p');
    await page.screenshot({ path: path.join(OUT, `home-globe-${tag}s.png`) });
    await page.screenshot({
      path: path.join(OUT, `home-globe-${tag}s-crop.png`),
      clip: { x: 560, y: 120, width: 900, height: 700 },
    });
  }

  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
};

run();
