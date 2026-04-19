# Website

A simple static website deployed to GitHub Pages.

## Structure

- `index.html` — main page
- `style.css` — styles
- `.github/workflows/deploy.yml` — GitHub Actions workflow that deploys the site to Pages

## Local preview

Open `index.html` directly in a browser, or run any static file server:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deployment

The site deploys automatically whenever changes are pushed to `main`.

To enable GitHub Pages for this repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` will publish the site.
