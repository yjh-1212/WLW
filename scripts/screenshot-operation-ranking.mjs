import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:5173/?intro=0', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.click('button[data-map-state="FOCUS_OPERATION"]');
  await page.waitForTimeout(2800);
  const info = await page.evaluate(() => ({
    focus: Boolean(document.querySelector('.operation-focus-task')),
    ranks: document.querySelectorAll('[data-operation-rank-panel="flows"] li').length,
    title: document.querySelector('.operation-ranking header b')?.textContent,
    panels: [...document.querySelectorAll('.operation-insight-panel .operation-panel-section:not([hidden]) header b, .operation-insight-panel .operation-insight-head b')]
      .map((el) => el.textContent),
  }));
  await page.locator('.operation-insight-panel').first().screenshot({ path: '.shots/operation-ranking-expanded.png' });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
};

run();
