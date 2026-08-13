const path = require('path');
const os = require('os');
const fs = require('fs');
const { chromium } = require('playwright');

async function main() {
  const extArg = process.env.EXTENSION_PATH || process.argv[2];
  if (!extArg) {
    console.error('Usage: EXTENSION_PATH=/path/to/phantom/extension node run-phantom.js [extensionPath]');
    process.exit(1);
  }

  const extensionPath = path.resolve(extArg);
  if (!fs.existsSync(extensionPath)) {
    console.error('Extension path not found:', extensionPath);
    process.exit(1);
  }

  const userDataDir = process.env.USER_DATA_DIR || path.join(os.tmpdir(), `playwright-phantom-profile-${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  // Allow using a custom browser executable (e.g., /Applications/Google Chrome.app)
  const browserExecutable = process.env.BROWSER_EXECUTABLE_PATH || process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);

  console.log('Launching Chromium with extension:', extensionPath);
  const launchOptions = {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ],
  };

  if (browserExecutable) {
    launchOptions.executablePath = browserExecutable;
    console.log('Using browser executable:', browserExecutable);
  }

  const context = await chromium.launchPersistentContext(userDataDir, launchOptions);

  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG>', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR>', err));
  page.on('dialog', async dialog => {
    console.log('DIALOG>', dialog.message());
    try { await dialog.accept(); } catch (e) { /* ignore */ }
  });

  // Auto-handle extension popup pages or approval pages when they open
  context.on('page', async (extensionPage) => {
    try {
      const url = extensionPage.url();
      console.log('New page opened:', url);
      if (/^(chrome-extension|moz-extension|ms-browser-extension):/.test(url) || url.includes('extensions') || url.includes('phantom')) {
        // try clicking common approval buttons
        const labels = ['Approve', 'Connect', 'Confirm', 'Sign', 'Allow', 'Approve & Continue'];
        for (const label of labels) {
          try {
            const btn = await extensionPage.$(`button:has-text("${label}")`);
            if (btn) {
              console.log('Clicking extension button:', label);
              await btn.click();
              return;
            }
          } catch (e) { /* ignore */ }
        }

        // try generic click on first button
        try {
          const firstBtn = await extensionPage.$('button');
          if (firstBtn) {
            console.log('Clicking first button on extension page');
            await firstBtn.click();
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.warn('Error handling extension page:', e);
    }
  });

  const url = process.env.DEMO_URL || 'http://localhost:8000/index.html';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait for provider injection (Phantom injects window.phantom.solana)
  try {
    await page.waitForFunction(() => Boolean(window.phantom && window.phantom.solana), { timeout: 15000 });
    console.log('Detected window.phantom.solana');
  } catch (e) {
    console.warn('Timed out waiting for Phantom provider injection; flows may still work if extension requires site permission.');
  }

  // Try Connect
  try {
    console.log('Clicking Connect button');
    await page.click('#connectButton');
    await page.waitForTimeout(3000);
  } catch (e) { console.error('Connect click failed', e); }

  // Try Sign Message
  try {
    console.log('Clicking Sign Message button');
    await page.click('#signMessageButton');
    await page.waitForTimeout(3000);
  } catch (e) { console.error('Sign message click failed', e); }

  // Try Sign Transaction
  try {
    console.log('Clicking Sign Transaction button');
    await page.click('#signTransactionButton');
    await page.waitForTimeout(3000);
  } catch (e) { console.error('Sign transaction click failed', e); }

  // Deep link
  try {
    console.log('Clicking Deep Link button');
    await page.click('#deepLinkButton');
    await page.waitForTimeout(1000);
  } catch (e) { console.error('Deep link click failed', e); }

  console.log('Finished interactions — keeping browser open for manual inspection.');
  console.log('To close the browser, press Ctrl+C in this terminal.');

  // Keep process alive so user can inspect; await context.close() when they exit.
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
