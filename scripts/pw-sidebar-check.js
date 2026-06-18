const { chromium } = require('playwright');
const ORIGIN = 'http://18.232.120.51';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${ORIGIN}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@procurement.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const getDesktopAsideWidth = () => page.evaluate(() => document.querySelector('aside.hidden')?.getBoundingClientRect().width);
  console.log('expanded width:', await getDesktopAsideWidth());
  console.log('logo text visible (expanded):', await page.evaluate(() => document.querySelector('aside.hidden')?.innerText.includes('ProcureFlow')));

  await page.click('header button[title="Toggle sidebar"]');
  await page.waitForTimeout(600);
  console.log('collapsed width:', await getDesktopAsideWidth());
  console.log('logo text visible (collapsed):', await page.evaluate(() => document.querySelector('aside.hidden')?.innerText.includes('ProcureFlow')));
  console.log('icon count (collapsed):', await page.evaluate(() => document.querySelector('aside.hidden')?.querySelectorAll('svg').length));
  await page.screenshot({ path: 'shots/sidebar-collapsed-check.png' });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('width persists after reload (localStorage):', await getDesktopAsideWidth());

  await page.click('header button[title="Toggle sidebar"]');
  await page.waitForTimeout(600);
  console.log('width after toggling back:', await getDesktopAsideWidth());

  await browser.close();
})();
