import { getCollection, type CollectionEntry } from "astro:content";
import { ACCESS_MODE, SITE_TITLE } from "../consts";

export type EventEntry = CollectionEntry<"events">;

const startOfToday = () => {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
};

// The last day an event is "active" (endDate for multi-day, else eventDate).
const lastDayOf = (e: EventEntry): Date | undefined =>
	e.data.endDate ?? e.data.eventDate;

export const hasDate = (e: EventEntry): boolean =>
	!e.data.tbd && !!e.data.eventDate;

// Sort events into upcoming (soonest first) and past (most recent first).
// Undated / TBD events are treated as upcoming and sorted to the end.
export async function getSortedEvents(): Promise<{
	upcoming: EventEntry[];
	past: EventEntry[];
}> {
	const all = (await getCollection("events")).filter((e) => !e.data.draft);
	const today = startOfToday();

	const isPast = (e: EventEntry) => {
		const last = lastDayOf(e);
		return !e.data.tbd && !!last && last < today;
	};

	const upcoming = all
		.filter((e) => !isPast(e))
		.sort((a, b) => {
			const av = a.data.eventDate?.valueOf() ?? Infinity;
			const bv = b.data.eventDate?.valueOf() ?? Infinity;
			return av - bv;
		});

	const past = all
		.filter(isPast)
		.sort(
			(a, b) =>
				(lastDayOf(b)?.valueOf() ?? 0) - (lastDayOf(a)?.valueOf() ?? 0),
		);

	return { upcoming, past };
}

// A plain-text, PII-safe location string for calendars and cards.
export function displayLocation(e: EventEntry): string {
	const parts: string[] = [];
	if (e.data.locationName) parts.push(e.data.locationName);
	if (e.data.locationCity) parts.push(e.data.locationCity);
	return parts.join(", ");
}

// Whether the exact address / map link may be shown for this event.
export function mayRevealAddress(e: EventEntry): boolean {
	return !e.data.locationPrivate || ACCESS_MODE === "gated";
}

// Whether a photo gallery may be shown (galleries are gated by default).
export function mayRevealGallery(): boolean {
	return ACCESS_MODE === "gated";
}

// -------------------------------------------------------------------------
// Calendar helpers (.ics files + Google Calendar links)
// -------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

// All-day value: YYYYMMDD (uses UTC parts so it is stable across servers).
const icsDateOnly = (d: Date) =>
	`${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

const addDays = (d: Date, days: number) => {
	const r = new Date(d);
	r.setUTCDate(r.getUTCDate() + days);
	return r;
};

// Parse "6:00 PM" / "18:00" into { h, m }. Returns null if unparseable.
function parseTime(s?: string): { h: number; m: number } | null {
	if (!s) return null;
	const m = s.trim().match(/^(\d{1,2}):?(\d{2})?\s*([ap]\.?m\.?)?$/i);
	if (!m) return null;
	let h = parseInt(m[1], 10);
	const min = m[2] ? parseInt(m[2], 10) : 0;
	const ampm = m[3]?.toLowerCase();
	if (ampm?.startsWith("p") && h < 12) h += 12;
	if (ampm?.startsWith("a") && h === 12) h = 0;
	return { h, m: min };
}

// Floating local time value: YYYYMMDDTHHMMSS (no Z — calendar apps read it in
// the viewer's own timezone, which is what a family event wants).
function icsLocalDateTime(d: Date, t: { h: number; m: number }) {
	return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
		d.getUTCDate(),
	)}T${pad(t.h)}${pad(t.m)}00`;
}

const escapeICS = (s: string) =>
	s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(
		/\n/g,
		"\\n",
	);

// Fold a single content line to 75 octets per RFC 5545, without splitting a
// multi-byte UTF-8 character. Continuation lines begin with a single space.
function foldLine(line: string): string {
	const enc = new TextEncoder();
	if (enc.encode(line).length <= 75) return line;
	const out: string[] = [];
	let current = "";
	let bytes = 0;
	let limit = 75;
	for (const ch of line) {
		const chBytes = enc.encode(ch).length;
		if (bytes + chBytes > limit) {
			out.push(current);
			current = " " + ch; // leading space marks a continuation
			bytes = 1 + chBytes;
			limit = 75;
		} else {
			current += ch;
			bytes += chBytes;
		}
	}
	if (current) out.push(current);
	return out.join("\r\n");
}

const foldICS = (ics: string) =>
	ics.split("\r\n").map(foldLine).join("\r\n");

// Build the DTSTART / DTEND lines for one event.
function dtLines(e: EventEntry): string[] {
	const start = e.data.eventDate!;
	const time = parseTime(e.data.startTime);
	if (time) {
		const startLine = `DTSTART:${icsLocalDateTime(start, time)}`;
		// Default duration: 2 hours.
		const endBase = e.data.endDate ?? start;
		const end = new Date(endBase);
		const endLine = `DTEND:${icsLocalDateTime(end, {
			h: time.h + 2,
			m: time.m,
		})}`;
		return [startLine, endLine];
	}
	// All-day (DTEND is exclusive → +1 day past the last day).
	const last = e.data.endDate ?? start;
	return [
		`DTSTART;VALUE=DATE:${icsDateOnly(start)}`,
		`DTEND;VALUE=DATE:${icsDateOnly(addDays(last, 1))}`,
	];
}

function vevent(e: EventEntry): string {
	const uid = `${e.id}@petrillo-family-events`;
	const lines = [
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${icsDateOnly(new Date())}T000000Z`,
		`SUMMARY:${escapeICS(e.data.title)}`,
		...dtLines(e),
	];
	if (e.data.description)
		lines.push(`DESCRIPTION:${escapeICS(e.data.description)}`);
	const loc = displayLocation(e);
	if (loc) lines.push(`LOCATION:${escapeICS(loc)}`);
	lines.push("END:VEVENT");
	return lines.join("\r\n");
}

function wrap(body: string, calName: string): string {
	const raw = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Petrillo Family Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${escapeICS(calName)}`,
		body,
		"END:VCALENDAR",
	].join("\r\n");
	return foldICS(raw);
}

// A single-event .ics file.
export function buildEventICS(e: EventEntry): string {
	return wrap(vevent(e), e.data.title);
}

// The subscribable feed: every dated event in one calendar.
export function buildFeedICS(events: EventEntry[]): string {
	const body = events.filter(hasDate).map(vevent).join("\r\n");
	return wrap(body, `${SITE_TITLE} Events`);
}

// A one-tap "Add to Google Calendar" link.
export function googleCalendarUrl(e: EventEntry): string {
	const start = e.data.eventDate!;
	const time = parseTime(e.data.startTime);
	let dates: string;
	if (time) {
		const end = e.data.endDate ?? start;
		dates = `${icsLocalDateTime(start, time)}/${icsLocalDateTime(end, {
			h: time.h + 2,
			m: time.m,
		})}`;
	} else {
		const last = e.data.endDate ?? start;
		dates = `${icsDateOnly(start)}/${icsDateOnly(addDays(last, 1))}`;
	}
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: e.data.title,
		dates,
		details: e.data.description ?? "",
		location: displayLocation(e),
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
