// Central site configuration.
// Non-developers can safely edit the values in this file — see README.md.

export const SITE_TITLE = "The Petrillo Family";
export const SITE_DESCRIPTION =
	"Upcoming and past gatherings for the Petrillo family, friends, and relatives.";

// ---------------------------------------------------------------------------
// Access / privacy model
// ---------------------------------------------------------------------------
// "public"  – the site is reachable by anyone with the link. Private home
//             addresses, exact map pins, and photo galleries stay hidden.
// "gated"   – the site sits behind a password / invite gate (e.g. Cloudflare
//             Access). Full addresses, map links, and galleries are revealed.
//
// IMPORTANT: only switch this to "gated" AFTER you have actually put an access
// gate in front of the site at the hosting layer. See README.md → "Public vs
// gated mode". Setting it to "gated" on an open URL would expose private info.
export const ACCESS_MODE: "public" | "gated" = "public";

// ---------------------------------------------------------------------------
// How people respond & reach the organizer (routed through a form / alias,
// never a raw personal phone or email in public view).
// ---------------------------------------------------------------------------
export const ORGANIZER_NAME = "Michael";
// A form URL or shared alias. Replace with your real RSVP/contact form or a
// mailto to a shared family alias (not a personal address).
export const CONTACT_URL = "mailto:petrillo.family.events@example.com";
export const RSVP_INSTRUCTION =
	"Tap “RSVP” on any event to let the host know you're coming.";
export const PRIVACY_NOTE =
	"We keep home addresses private — you'll get the full address after you RSVP.";

// ---------------------------------------------------------------------------
// Event types: emoji icon + warm color tag for each category.
// ---------------------------------------------------------------------------
export type EventType =
	| "birthday"
	| "holiday"
	| "wedding"
	| "reunion"
	| "gathering"
	| "memorial"
	| "celebration";

export const EVENT_TYPES: Record<
	EventType,
	{ label: string; icon: string; color: string }
> = {
	birthday: { label: "Birthday", icon: "🎂", color: "#c05621" },
	holiday: { label: "Holiday", icon: "🎄", color: "#2f855a" },
	wedding: { label: "Wedding", icon: "💍", color: "#b83280" },
	reunion: { label: "Reunion", icon: "👨‍👩‍👧‍👦", color: "#2b6cb0" },
	gathering: { label: "Gathering", icon: "🍽️", color: "#b7791f" },
	memorial: { label: "Memorial", icon: "🕊️", color: "#6b7280" },
	celebration: { label: "Celebration", icon: "✨", color: "#805ad5" },
};
