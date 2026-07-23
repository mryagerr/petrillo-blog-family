# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

A small, warm, mobile-first **family events website** for the Petrillo family —
upcoming and past gatherings shown as cards, with add-to-calendar buttons, a
countdown, and a subscribable calendar feed. No accounts, no database: every
event is a Markdown file. Built with **Astro** (static output) and deployed on
**Cloudflare Workers**.

`README.md` is the human-facing guide and is authoritative for editorial
workflow; this file focuses on what an AI assistant needs to work safely and
correctly.

## Commands

```bash
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # static build to ./dist/
npm run check    # astro build && tsc && wrangler deploy --dry-run  ← run before finishing
npm run deploy   # build + deploy to Cloudflare Workers (do NOT run unless asked)
npm run preview  # build, then serve the Worker locally via wrangler
```

There is no test suite and no separate linter. `npm run check` (typecheck +
build + deploy dry-run) is the closest thing to CI — prefer it as the gate
before you consider a change done. Requires **Node ≥ 22**.

## Architecture

Content is the source of truth. Each event is one Markdown file in
`src/content/events/`; the file name becomes the URL slug. Everything else
derives from those files at build time.

```
src/
  consts.ts               # site title, organizer, RSVP/contact, ACCESS_MODE, EVENT_TYPES
  content.config.ts       # Zod schema = the full event data model (frontmatter)
  content/events/*.md     # one file per event  ← this is where events live
  lib/events.ts           # sorting, PII gating, and .ics / Google Calendar generation
  components/*.astro       # cards, countdown, calendar buttons, footer, tags, etc.
  layouts/EventPost.astro # single-event page (includes print styles)
  pages/
    index.astro           # homepage: countdown + Upcoming + Past sections
    events/[...slug].astro # renders one event's page
    events/[slug].ics.ts   # per-event .ics download endpoint
    calendar.ics.ts        # subscribable /calendar.ics feed
    rss.xml.js             # human-readable RSS feed
  styles/global.css        # global styles + CSS custom properties (--accent, --gray-*)
public/                   # images and fonts; event photos go here
```

Key flows:
- **Upcoming vs. Past is computed, never set by hand.** `getSortedEvents()` in
  `src/lib/events.ts` splits events by `endDate ?? eventDate` vs. today. Undated
  / `tbd` events stay in Upcoming and render "Date TBD". Don't add a status field.
- **Calendar output is generated** from event frontmatter — never hand-edit
  `.ics`. All the date/time parsing, RFC 5545 line-folding, and Google Calendar
  link building lives in `src/lib/events.ts`.
- **`draft: true`** hides an event everywhere (list, RSS) without deleting it.

## Two conventions that must not be broken

### 1. The PII / privacy model

This is the most important thing in the repo. The site is designed to be safe on
the open web. Before adding or editing event content, follow the rules in
`README.md` → "PII rules". In short:

- Full street addresses go in `fullAddress` with `locationPrivate: true`; public
  cards show only `locationName` + `locationCity`. `mapUrl` is for **public
  venues only**.
- Route responses through `rsvpUrl` (a form) or the shared `CONTACT_URL` alias in
  `consts.ts` — **never** a personal phone number or personal email.
- "Who's coming" is a **number only** (`comingCount`) — never a named guest list.
- No minors' last names, birthdates, schools; no health/financial data; strip
  EXIF from photos before putting them in `public/`.

`ACCESS_MODE` in `src/consts.ts` (`"public"` | `"gated"`) is the switch that
gates `fullAddress`, private-home `mapUrl`, and photo galleries. The gating logic
is `mayRevealAddress()` / `mayRevealGallery()` in `src/lib/events.ts` — reuse
those helpers; don't re-derive the check inline. **Never** set `ACCESS_MODE` to
`"gated"` unless an actual access gate (e.g. Cloudflare Access) is already in
front of the site — doing so on an open URL leaks private info.

### 2. Non-developers edit this repo

`src/consts.ts` and the event Markdown files are meant to be edited by people who
aren't developers. Keep them approachable: preserve the explanatory comments,
keep site-wide values (title, organizer, RSVP wording, event types) centralized
in `consts.ts` rather than scattering literals through components, and keep the
event schema forgiving (most fields optional, degrade gracefully when omitted).

## Adding or editing an event

Copy an existing file in `src/content/events/`, rename it, edit the frontmatter.
Only `title`, `description`, and `pubDate` are required; the authoritative field
list is the Zod schema in `src/content.config.ts`, with a worked example in
`README.md`. `type` must be one of the keys in `EVENT_TYPES` (`consts.ts`). The
Markdown body below the frontmatter becomes the event's page (tables, headings,
etc. are fine).

## Other notes

- **Set the real domain** in `astro.config.mjs` (`site:`). It's still
  `https://example.com`; until it's the deployed URL, social/chat link-preview
  images point at the wrong host. Link-preview scrapers don't render SVG, so
  social images must be PNG/JPG — `BaseHead.astro` falls back to
  `public/event-preview.png` for any SVG `heroImage`.
- Styling is plain scoped CSS in each `.astro` file plus `src/styles/global.css`;
  colors come from CSS custom properties (`--accent`, `--gray-*`). No CSS
  framework, no client JS framework — the only client-side script is the
  countdown timer in `Countdown.astro`.
- TypeScript is `astro/tsconfigs/strict` with `strictNullChecks`. Keep it typed.
- Indentation is tabs, matching existing files.

## Git workflow

Small commits with clear messages. `main` is the default branch; feature work
lands via PR. Run `npm run check` before finishing. Do not run `npm run deploy`
unless explicitly asked.
