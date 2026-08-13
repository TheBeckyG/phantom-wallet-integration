Playwright test for Phantom demo

Prerequisites
- Node.js (14+)
- Playwright installed (see instructions below)
- Phantom extension unpacked directory (CRX unpacked). Download Phantom and extract the extension folder.

Install Playwright

```
npm init -y
npm install -D playwright
```

Create a reusable Chromium profile with the extension installed (recommended)

```
# start server if needed
python3 -m http.server 8000

# create a profile where the unpacked extension will be loaded and persisted
EXTENSION_PATH=/path/to/unpacked/phantom node tests/playwright/create-profile.js

# the script prints the profile path (by default ~/.playwright-phantom-profile)
```

Run the test using the created profile

```
USER_DATA_DIR=~/.playwright-phantom-profile EXTENSION_PATH=/path/to/unpacked/phantom BROWSER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node tests/playwright/run-phantom.js
```

Notes
- The script launches Chromium with the extension loaded and attempts to click the demo buttons. Because the Phantom connect/approval UI is part of the extension, you may need to manually approve the connect and sign prompts in the opened browser.
- If you want fully automated flows, prepare a Chromium profile that already has the Phantom extension granted site permission and pass that profile as `userDataDir` by editing the script.
