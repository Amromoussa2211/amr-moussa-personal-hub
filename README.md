# Amr Moussa — Personal Tech Hub

Amr Moussa's editorial platform for QA engineering, test automation architecture,
and AI-powered testing. Original articles, tips & tricks, TILs, and verified
project showcases — across web, LinkedIn, and X.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS v4 · MDX-style content
pipeline (remark/unified + Shiki) · Supabase (Phase 2) · Vercel-ready.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

## Structure

```
app/            Routes (App Router)
components/     UI components
lib/            Content pipeline, GitHub integration, categories
content/        Articles (MD), TILs, curated project metadata
docs/           Project brief and operations docs
```

## Ground rules

- Zero-cost infrastructure only. No paid tiers, no committed secrets.
- Nothing publishes without explicit approval (enforced in Phase 2+).
- No invented experience or fake metrics. Sample data must be labeled as demo.

See `docs/PROJECT-BRIEF.md` for the full product specification.
