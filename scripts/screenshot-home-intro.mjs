/**
 * 首页开场演出验证：全球地球 → 镜头推进 → 中国地图定格，
 * 并检查跳过、关闭开场、开场中切页/起流程时的隔离表现。
 * 用法：先启动 dev server（5173），再 node scripts/screenshot-home-intro.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../.shots/', import.meta.url));
const BASE = process.env.SHOT_BASE_URL ?? 'http://localhost:5173/';
// 演出按时间推进，而截图会阻塞渲染循环，因此逐帧取图时直接把演出时钟拨到指定秒数。
const FRAMES = [0.8, 2.6, 4.2, 4.8, 5.4, 6.1, 7];

const homeState = () => {
  const runtime = window.__LOGISTICS_MAP__;
  return {
    introActive: Boolean(runtime?.homeIntro?.active),
    reveal: Number((runtime?.homeIntroReveal ?? 1).toFixed(2)),
    globeInScene: Boolean(runtime?.scene?.getObjectByName?.('HomeGlobeIntro')),
    controlsEnabled: Boolean(runtime?.controls?.enabled),
    camera: runtime?.camera?.position?.toArray?.().map((value) => Number(value.toFixed(1))),
    storyActive: Boolean(runtime?.story?.active),
    state: runtime?.stateMachine?.state,
    homePage: document.querySelector('.app-shell')?.classList.contains('home-page'),
    introPlaying: document.querySelector('.app-shell')?.classList.contains('intro-playing'),
  };
};

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const openPage = async (url = BASE) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    return page;
  };

  // 1. 逐帧检查三段演出
  const framePage = await openPage();
  await framePage.waitForFunction(() => Boolean(window.__LOGISTICS_MAP__?.homeIntro?.active), null, { timeout: 30000 });
  const timeline = [];
  for (const seconds of FRAMES) {
    await framePage.evaluate((time) => {
      const runtime = window.__LOGISTICS_MAP__;
      const intro = runtime?.homeIntro;
      if (!intro?.active) return;
      // 冻结场景时钟，否则截图耗时会让演出继续推进。
      const frozen = runtime.clock.getElapsedTime();
      runtime.clock.getElapsedTime = () => frozen;
      intro.startedAt = frozen - time;
    }, seconds);
    await framePage.waitForTimeout(240);
    const name = `home-intro-${seconds.toFixed(1).replace('.', 'p')}s.png`;
    await framePage.screenshot({ path: path.join(OUT, name) });
    timeline.push({ name, state: await framePage.evaluate(homeState) });
  }
  await framePage.close();

  // 2. 自然收尾 → 三层分解 → 回到首页（开场不重播）
  const flowPage = await openPage();
  await flowPage.waitForTimeout(11000);
  await flowPage.screenshot({ path: path.join(OUT, 'home-stage3-china.png') });
  const settled = await flowPage.evaluate(homeState);
  await flowPage.click('button[data-map-state="EXPLODED"]');
  await flowPage.waitForTimeout(2600);
  await flowPage.screenshot({ path: path.join(OUT, 'home-then-exploded.png') });
  await flowPage.click('button[data-map-state="COMBINED"]');
  await flowPage.waitForTimeout(2200);
  await flowPage.screenshot({ path: path.join(OUT, 'home-return.png') });
  const returned = await flowPage.evaluate(homeState);
  await flowPage.close();

  // 3. 开场中点击 → 立即定格
  const skipPage = await openPage();
  await skipPage.waitForFunction(() => Boolean(window.__LOGISTICS_MAP__?.homeIntro?.active), null, { timeout: 30000 });
  await skipPage.mouse.click(960, 620);
  await skipPage.waitForTimeout(1600);
  await skipPage.screenshot({ path: path.join(OUT, 'home-skip.png') });
  const skipped = await skipPage.evaluate(homeState);
  await skipPage.close();

  // 4. 关闭开场参数
  const plainPage = await openPage(`${BASE}?intro=0`);
  await plainPage.waitForTimeout(3200);
  await plainPage.screenshot({ path: path.join(OUT, 'home-no-intro.png') });
  const noIntro = await plainPage.evaluate(homeState);
  await plainPage.close();

  // 5. 开场中直接进业务流程
  const storyPage = await openPage();
  await storyPage.waitForFunction(() => Boolean(window.__LOGISTICS_MAP__?.homeIntro?.active), null, { timeout: 30000 });
  await storyPage.click('[data-story="northGrain"], [data-story-launch="northGrain"], button:has-text("北粮南运")');
  await storyPage.waitForTimeout(3200);
  await storyPage.screenshot({ path: path.join(OUT, 'home-story-during-intro.png') });
  const storyDuringIntro = await storyPage.evaluate(homeState);
  await storyPage.close();

  console.log(JSON.stringify({
    timeline,
    settled,
    returned,
    skipped,
    noIntro,
    storyDuringIntro,
    errors,
  }, null, 2));
  await browser.close();
};

run();
