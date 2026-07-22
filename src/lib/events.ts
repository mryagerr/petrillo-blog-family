import { getCollection, type CollectionEntry } from "astro:content";

export type Event = CollectionEntry<"events">["data"] & { id: string };

// Visual identity per event type: an emoji icon + an accent color token.
// Colors reference CSS custom properties defined in global.css.
export const TYPE_META: Record<
	Event["type"],
	{ label: string; icon: string; color: string }
> = {
	birthday: { label: "Birthday", icon: "🎂", color: "var(--tag-pink)" },
	holiday: { label: "Holiday", icon: "🎄", color: "var(--tag-green)" },
	wedding: { label: "Wedding", icon: "💍", color: "var(--tag-purple)" },
	reunion: { label: "Reunion", icon: "🌳", color: "var(--tag-green)" },
	gathering: { label: "Gathering", icon: "🍝", color: "var(--tag-orange)" },
	memorial: { label: "Memorial", icon: "🕊️", color: "var(--tag-blue)" },
	baptism: { label: "Baptism", icon: "🕊️", color: "var(--tag-blue)" },
	graduation: { label: "Graduation", icon: "🎓", color: "var(--tag-purple)" },
	anniversary: { label: "Anniversary", icon: "❤️", color: "var(--tag-pink)" },
};

/**
 * Parse an event's date + start time into a JS Date in a timezone-neutral way.
 * Returns null for TBD / dateless events.
 */
export function eventStart(e: Event): Date | null {
	if (!e.date || e.tbd) return null;
	const time = e.allDay || !e.startTime ? "00:00" : e.startTime;
	// Construct from parts to avoid UTC-vs-local surprises with bare ISO strings.
	const [y, m, d] = e.date.split("-").map(Number);
	const [hh, mm] = time.split(":").map(Number);
	return new Date(y, (m ?? 1) - 1, d, hh ?? 0, mm ?? 0);
}

/** An event counts as "past" once its day is over. TBD events are never past. */
export function isPast(e: Event, now: Date = new Date()): boolean {
	const start = eventStart(e);
	if (!start) return false; // TBD => always upcoming
	// Use end of the event's day so a same-day event still reads as upcoming.
	const endOfDay = new Date(start);
	endOfDay.setHours(23, 59, 59, 999);
	return endOfDay.getTime() < now.getTime();
}

/** Load all events, split into upcoming (soonest first) and past (newest first). */
export async function loadEvents(now: Date = new Date()): Promise<{
	upcoming: Event[];
	past: Event[];
	all: Event[];
}> {
	const raw = await getCollection("events");
	const all: Event[] = raw.map((entry) => ({ id: entry.id, ...entry.data }));

	const upcoming = all
		.filter((e) => !isPast(e, now))
		.sort((a, b) => {
			// TBD events sort to the end of the upcoming list.
			const sa = eventStart(a);
			const sb = eventStart(b);
			if (!sa && !sb) return 0;
			if (!sa) return 1;
			if (!sb) return -1;
			return sa.getTime() - sb.getTime();
		});

	const past = all
		.filter((e) => isPast(e, now))
		.sort((a, b) => {
			const sa = eventStart(a)?.getTime() ?? 0;
			const sb = eventStart(b)?.getTime() ?? 0;
			return sb - sa;
		});

	return { upcoming, past, all };
}

/** The soonest upcoming event that has an actual date (for the countdown). */
export function nextDatedEvent(upcoming: Event[]): Event | null {
	return upcoming.find((e) => eventStart(e) !== null) ?? null;
}

/** Human-friendly date/time label, e.g. "Sat, Aug 15, 2026 · 12:00 PM". */
export function formatWhen(e: Event): string {
	if (!e.date || e.tbd) return "Date to be announced";
	const start = eventStart(e)!;
	const dateStr = start.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	if (e.allDay || !e.startTime) return `${dateStr} · All day`;
	const timeStr = start.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
	return `${dateStr} · ${timeStr}`;
}

/** The set of years present across events, newest first (for filtering). */
export function eventYears(events: Event[]): number[] {
	const years = new Set<number>();
	for (const e of events) {
		const s = eventStart(e);
		if (s) years.add(s.getFullYear());
	}
	return [...years].sort((a, b) => b - a);
}
