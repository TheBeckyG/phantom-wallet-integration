Deploy notes

This repository contains static pages and a simple Phantom wallet demo.

GitHub Pages configuration:
- The workflow `.github/workflows/deploy.yml` publishes the repository root to the `gh-pages` branch on every push to `main`.
- The workflow then attempts to set Pages source to `main` root by calling the GitHub Pages API. This step requires the `GITHUB_TOKEN` to have sufficient permissions — if it fails, go to the repository Settings → Pages and set the branch to `main` and folder to `/ (root)` manually.

Manual enable steps (if needed):
1. Go to: Settings → Pages
2. Under "Build and deployment", select "Branch: main" and folder "/ (root)"
3. Save and wait a few minutes for the site to publish.

Published site example paths:
- Root site: `https://thebeckyg.github.io/phantom-wallet-integration/`
- DeGen page: `https://thebeckyg.github.io/phantom-wallet-integration/degentradebot/`
