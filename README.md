# The Petrillo Family — Events Website

A simple, warm, mobile-first site where friends and extended family can see
what gatherings are coming up (and look back on past ones) — no account, no
app, no learning curve. Built with [Astro](https://astro.build) and deployed
as a static site on Cloudflare Workers.

## What's on the site

- **Upcoming events** (soonest first) and **Past events** (newest first), on
  one page with a tab toggle.
- **Live countdown** to the next event on the homepage.
- **Add-to-calendar** buttons on every upcoming event — an `.ics` download
  (Apple/Outlook) and a Google Calendar "add" link.
- **Subscribable calendar feed** at `/feed.ics` — relatives subscribe once and
  every new event lands in their own calendar automatically.
- **Filter by event type** and a **footer info strip** (how to RSVP, the
  privacy note, and a "Questions? Contact …" path).
- **Print-friendly** layout (just use your browser's Print).
- Light **and** dark themes, large text, high contrast, keyboard-navigable.

---

## Adding or editing an event

All events live in **one file**: [`src/data/events.json`](src/data/events.json).
It's a plain list — copy an existing entry, paste it, and change the values.
The site re-sorts everything automatically (upcoming vs. past is decided by the
date), so you never have to move things around.

Each event looks like this:

```jsonc
{
  "id": "summer-bbq-bocce-2026",     // unique, lowercase, no spaces (used in links)
  "title": "Summer BBQ & Bocce",
  "type": "gathering",                // see the list of types below
  "date": "2026-08-15",               // "YYYY-MM-DD", or null if the date is TBD
  "startTime": "12:00",               // "HH:MM" 24-hour, or null
  "endTime": "17:00",                 // optional
  "allDay": false,
  "tbd": false,                        // true = show "Date to be announced"
  "venue": "Lincoln Park — Pavilion #3",
  "cityArea": "Riverside",             // city / neighborhood ONLY — never a street address here
  "isPrivateHome": false,              // true = it's someone's home (see PII rules)
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=...", // or null
  "exactAddress": null,                // GATED — only shown in "gated" mode (see below)
  "description": "One to three friendly sentences about the event.",
  "details": [
    { "label": "Dress", "value": "Casual" },
    { "label": "Bring", "value": "A side to share" }
  ],
  "rsvp": { "type": "form", "hostFirstName": "Maria" }, // or null
  "comingCount": 14,                   // a NUMBER only, or null — never a guest list
  "host": "Hosted by the Maria & Tony side", // first names / family branch only
  "photos": [                          // optional; encouraged for past events
    { "src": "/reunion-1.jpg", "alt": "Describe the photo for screen readers" }
  ],
  "recap": "A sentence or two looking back (past events only)."
}
```

**Allowed `type` values:** `birthday`, `holiday`, `wedding`, `reunion`,
`gathering`, `memorial`, `baptism`, `graduation`, `anniversary`. Each gets its
own icon and color tag automatically.

If you mistype a field or forget one, the build fails with a clear message —
nothing broken ever reaches the live site.

### Photos

Put image files in the `public/` folder and reference them as `/filename.jpg`.
**Before uploading, strip EXIF metadata** (GPS location, camera info) — on a
Mac: right-click → Quick Actions, or use any "remove metadata" tool. Always
fill in a short `alt` description for accessibility.

---

## Public vs. gated mode (privacy)

The whole site runs in one of two modes, set by a single line near the top of
[`src/consts.ts`](src/consts.ts):

```ts
export const ACCESS_MODE: "public" | "gated" = "public";
```

| Mode | Who it's for | Exact addresses & private-home maps | Photo galleries | Front door |
| --- | --- | --- | --- | --- |
| `"public"` *(default)* | A link you can share widely | **Omitted from the build entirely** — they can't leak | Past-event galleries show; upcoming ones hidden | Open |
| `"gated"` | Invited guests only | **Included** and shown | All shown | Shared-password screen |

In **public** mode, exact addresses and private-home map links are never
written into the HTML at all, so guests get the full address only *after* they
RSVP. That's why the footer says "you'll get the full address after you RSVP" —
a missing address reads as intentional, not broken.

### About the built-in password gate

When `ACCESS_MODE` is `"gated"`, a shared-password screen (`GATE_PASSWORD` in
`src/consts.ts`) covers the site. **This is light obfuscation, not real
security** — the check runs in the browser. If you're going to publish exact
home addresses, also put the deployment behind a real gate:

- **Cloudflare Access** (recommended, free tier): protect the Worker with a
  one-time email PIN or an allow-list. See the Cloudflare Zero Trust docs.
- **HTTP Basic Auth**: add a small check in a Worker/middleware.

Switching modes later is just changing that one `ACCESS_MODE` line and
redeploying.

---

## PII rules (please follow these)

Include enough to understand and attend an event — **omit anything that
identifies or exposes individuals** on the open web:

**Omit or gate:**
- Full street/home addresses (use `cityArea` for the neighborhood; put the
  exact address in `exactAddress`, which only shows in gated mode).
- Personal phone numbers and personal emails — route RSVPs through the form /
  shared alias in `src/consts.ts`.
- Last names of minors; children's schools, grades, or routines.
- Anyone's full date of birth ("80th" is fine; "born 03/14/1945" is not).
- Financial/payment info (a gift-registry *link* is OK).
- Health or other sensitive details.
- GPS pins / metadata in photos — **strip EXIF before uploading**.

**Keep:** what the event is, roughly where (city/neighborhood or public venue),
when, what to expect, and how to respond.

The `comingCount` field is a **number only** ("14 coming") — never list who is
attending by name.

---

## How the calendar feed is generated

- Per-event `.ics` files are generated at build time from `events.json` by
  `src/pages/events/[id].ics.ts`.
- The subscribable feed at `/feed.ics` is generated by `src/pages/feed.ics.ts`.
- The ICS/Google-Calendar builders live in
  [`src/lib/calendar.ts`](src/lib/calendar.ts). **Calendar files only ever use
  the PII-safe location** (venue + city), never the exact address — even in
  gated mode — because a calendar file can travel anywhere.
- TBD events (no date) are skipped in calendars until a date is set.

To let people subscribe, share the feed URL with a `webcal://` prefix, e.g.
`webcal://your-domain.com/feed.ics` — most calendar apps open that directly.

---

## Running & deploying

```bash
npm install
npm run dev       # local dev server at localhost:4321
npm run build     # build the static site to ./dist
npm run preview   # build + preview via Wrangler
npm run deploy    # deploy to Cloudflare Workers
```

Set your real domain in two places when you go live: `SITE_URL` in
`src/consts.ts` and `site` in `astro.config.mjs`.

## Project layout

```
src/
  consts.ts                 # site config + privacy mode (edit me)
  data/events.json          # all events (edit me)
  content.config.ts         # validates events.json at build time
  lib/
    events.ts               # loading, sorting, date helpers
    calendar.ts             # .ics + Google Calendar generation
  components/                # Header, Footer strip, EventCard, Countdown, Gate, ...
  pages/
    index.astro             # the whole site
    feed.ics.ts             # subscribable calendar feed
    events/[id].ics.ts      # per-event calendar downloads
public/                     # images, fonts, favicon
```
