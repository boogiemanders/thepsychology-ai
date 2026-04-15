# SimplePractice Notes — Chrome Extension

## Context
Read `SESSION.md` for full project state, architecture, and where we left off.
Read `PLAN.md` for the implementation roadmap.

## Stack
- Chrome Extension (Manifest V3)
- TypeScript, esbuild
- Local Ollama for LLM (llama3.2:3b, CPU-only)
- No PHI leaves the device

## Dev Commands
- `npm run watch` — auto-rebuild on change
- `npm run build` — production build to `dist/`
- Load in Chrome: `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`

## Rules
- All PHI processing stays local — never add cloud API calls as defaults
- Purple (#7c3aed) brand color
- DEV_RELOAD = true in service workers
- Default LLM provider: Ollama (Groq is optional, user must opt in)
