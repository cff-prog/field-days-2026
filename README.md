# Hello World Static Website

A clean, responsive, interactive "Hello, World!" static website ready to be hosted on **GitHub Pages**.

## Features

- 🎨 **Modern & Responsive UI**: Clean card design styled with custom CSS variables.
- 🌓 **Dark / Light Mode**: Toggle themes with state persistence using `localStorage`.
- ⚡ **Interactive Greeting**: Clickable button displaying interactive greetings.
- 🚀 **Zero Dependencies**: Pure HTML, CSS, and Vanilla JavaScript.

---

## How to Host on GitHub Pages

You can host this site for free on GitHub Pages in just a few steps:

### Option 1: Deploying from a Branch (Quickest)

1. Push this repository to GitHub.
2. Navigate to your repository on GitHub.com.
3. Click on **Settings** (top navigation tab).
4. In the left sidebar, click on **Pages** (under the "Code and automation" section).
5. Under **Build and deployment**:
   - Set **Source** to `Deploy from a branch`.
   - Set **Branch** to `main` (or `master`) and select `/ (root)` as the folder.
6. Click **Save**.
7. Wait 1-2 minutes. Your site will be live at `https://<your-username>.github.io/<repository-name>/`.

---

### Option 2: Deploying via GitHub Actions

1. In repository **Settings** -> **Pages**:
   - Set **Source** to `GitHub Actions`.
2. Create a workflow file at `.github/workflows/static.yml`:
   ```yaml
   name: Deploy Static Content to Pages

   on:
     push:
       branches: ["main"]

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         - name: Setup Pages
           uses: actions/configure-pages@v5
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: '.'
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```
3. Push changes to `main` to trigger the automated deployment!

---

## Local Development

To view the website locally, open `index.html` directly in your web browser, or use a local static web server such as `http-server` or VS Code Live Server.
