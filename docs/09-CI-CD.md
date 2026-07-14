# SW Forge — CI/CD Deployment

> **Context:** [MASTER.md](MASTER.md)
> Guide for continuous integration and deployment using GitHub Actions and Cloudflare Workers.

---

## Overview

SW Forge uses GitHub Actions for automatic deployment of the Cloudflare Worker backend. The static frontend (Cloudflare Pages) is deployed separately via Git push to the main branch.

### Architecture

- **Frontend:** Cloudflare Pages (static site, auto-deployed on push to main)
- **Backend:** Cloudflare Worker (Share API, deployed via GitHub Actions)
- **CI/CD:** GitHub Actions workflow (`.github/workflows/deploy.yml`)

---

## GitHub Actions Workflow

### Workflow File

`.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy Worker
        run: cd worker && npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Trigger Conditions

- **Automatic:** Runs on every push to the `main` branch
- **Manual:** Can be triggered manually via GitHub Actions UI

### Workflow Steps

1. **Checkout** — Clones the repository
2. **Setup Node.js** — Installs Node.js version 20
3. **Install dependencies** — Runs `npm ci` for clean install
4. **Build** — Runs `npm run build` to generate production assets
5. **Deploy Worker** — Deploys the Cloudflare Worker using Wrangler

---

## Required Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret | Purpose | How to get |
|--------|---------|------------|
| `CLOUDFLARE_API_TOKEN` | Authentication for Cloudflare API | Cloudflare Dashboard → My Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Workers & Pages → Overview (right sidebar) |

### Creating API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use template: **Edit Cloudflare Workers** (custom template)
5. Permissions:
   - Account → Workers Scripts → Edit
   - Account → D1 Database → Edit
   - Account → Account Settings → Read
6. Set **Account Resources** to your account
7. Set **TTL** as needed (recommended: no expiration for CI/CD)
8. Copy the token and add to GitHub secrets

### Finding Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Overview** on the right sidebar
4. Copy **Account ID** from the right panel

---

## Manual Deployment

### Deploy Worker Locally

```bash
cd worker
npx wrangler deploy
```

### Deploy Specific Environment

```bash
cd worker
npx wrangler deploy --env production
```

### Preview Deployment

```bash
cd worker
npx wrangler deploy --env preview
```

---

## Worker Configuration

### Worker Directory

The Cloudflare Worker code lives in the `worker/` directory:

```
worker/
├── src/
│   └── index.js    # Main Worker logic
├── wrangler.toml   # Worker configuration
└── package.json    # Worker dependencies
```

### Wrangler Configuration

`worker/wrangler.toml` defines Worker settings:

```toml
name = "sw-backend"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
```

---

## Troubleshooting

### Build Fails

**Symptom:** Workflow fails at "Build" step

**Solutions:**
- Check build logs for specific error
- Ensure `package.json` scripts are correct
- Verify Node.js version compatibility (currently 20)
- Run `npm run build` locally to reproduce

### Worker Deploy Fails

**Symptom:** Workflow fails at "Deploy Worker" step

**Solutions:**
- Verify `CLOUDFLARE_API_TOKEN` is valid and not expired
- Check `CLOUDFLARE_ACCOUNT_ID` is correct
- Ensure Wrangler is installed in `worker/package.json`
- Test locally: `cd worker && npx wrangler deploy`

### Secrets Not Found

**Symptom:** Error message about missing secrets

**Solutions:**
- Go to GitHub repository settings
- Navigate to Settings → Secrets and variables → Actions
- Verify both secrets are set with correct names
- Ensure repository has write access to deploy

### Permission Denied

**Symptom:** API token lacks permissions

**Solutions:**
- Regenerate API token with correct permissions
- Ensure token has "Edit Cloudflare Workers" permission
- Check account resource settings in token

---

## Frontend Deployment (Cloudflare Pages)

The static frontend is deployed separately via Cloudflare Pages Git integration:

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.` (root)
4. Deploy automatically on push to main

**Note:** The GitHub Actions workflow only deploys the Worker. Frontend deployment is handled by Cloudflare Pages directly.

---

## Monitoring

### Check Workflow Status

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy** workflow
4. View recent runs and their status

### View Worker Logs

```bash
cd worker
npx wrangler tail
```

### Check Worker Status

```bash
cd worker
npx wrangler deployments list
```

---

## Best Practices

1. **Test locally before pushing** — Run `npm run build` and `cd worker && npx wrangler deploy` locally
2. **Keep secrets secure** — Never commit secrets to repository
3. **Monitor workflow runs** — Check Actions tab after each push
4. **Use environment-specific configs** — Separate preview/production environments
5. **Update dependencies regularly** — Keep Node.js and Wrangler up to date

---

## Related Documentation

- [MASTER.md](MASTER.md) — Project overview and build commands
- [DEVELOPMENT-TOOLS.md](DEVELOPMENT-TOOLS.md) — Development tools reference
- Cloudflare Workers Documentation: https://developers.cloudflare.com/workers/
- GitHub Actions Documentation: https://docs.github.com/en/actions
