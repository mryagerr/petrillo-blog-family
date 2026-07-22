import { SITE_TITLE, SITE_URL } from "../consts";
import { eventStart, formatWhen, type Event } from "./events";

// ---------------------------------------------------------------------------
// Calendar helpers: .ics files (download + subscribable feed) and Google
// Calendar "add" links. Everything here uses ONLY PII-safe location data
// (venue + city/area). Exact home addresses are never written to a calendar
// file or link, even in gated mode — those feeds can travel anywhere.
// ---------------------------------------------------------------------------

/** A calendar-safe location string: venue name + general area, no exact address. */
function safeLocation(e: Event): string {
	return [e.venue, e.cityArea].filter(Boolean).join(", ");
}

/** Format a Date as an ICS UTC timestamp: 20260815T160000Z */
function toICSDateTimeUTC(d: Date): string {
	return (
		d.getUTCFullYear().toString().padStart(4, "0") +
		(d.getUTCMonth() + 1).toString().padStart(2, "0") +
		d.getUTCDate().toString().padStart(2, "0") +
		"T" +
		d.getUTCHours().toString().padStart(2, "0") +
		d.getUTCMinutes().toString().padStart(2, "0") +
		d.getUTCSeconds().toString().padStart(2, "0") +
		"Z"
	);
}

/** Format a Date as an ICS all-day value: 20260815 (local calendar day). */
function toICSDate(d: Date): string {
	return (
		d.getFullYear().toString().padStart(4, "0") +
		(d.getMonth() + 1).toString().padStart(2, "0") +
		d.getDate().toString().padStart(2, "0")
	);
}

/** Escape text per RFC 5545 (commas, semicolons, backslashes, newlines). */
function escapeICS(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");
}

/** Fold long lines to 75 octets per RFC 5545. */
function foldLine(line: string): string {
	if (line.length <= 75) return line;
	const chunks: string[] = [];
	let rest = line;
	chunks.push(rest.slice(0, 75));
	rest = rest.slice(75);
	while (rest.length > 74) {
		chunks.push(" " + rest.slice(0, 74));
		rest = rest.slice(74);
	}
	if (rest.length) chunks.push(" " + rest);
	return chunks.join("\r\n");
}

/** Build one VEVENT block, or null if the event has no usable date (TBD). */
export function toVEvent(e: Event, stamp: Date): string | null {
	const start = eventStart(e);
	if (!start) return null; // TBD events can't be added to a calendar yet

	const lines: string[] = ["BEGIN:VEVENT"];
	lines.push(`UID:${e.id}@petrillo-family`);
	lines.push(`DTSTAMP:${toICSDateTimeUTC(stamp)}`);

	if (e.allDay || !e.startTime) {
		const end = new Date(start);
		end.setDate(end.getDate() + 1);
		lines.push(`DTSTART;VALUE=DATE:${toICSDate(start)}`);
		lines.push(`DTEND;VALUE=DATE:${toICSDate(end)}`);
	} else {
		const end = new Date(start);
		if (e.endTime) {
			const [eh, em] = e.endTime.split(":").map(Number);
			end.setHours(eh ?? end.getHours(), em ?? 0);
		} else {
			end.setHours(end.getHours() + 2); // default 2h if no end time
		}
		lines.push(`DTSTART:${toICSDateTimeUTC(start)}`);
		lines.push(`DTEND:${toICSDateTimeUTC(end)}`);
	}

	lines.push(`SUMMARY:${escapeICS(e.title)}`);
	lines.push(`LOCATION:${escapeICS(safeLocation(e))}`);
	const desc = [e.description, e.host].filter(Boolean).join("\n\n");
	lines.push(`DESCRIPTION:${escapeICS(desc)}`);
	lines.push(`URL:${SITE_URL}/#${e.id}`);
	lines.push("END:VEVENT");

	return lines.map(foldLine).join("\r\n");
}

/** A full .ics document for a single event (used by the download button). */
export function singleEventICS(e: Event): string | null {
	const vevent = toVEvent(e, new Date());
	if (!vevent) return null;
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Petrillo Family//Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		vevent,
		"END:VCALENDAR",
	].join("\r\n");
}

/** A full .ics feed for many events (the subscribable feed). */
export function feedICS(events: Event[]): string {
	const stamp = new Date();
	const vevents = events
		.map((e) => toVEvent(e, stamp))
		.filter((v): v is string => v !== null);
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Petrillo Family//Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${escapeICS(SITE_TITLE + " Events")}`,
		"X-WR-TIMEZONE:UTC",
		...vevents,
		"END:VCALENDAR",
	].join("\r\n");
}

/** A Google Calendar "add event" URL, or null for TBD events. */
export function googleCalendarUrl(e: Event): string | null {
	const start = eventStart(e);
	if (!start) return null;

	let dates: string;
	if (e.allDay || !e.startTime) {
		const end = new Date(start);
		end.setDate(end.getDate() + 1);
		dates = `${toICSDate(start)}/${toICSDate(end)}`;
	} else {
		const end = new Date(start);
		if (e.endTime) {
			const [eh, em] = e.endTime.split(":").map(Number);
			end.setHours(eh ?? end.getHours(), em ?? 0);
		} else {
			end.setHours(end.getHours() + 2);
		}
		dates = `${toICSDateTimeUTC(start)}/${toICSDateTimeUTC(end)}`;
	}

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: e.title,
		dates,
		details: `${e.description}\n\n${formatWhen(e)}\n${SITE_URL}/#${e.id}`,
		location: safeLocation(e),
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
