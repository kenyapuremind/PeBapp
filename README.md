# BiasharaFlow ERP & Accounting

BiasharaFlow is a business accounting and operations dashboard for small and growing enterprises. It helps teams manage sales, expenses, inventory, payroll, approvals, customer and supplier records, financial reporting, and subscription billing in a single web app.

## Overview

This project is a Vite + React + TypeScript application designed for browser-based deployment. The app stores business data locally in the browser (using browser storage), so the primary deployment requirement is a static web host that can serve the built frontend and support environment variables.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express (dependency for runtime compatibility and API/server-side integration patterns)
- Gemini API support via environment configuration

## Prerequisites

Before deploying or running locally, install:

- Node.js 20+
- npm or Bun
- Git

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/kenyapuremind/PeBapp.git
   cd PeBapp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   or:

   ```bash
   bun install
   ```

3. Create an environment file:

   ```bash
   cp .env.example .env
   ```

4. Update the environment values in `.env`:

   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   APP_URL="http://localhost:3000"
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   The app will run on:

   - http://localhost:3000

## Production Build

Build the app for deployment:

```bash
npm run build
```

This generates a production bundle in the `dist` directory.

Preview the production build locally:

```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

## Environment Variables

The app expects the following values:

- `GEMINI_API_KEY`: API key for Gemini AI functionality.
- `APP_URL`: The public URL of the deployed app. In production, this should be the live domain (for example `https://your-domain.com`).

Example:

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="https://biasharaflow.example.com"
```

## Deployment Guide

### Option 1: Vercel

1. Push the repository to GitHub.
2. Log in to Vercel and import the repo.
3. Use the following build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables:
   - `GEMINI_API_KEY`
   - `APP_URL`
5. Deploy.

### Option 2: Netlify

1. Import the repository in Netlify.
2. Set the build command to:

   ```bash
   npm run build
   ```

3. Set the publish directory to:

   ```bash
   dist
   ```

4. Add environment variables:
   - `GEMINI_API_KEY`
   - `APP_URL`
5. Deploy.

### Option 3: Static hosting / CDN / custom server

Because this is a Vite single-page application, it can also be deployed to any static hosting provider that supports serving `dist` contents.

Typical deployment flow:

```bash
npm install
npm run build
```

Then upload the `dist` folder to the hosting service and configure the environment variables for the app.

## Notes

- This app is optimized for browser-based workflows and uses storage in the frontend for business data.
- For production, ensure your host supports HTTPS and set `APP_URL` to the secure public domain.
- If your deployment provider uses a different build environment, ensure Node 20+ is available during the build process.

## Scripts

```json
{
  "dev": "vite --port=3000 --host=0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist server.js",
  "lint": "tsc --noEmit"
}
```

## License

This project is currently configured for the Apache 2.0 license in source files. Check the repository for license details if you are preparing a production deployment or distribution package.

## Recommended Production Checklist

- Set secure environment variables in the hosting provider.
- Use HTTPS only.
- Set the correct `APP_URL` value.
- Verify the site loads correctly after deployment.
- Test login, business registration, expense and sales workflows.
- Validate reports and inventory actions in the deployed environment.
