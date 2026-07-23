import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

// Each Markdown file in src/content/events/ is one event.
// The frontmatter below is the full event data model. Only `title`,
// `description`, and `pubDate` are required — everything else is optional and
// degrades gracefully when omitted. See README.md for a field-by-field guide.
const events = defineCollection({
	loader: glob({ base: "./src/content/events", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		// --- Required ---
		title: z.string(),
		// Short description: 1–3 sentences on what the event is and what to expect.
		description: z.string(),
		// When this post was written/published (used as a fallback sort key).
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),

		// --- When ---
		// The day the event happens. Omit (or set tbd: true) if the date is
		// not yet decided — the card will read "Date TBD".
		eventDate: z.coerce.date().optional(),
		// Optional last day for multi-day events (e.g. a trip).
		endDate: z.coerce.date().optional(),
		// Human-readable start time, e.g. "6:00 PM". Omit for an all-day event.
		startTime: z.string().optional(),
		// Force "Date TBD" even if no date is set.
		tbd: z.boolean().default(false),

		// --- Type ---
		type: z
			.enum([
				"birthday",
				"holiday",
				"wedding",
				"reunion",
				"gathering",
				"memorial",
				"celebration",
			])
			.default("gathering"),

		// --- Where (PII-aware — see README) ---
		// Venue name (public venues) or a general area. Shown to everyone.
		locationName: z.string().optional(),
		// City / neighborhood only, e.g. "Las Vegas, NV". Shown to everyone.
		locationCity: z.string().optional(),
		// Set true when the event is at a private home. In public mode the exact
		// address and map link are hidden; only locationCity is shown.
		locationPrivate: z.boolean().default(false),
		// Map / directions link. Safe to show for PUBLIC venues. For private
		// homes it is only revealed in gated mode.
		mapUrl: z.string().url().optional(),
		// Full street address. ONLY revealed in gated mode (never in public mode).
		fullAddress: z.string().optional(),

		// --- Who / how to respond ---
		// First name or family branch only, e.g. "the Maria & Tony side".
		host: z.string().optional(),
		// RSVP form/link. If omitted, a "let [organizer] know" prompt is shown.
		rsvpUrl: z.string().url().optional(),
		rsvpNote: z.string().optional(),
		// Optional "who's coming" — a NUMBER ONLY, never a named guest list.
		comingCount: z.number().int().nonnegative().optional(),

		// --- Details / what to know (dress code, parking, kid-friendly, etc.) ---
		details: z.array(z.string()).default([]),

		// --- Photos ---
		heroImage: z.string().optional(),
		// Small gallery, encouraged for past events. Revealed in gated mode.
		gallery: z
			.array(z.object({ src: z.string(), alt: z.string().default("") }))
			.default([]),
		// One-line recap for past events.
		recap: z.string().optional(),
		// Link to an external shared photo album (e.g. a Google Photos link) for
		// trip memories. Shown as a prominent button near the top of the event —
		// use for albums you're happy to share with anyone who has the site link.
		albumUrl: z.string().url().optional(),

		// Hide an event from the site without deleting it.
		draft: z.boolean().default(false),
	}),
});

export const collections = { events };
