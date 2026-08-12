Deploy notes

This repository contains static pages and a simple Phantom wallet demo.

GitHub Pages configuration:
- The workflow `.github/workflows/deploy.yml` now uses the native GitHub Pages deployment pattern with `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`.
- It packages the repository root as a Pages artifact and deploys it directly, without requiring a separate `gh-pages` branch push.
- If the deploy step still fails, go to the repository Settings → Pages and set the branch to `main` and folder to `/ (root)` manually.

Manual enable steps (if needed):
1. Go to: Settings → Pages
2. Under "Build and deployment", select "Branch: main" and folder "/ (root)"
3. Save and wait a few minutes for the site to publish.

Published site example paths:
- Root site: `https://thebeckyg.github.io/phantom-wallet-integration/`
- DeGen page: `https://thebeckyg.github.io/phantom-wallet-integration/degentradebot/`
