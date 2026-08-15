/**
 * 全页面巡检截图：三层分解、省级下钻三网、右侧详情抽屉、业务流程。
 * 用法：先 npm run dev，再 node scripts/screenshot-pages.mjs
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
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'pages-home.png') });

  await page.click('button[data-map-state="EXPLODED"]');
  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(OUT, 'pages-exploded.png') });

  await page.click('button[data-map-state="FOCUS_OPERATION"]');
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.__LOGISTICS_MAP__?.drillProvince?.('河南'));
  await page.waitForTimeout(3600);
  await page.screenshot({ path: path.join(OUT, 'pages-province-operation.png') });

  await page.click('button[data-map-state="FOCUS_INFRA"]');
  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(OUT, 'pages-province-infra.png') });

  // 右侧详情抽屉
  await page.click('button[data-map-state="COMBINED"]');
  await page.waitForTimeout(2600);
  const opened = await page.evaluate(() => {
    const runtime = window.__LOGISTICS_MAP__;
    const entity = runtime?.entityRegistry?.list?.()?.find?.((item) => item.layer === 'infrastructure');
    if (!entity) return 'no entity';
    runtime.ui.showEntityDetail?.(entity);
    return entity.id;
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'pages-detail-drawer.png') });

  console.log('detail drawer:', opened);
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
};

run();
