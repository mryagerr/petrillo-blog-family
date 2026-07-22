import type { APIRoute } from "astro";
import { loadEvents } from "../lib/events";
import { feedICS } from "../lib/calendar";

// Subscribable calendar feed. Relatives subscribe once (webcal://.../feed.ics)
// and every future event appears in their own calendar automatically.
// Carries only PII-safe info (venue + city), never exact home addresses.
export const GET: APIRoute = async () => {
	const { upcoming, past } = await loadEvents();
	// Include upcoming + recent past so newly-added history stays in sync.
	const body = feedICS([...upcoming, ...past]);
	return new Response(body, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'inline; filename="petrillo-family.ics"',
		},
	});
};
