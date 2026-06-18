const { chromium } = require('playwright');
const SHOTDIR = 'c:/Users/kondo/OneDrive/Desktop/Procurement-Platform/scripts/shots';
require('fs').mkdirSync(SHOTDIR, { recursive: true });
const ORIGIN = 'http://18.232.120.51';

(async () => {
  const browser = await chromium.launch();
  // 1366x768 is the classic "laptop 100% zoom" size the user reported breaking.
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(`${ORIGIN}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@procurement.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // ---- 1. Invoice Dashboard overflow check at 1366x768 ----
  await page.goto(`${ORIGIN}/invoice-dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const overflowBefore = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  console.log('Invoice Dashboard @1366x768 — scrollWidth:', overflowBefore.scrollW, 'innerWidth:', overflowBefore.innerW, '| OVERFLOW:', overflowBefore.scrollW > overflowBefore.innerW);
  await page.screenshot({ path: `${SHOTDIR}/fix-invoice-dashboard-1366.png`, fullPage: false });

  // ---- 2. Sidebar collapse toggle ----
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const widthExpanded = await page.evaluate(() => document.querySelector('aside.hidden')?.getBoundingClientRect().width
    || [...document.querySelectorAll('aside')].find(a => a.offsetParent !== null)?.getBoundingClientRect().width);
  console.log('sidebar width before toggle:', widthExpanded);
  await page.click('header button[title="Toggle sidebar"]');
  await page.waitForTimeout(500);
  const widthCollapsed = await page.evaluate(() => [...document.querySelectorAll('aside')].find(a => a.offsetParent !== null)?.getBoundingClientRect().width);
  console.log('sidebar width after toggle:', widthCollapsed);
  const sidebarText = await page.evaluate(() => [...document.querySelectorAll('aside')].find(a => a.offsetParent !== null)?.innerText || '');
  console.log('collapsed sidebar still has icons (non-empty DOM), text labels hidden:', sidebarText.trim() === '');
  await page.screenshot({ path: `${SHOTDIR}/fix-sidebar-collapsed.png` });
  // toggle back
  await page.click('header button[title="Toggle sidebar"]');
  await page.waitForTimeout(500);
  const widthBack = await page.evaluate(() => [...document.querySelectorAll('aside')].find(a => a.offsetParent !== null)?.getBoundingClientRect().width);
  console.log('sidebar width after toggling back:', widthBack);

  // ---- 3. Invoice edit no longer crashes ----
  await page.goto(`${ORIGIN}/invoice-dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const editBtn = await page.$('button[title="Edit"]');
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(1000);
    const modalText = await page.evaluate(() => document.body.innerText);
    const hasDateError = /Expected .*to be of type date/i.test(modalText);
    console.log('Edit invoice modal shows date-type error:', hasDateError);
    await page.screenshot({ path: `${SHOTDIR}/fix-invoice-edit.png` });
    // try saving unchanged to confirm round-trip works
    const saveBtn = await page.$('button:has-text("Update Invoice")');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      const afterSaveText = await page.evaluate(() => document.body.innerText);
      console.log('after save still shows error:', /Expected .*to be of type date/i.test(afterSaveText));
      await page.screenshot({ path: `${SHOTDIR}/fix-invoice-edit-saved.png` });
    }
  } else {
    console.log('No Edit button found on invoice dashboard (no rows?)');
  }

  console.log('page errors:', JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1); });
