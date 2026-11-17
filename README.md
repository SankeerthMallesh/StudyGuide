# StudyFlow

StudyFlow is a polished, Notion-inspired study workspace that turns photos of class notes into editable extracted notes, clear AI chapter summaries, flashcards, quizzes, practice tests, and study guides using Google's Gemini API. It uses Inter typography, a Notion-inspired workspace sidebar/page tree, keyboard-driven quick search, calm document-style layouts, responsive controls, and an optional light theme. It is built with Next.js App Router, React, TypeScript, Supabase, and the official `@google/genai` SDK.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS recommended)
- npm
- A Gemini API key from Google AI Studio
- Optional: a Supabase project for sign-in, cloud sync, and private image storage

## Run locally (easy Terminal setup)

1. Unzip the project and open the `studyflow` folder in Terminal.
2. Run:

   ```bash
   bash setup-local.sh
   ```

3. When prompted, paste your Gemini API key and press Enter. Terminal hides the key as you type.
4. The script saves the key to `.env.local`, installs dependencies if needed, and starts the app.
5. Open <http://localhost:3000>.

The key is stored only in your local `.env.local` file. That file is ignored by Git and is deliberately excluded from ZIP packages. Never commit it or add a `NEXT_PUBLIC_` prefix to the key variable.

### Manual setup (alternative)

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY
npm run dev
```

The default model is `gemini-3.8-flash`. You can override it with `GEMINI_MODEL` using a model identifier currently enabled for your Google AI Studio project. The app sends all Gemini requests through Next.js server routes. Gemini quota and rate limits still apply; a free API key is not unlimited.

## Optional Supabase setup

Without Supabase, StudyFlow uses browser-local storage on the current device. To enable email/password authentication, workspace sync, and private uploaded-page storage:

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and publishable key.
3. Set these values in `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=studyflow-uploads
   ```

4. Open the Supabase SQL Editor and run `supabase/migrations/202611160001_studyflow.sql`. This creates the relational tables, indexes, RLS policies, and private `studyflow-uploads` storage bucket.
5. Enable Email authentication in **Authentication → Providers**. Set the Site URL to your local app URL for local testing.
6. Restart `npm run dev`. When Supabase is configured, StudyFlow requires sign-in before opening a workspace.

Each account's browser fallback is namespaced separately. Cloud tables and the storage bucket use row-level security so authenticated users can access only their own records.

## Features in this project

- Dark-first responsive workspace with a warm light theme option.
- Notion-inspired information architecture: workspace switcher, Quick Find (Cmd/Ctrl+K), new-page action, grouped page navigation, recent saved pages, breadcrumbs, and a document-focused content canvas.
- Command palette that searches saved notes, flashcard decks, quizzes, and study guides, then opens the selected page or study session.
- Overview dashboard with real counts and empty states (no fabricated activity).
- Multi-image upload (JPG/JPEG, PNG, WEBP), page previews, reordering, removal, file limits, and camera-compatible mobile file selection.
- Gemini image analysis with structured JSON output and Zod validation.
- A dedicated AI summary for each scanned collection: an overview, section-by-section explanations, key takeaways, and a quick-review recap.
- Interactive summary preview with expandable sections, editing, copy-to-clipboard, and one-click regeneration from extracted note data.
- Editable extraction review before saving, including definitions, key terms, facts, formulas, dates, examples, relationships, and uncertain handwriting.
- Gemini flashcard, quiz, practice-test, study-guide, and note-grounded assistant generation.
- Flashcard flipping, shuffle, keyboard controls, recall status, and spaced-review scheduling.
- One-question-at-a-time quizzes/tests, submission confirmation, deterministic answer checking, results, explanations, and topic breakdown.
- Study planner, study-session logging, progress summaries, and charts based on actual saved sessions and attempts.
- Optional Supabase Auth, relational persistence, private image uploads, and RLS.
- Local browser persistence when Supabase is not configured.

## Current limitations to know about

- PDF upload is not enabled in this delivery. Use JPG, PNG, or WEBP pages.
- The first pass uses a browser workspace snapshot for complete cross-feature sync; normalized Supabase tables are also written for the main note, flashcard, quiz, attempt, and session records.
- Quiz/test generation currently uses sensible built-in defaults rather than exposing every prompt-listed customization control (custom question count, topic filters, timer modes, etc.).
- Study-guide PDF export, calendar integrations, and advanced spaced-repetition analytics are not included.
- The lightweight AI request limiter is per server process; a public multi-instance deployment should add a shared edge or Redis-backed rate limiter.
- Supabase and Gemini features cannot be tested until you provide and configure your own project credentials.

## Quality checks

Run these after installing dependencies:

```bash
npm run typecheck
npm run lint
npm run build
```

The source workspace was assembled here, but dependency installation and those project checks could not be completed in this environment because the npm registry connection returned a DNS `EAI_AGAIN` error. Do not treat the app as production-verified until the checks pass in your local environment and you test Gemini/Supabase with your own credentials.

## Deploy to Vercel (not GitHub Pages)

StudyFlow uses Next.js server-side API routes for Gemini. GitHub Pages cannot run those routes, so the `github.io` URL is not a supported host. Deploy the repository to Vercel instead. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete steps, Vercel configuration, Node.js version, environment variables, and post-deploy checks. Never commit `.env.local` or put the Gemini key in this ZIP.
