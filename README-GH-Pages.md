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

## 🛠️ Local Development & Testing

To test your site locally before pushing changes to GitHub:

### Quick Preview (Python)
If your repository contains static files (`index.html`, CSS, JS) without a build step:

```bash
# Run from the root of your project
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Node/NPM Preview
If your site requires a build step (e.g., Vite, React, Jekyll):

```bash
# Install dependencies
npm install

# Run the local dev server
npm run dev   # or npm start
```

### Verifying the Build Output
To test the exact files that the GitHub Action will deploy:

```bash
# Generate the production build
npm run build

# Serve the build folder (e.g., dist or public)
npx serve dist
```

### Optional Checklist for your README
* **Deployment Method:** Built automatically using native GitHub Actions (`.github/workflows/deploy.yml`).
* **Trigger:** Pushes to the `main` branch automatically deploy to GitHub Pages.
* **Local Testing:** Running the local preview steps above before pushing.
