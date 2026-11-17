# StudyFlow deployment guide

## Important: use Vercel, not GitHub Pages

StudyFlow is a Next.js application with server-side route handlers under `app/api/`. Those handlers call Gemini using the private `GEMINI_API_KEY`. GitHub Pages only hosts static files and cannot run these Next.js server routes. The GitHub Pages URL (`https://sankeerthmallesh.github.io/StudyHelper/`) is therefore not a valid deployment target for this app.

Deploy the repository to Vercel instead. Vercel runs the Next.js app and its API routes.

## 1. Upload this project to GitHub

1. Extract the ZIP.
2. Open the extracted `studyflow` folder.
3. Upload the **contents** of that folder to the root of `SankeerthMallesh/StudyHelper` (where `app/`, `components/`, `lib/`, and `package.json` are located).
4. Commit the changes to the `main` branch.
5. Confirm `vercel.json`, `.nvmrc`, `DEPLOYMENT.md`, `package.json`, and `app/` are all at the repository root—not inside another nested `studyflow/` folder.

Do not upload `.env.local`, the Gemini key, `node_modules/`, or `.next/`.

## 2. Import the repository into Vercel

1. Sign in at <https://vercel.com/>.
2. Choose **Add New → Project**.
3. Import the GitHub repository `SankeerthMallesh/StudyHelper`.
4. Set the Root Directory to `./` (the repository root).
5. Confirm the framework is **Next.js**. The included `vercel.json` also declares the Next.js framework and the build command.
6. Use Node.js **22.x** in Vercel project settings. `.nvmrc` pins local tooling to 22, and `package.json` declares Node.js 20.9 or newer.
7. Before deploying, add the environment variables below.

## 3. Add private environment variables in Vercel

Open **Project → Settings → Environment Variables** and add:

| Name | Value | Required |
|---|---|---|
| `GEMINI_API_KEY` | Your own Google AI Studio API key | Yes, for real AI features |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Optional; this is the app's configured default |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Optional, only for cloud accounts/sync |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Optional, only for cloud accounts/sync |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `studyflow-uploads` | Optional; use the bucket name created by the migration |

Select Production, Preview, and Development for the Gemini variables if you want AI enabled in all deployment types. Click Save, then deploy or redeploy so the new variables are applied.

**Never add the Gemini key to a source file, GitHub commit, `NEXT_PUBLIC_` variable, or this ZIP.** The key must be entered directly into Vercel's Environment Variables settings. The `.env.local` file on your Mac only affects local development; it is not automatically copied to Vercel.

## 4. Finish the deployment

1. Click **Deploy** in Vercel.
2. Wait for the build to finish. If it fails, open the Vercel deployment's Build Logs and use the first error message to diagnose it.
3. Open the generated `*.vercel.app` URL.
4. Check `https://YOUR-VERCEL-DOMAIN/api/health`. It should return JSON showing whether a Gemini key is configured. This endpoint does not make a paid/quota-consuming Gemini generation request, so test an actual note upload afterwards.
5. Upload a clear JPG, PNG, or WEBP note image and confirm that note extraction, the generated chapter summary, and study-material generation work.
6. In the review step, test the summary editor, expandable section breakdown, copy-summary action, and Regenerate button (`/api/summarize-notes`). The saved material keeps its summary alongside the extracted notes and shows it again in the material reader.

## 5. Stop using the old GitHub Pages deployment

The old `github.io/StudyHelper/` address will not become a working Next.js app. In the GitHub repository, open **Settings → Pages** and unpublish/disable the Pages site (or set its publishing source to `None`, if that option is shown). Use the Vercel URL for the live app instead.

## 6. Optional Supabase cloud data

If you want sign-in, cross-device cloud persistence, and private uploaded-page storage, create a Supabase project, add the three `NEXT_PUBLIC_SUPABASE_*` values in Vercel, and run `supabase/migrations/202611160001_studyflow.sql` in the Supabase SQL Editor. Then configure the Supabase Auth Site URL and allowed redirect URLs to include your Vercel domain. Supabase is optional; without it, the app uses browser-local storage.

## Local development

The existing setup remains available:

```bash
bash setup-local.sh
```

Or install and run manually:

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local, then:
npm run dev
```

Open <http://localhost:3000>.

## Build checks

Run these in the project folder before deploying when possible:

```bash
npm run typecheck
npm run lint
npm run build
```

The ZIP includes source and deployment configuration, but it does not include your private API key, Supabase project credentials, Vercel account, or a claim that the production deployment has already been built or tested.
