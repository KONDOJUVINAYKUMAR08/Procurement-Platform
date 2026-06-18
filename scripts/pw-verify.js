const { chromium } = require('playwright');
const SHOTDIR = 'c:/Users/kondo/OneDrive/Desktop/Procurement-Platform/scripts/shots';
require('fs').mkdirSync(SHOTDIR, { recursive: true });
const ORIGIN = 'http://18.232.120.51';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(`${ORIGIN}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@procurement.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // Sidebar — confirm HR/Payroll/Employees/Letters/Certificates GONE
  const navText = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
  const hrGone = !/Employees|Attendance|Payroll|Letters|Certificates|HR & Payroll/i.test(navText);
  console.log('HR section removed from sidebar:', hrGone);
  console.log('sidebar sections:', navText.split('\n').filter(Boolean).join(' | '));

  // Currency — dashboard should show ₹ not $
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('dashboard uses ₹:', bodyText.includes('₹'), '| still has $:', /\$[0-9]/.test(bodyText));
  await page.screenshot({ path: `${SHOTDIR}/v1-dashboard.png`, fullPage: true });

  // Invoice modal fits
  await page.goto(`${ORIGIN}/invoice-dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('button:has-text("New Invoice")');
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => ({ h: document.documentElement.scrollWidth > window.innerWidth }));
  console.log('invoice modal causes horizontal overflow:', overflow.h);
  await page.screenshot({ path: `${SHOTDIR}/v2-invoice-modal.png` });

  // /hr/* redirects to dashboard
  await page.goto(`${ORIGIN}/hr/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  console.log('/hr/employees redirects to:', new URL(page.url()).pathname);

  console.log('page errors:', JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1); });
