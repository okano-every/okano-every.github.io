import puppeteer from "puppeteer";
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on("pageerror", err => console.log("PAGE ERROR:", err.toString()));
  page.on("console", msg => {
    if (msg.type() === 'error') {
      console.log("CONSOLE ERROR:", msg.text());
    }
  });

  await page.goto("http://localhost:5173", {waitUntil: "networkidle0"});
  
  // See if we are on the login page
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log("Found password input, logging in...");
    await passwordInput.type('okano0000');
    const btn = await page.$('button[type="submit"]');
    if (btn) await btn.click();
    await page.waitForNavigation({waitUntil: "networkidle0"}).catch(() => {});
  }

  // Click on the dashboard link or navigate directly
  await page.goto("http://localhost:5173/dashboard", {waitUntil: "networkidle0"});
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})().catch(console.error);
