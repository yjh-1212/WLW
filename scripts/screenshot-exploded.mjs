/**
 * 三层分解页截图验证。用法：先确保 dev server 在 5173，再 node scripts/screenshot-exploded.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/';

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const shoot = async (width, height, name) => {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3500);
    await page.click('button[data-map-state="EXPLODED"]');
    await page.waitForTimeout(4200);
    await page.screenshot({ path: path.join(OUT, name) });
    const info = await page.evaluate(() => ({
      workspaceVisible: getComputedStyle(document.querySelector('#exploded-workspace')).opacity !== '0',
      cards: document.querySelectorAll('.exploded-layer-card').length,
      kpis: document.querySelectorAll('.exploded-kpi').length,
      connectors: window.__LOGISTICS_MAP__?.stackConnectorRoot?.visible ?? null,
      z: [
        window.__LOGISTICS_MAP__?.layers?.infrastructure?.position?.z,
        window.__LOGISTICS_MAP__?.layers?.operation?.position?.z,
        window.__LOGISTICS_MAP__?.layers?.digital?.position?.z,
      ],
    }));
    await page.close();
    return info;
  };

  const report = {
    '1920x1080': await shoot(1920, 1080, 'exploded-1920.png'),
    '2560x1440': await shoot(2560, 1440, 'exploded-2560.png'),
    '1365x768': await shoot(1365, 768, 'exploded-16x9.png'),
  };
  console.log(JSON.stringify({ report, errors }, null, 2));
  await browser.close();
};

run();
