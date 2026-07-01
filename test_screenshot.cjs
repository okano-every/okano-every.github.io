const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1080 });
  
  try {
    await page.goto('http://localhost:5173/');
    
    // Login
    const passInput = await page.$('input[type="password"]').catch(() => null);
    if (passInput) {
      await page.type('input[type="password"]', 'okano0000');
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button'),
      ]);
    }
    
    // Go to dashboard
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('a[href="/dashboard"]'),
    ]).catch(() => null);
    
    // Wait for load
    await page.waitForTimeout(2000);
    
    // Take screenshot of Banks tab
    await page.evaluate(() => {
        const banksTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('銀行/外貨'));
        if (banksTab) banksTab.click();
    });
    await page.waitForTimeout(1000);
    const bankPath = path.resolve('C:/Users/every/.gemini/antigravity-ide/brain/3264948c-b574-41ec-85bb-c19f7f1eac6b/preview_banks.png');
    await page.screenshot({ path: bankPath, fullPage: true });
    
    // Take screenshot of Insurance tab
    await page.evaluate(() => {
        const insTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('保険/年金'));
        if (insTab) insTab.click();
    });
    await page.waitForTimeout(1000);
    const insPath = path.resolve('C:/Users/every/.gemini/antigravity-ide/brain/3264948c-b574-41ec-85bb-c19f7f1eac6b/preview_insurance.png');
    await page.screenshot({ path: insPath, fullPage: true });

    console.log('Screenshots saved');
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
