const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to https://vensync.vercel.app ...");
  await page.goto('https://vensync.vercel.app', { waitUntil: 'networkidle0', timeout: 15000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking Auth Button...");
  try {
    await page.click('#btn-google-auth');
    await new Promise(r => setTimeout(r, 3000));
    const errorText = await page.evaluate(() => document.getElementById('auth-error').textContent);
    console.log("AUTH ERROR TEXT:", errorText);
  } catch(e) {
    console.log("Failed to click auth:", e.message);
  }
  
  await browser.close();
})();
