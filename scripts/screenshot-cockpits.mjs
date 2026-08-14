/**
 * 三网驾驶舱截图回归：全国基础/运营/数字 + 数字网省级下钻。
 * 用法：先 npm run dev，再 node scripts/screenshot-cockpits.mjs
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
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(3500);

  const shoot = async (name, state) => {
    await page.click(`button[data-map-state="${state}"]`);
    await page.waitForTimeout(3200);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    return page.evaluate(() => ({
      title: document.querySelector('#network-page-title')?.textContent,
      drawer: document.querySelector('#layer-controls .operation-overview-head')?.innerText.replace(/\n/g, ' · '),
      panels: [...document.querySelectorAll('.operation-insight-panel:not([hidden]) header b')].map((b) => b.textContent),
    }));
  };

  const report = {
    infrastructure: await shoot('national-infrastructure', 'FOCUS_INFRA'),
    operation: await shoot('national-operation', 'FOCUS_OPERATION'),
    digital: await shoot('national-digital', 'FOCUS_DIGITAL'),
  };

  // 数字网 → 省级下钻
  const hit = await page.evaluate(() => {
    const runtime = window.__LOGISTICS_MAP__;
    if (!runtime?.drillProvince) return 'no runtime handle';
    runtime.drillProvince('河南');
    return 'drilled';
  });
  await page.waitForTimeout(3800);
  await page.screenshot({ path: path.join(OUT, 'province-digital.png') });
  report.provinceDrill = hit;
  report.provinceTitle = await page.evaluate(() => document.querySelector('#network-page-title')?.textContent);

  console.log(JSON.stringify(report, null, 2));
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
};

run();
