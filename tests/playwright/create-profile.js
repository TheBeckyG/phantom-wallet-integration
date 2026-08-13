const path = require('path');
const os = require('os');
const fs = require('fs');
const { chromium } = require('playwright');

async function main() {
  const extArg = process.env.EXTENSION_PATH || process.argv[2];
  if (!extArg) {
    console.error('Usage: EXTENSION_PATH=/path/to/phantom/extension node create-profile.js [extensionPath]');
    process.exit(1);
  }

  const extensionPath = path.resolve(extArg);
  if (!fs.existsSync(extensionPath)) {
    console.error('Extension path not found:', extensionPath);
    process.exit(1);
  }

  const profileDir = process.env.USER_DATA_DIR || path.join(os.homedir(), '.playwright-phantom-profile');
  fs.mkdirSync(profileDir, { recursive: true });

  console.log('Creating profile at', profileDir);
  console.log('Launching Chromium to install extension (you may see prompts).');

  const browserExecutable = process.env.BROWSER_EXECUTABLE_PATH || process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ],
    executablePath: browserExecutable
  });

  const page = await context.newPage();
  await page.goto('about:blank');

  console.log('Waiting 10s for the extension to initialize. If any prompts appear, please accept.');
  await new Promise(r => setTimeout(r, 10000));

  console.log('Closing browser. Profile should be ready at:', profileDir);
  await context.close();
  console.log('Done. Use the profile with USER_DATA_DIR=' + profileDir + ' when running run-phantom.js');
}

main().catch(err => { console.error(err); process.exit(1); });
