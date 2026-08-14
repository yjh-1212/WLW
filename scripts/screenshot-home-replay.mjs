/**
 * 验证“每次点击首页都从开场地球重新开始”：
 * 首屏演出 → 收尾 → 切三层分解 → 点回首页应重新出现地球 → 再点首页仍重播。
 * 用法：先启动 dev server（5173），再 node scripts/screenshot-home-replay.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/';

const homeState = () => {
  const runtime = window.__LOGISTICS_MAP__;
  return {
    introActive: Boolean(runtime?.homeIntro?.active),
    globeInScene: Boolean(runtime?.scene?.getObjectByName?.('HomeGlobeIntro')),
    corridors: runtime?.homeIntro?.corridors?.length ?? 0,
    reveal: Number((runtime?.homeIntroReveal ?? 1).toFixed(2)),
    state: runtime?.stateMachine?.state,
    introPlaying: document.querySelector('.app-shell')?.classList.contains('intro-playing'),
  };
};

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
  const firstLoad = await page.evaluate(homeState);
  await page.screenshot({ path: path.join(OUT, 'home-replay-first.png') });

  // 自然收尾到中国地图
  await page.waitForTimeout(10000);
  const settled = await page.evaluate(homeState);

  // 切到三层分解，再点回首页
  await page.click('button[data-map-state="EXPLODED"]');
  await page.waitForTimeout(2000);
  const exploded = await page.evaluate(homeState);
  await page.click('button[data-map-state="COMBINED"]');
  await page.waitForTimeout(900);
  const replayFromExploded = await page.evaluate(homeState);
  await page.screenshot({ path: path.join(OUT, 'home-replay-from-exploded.png') });

  // 已经在首页时再点一次首页，仍要重播
  await page.waitForTimeout(9500);
  const settledAgain = await page.evaluate(homeState);
  await page.click('button[data-map-state="COMBINED"]');
  await page.waitForTimeout(900);
  const replayOnHome = await page.evaluate(homeState);
  await page.screenshot({ path: path.join(OUT, 'home-replay-on-home.png') });

  console.log(JSON.stringify({
    firstLoad,
    settled,
    exploded,
    replayFromExploded,
    settledAgain,
    replayOnHome,
    errors,
  }, null, 2));
  await browser.close();
};

run();
