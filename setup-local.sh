#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f "package.json" || ! -f ".env.example" ]]; then
  echo "Error: Run this script from the StudyFlow project folder."
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node.js 20.9 or newer, then run this script again."
  echo "https://nodejs.org/"
  exit 1
fi

node - <<'NODE'
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error(`StudyFlow requires Node.js 20.9 or newer. Detected ${process.versions.node}.`);
  process.exit(1);
}
NODE

if [[ ! -f ".env.local" ]]; then
  cp ".env.example" ".env.local"
  chmod 600 ".env.local"
fi

printf '\nStudyFlow local setup\n'
printf 'Paste your Gemini API key. Input is hidden while you type.\n'
read -r -s -p 'GEMINI_API_KEY: ' GEMINI_KEY
printf '\n'

if [[ -z "${GEMINI_KEY//[[:space:]]/}" ]]; then
  echo "No API key was entered. Nothing was changed."
  unset GEMINI_KEY
  exit 1
fi

# Replace any previous key while preserving optional settings such as Supabase.
TEMP_ENV="$(mktemp)"
awk '!/^[[:space:]]*(export[[:space:]]+)?GEMINI_API_KEY[[:space:]]*=/' .env.local > "$TEMP_ENV"
printf 'GEMINI_API_KEY=%s\n' "$GEMINI_KEY" >> "$TEMP_ENV"
mv "$TEMP_ENV" .env.local
chmod 600 .env.local
unset GEMINI_KEY

printf '\nSaved your key privately in .env.local.\n'
printf 'The key is excluded from Git by .gitignore and is not included in the project ZIP.\n\n'

if [[ ! -d "node_modules" ]]; then
  echo "Installing project dependencies..."
  npm install
else
  echo "Dependencies are already installed; skipping npm install."
fi

printf '\nStarting StudyFlow at http://localhost:3000\n'
echo "Keep this Terminal window open while using the app. Press Ctrl+C to stop it."
npm run dev
