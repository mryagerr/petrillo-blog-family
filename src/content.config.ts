import { file } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

// All events live in ONE file: src/data/events.json
// This schema validates each entry at build time, so a typo (a missing field,
// a bad date) fails the build with a clear message instead of a broken page.
const events = defineCollection({
	loader: file("src/data/events.json"),
	schema: z.object({
		title: z.string(),
		type: z.enum([
			"birthday",
			"holiday",
			"wedding",
			"reunion",
			"gathering",
			"memorial",
			"baptism",
			"graduation",
			"anniversary",
		]),
		// Date as an ISO string "YYYY-MM-DD", or null when the date is still TBD.
		date: z.string().nullable(),
		startTime: z.string().nullable().default(null), // "HH:MM" 24h, or null
		endTime: z.string().nullable().default(null),
		allDay: z.boolean().default(false),
		tbd: z.boolean().default(false),
		venue: z.string(),
		cityArea: z.string(),
		isPrivateHome: z.boolean().default(false),
		// Public-venue map links show openly. Private-home map links are gated.
		mapUrl: z.string().nullable().default(null),
		// Gated: exact address is only ever rendered in "gated" access mode.
		exactAddress: z.string().nullable().default(null),
		description: z.string(),
		details: z
			.array(z.object({ label: z.string(), value: z.string() }))
			.default([]),
		rsvp: z
			.object({
				type: z.enum(["form", "prompt"]).default("form"),
				hostFirstName: z.string().optional(),
			})
			.nullable()
			.default(null),
		comingCount: z.number().int().nullable().default(null),
		host: z.string().optional(),
		photos: z
			.array(
				z.object({
					src: z.string(),
					alt: z.string(),
					caption: z.string().optional(),
				}),
			)
			.default([]),
		recap: z.string().nullable().default(null),
	}),
});

export const collections = { events };
