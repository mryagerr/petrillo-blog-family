import type { APIRoute } from "astro";
import { getSortedEvents, buildFeedICS } from "../lib/events";

// The subscribable feed. Relatives subscribe to this URL once and every new
// (dated) event shows up in their own calendar automatically. It carries only
// the same PII-scrubbed info shown on the page — no private addresses.
export const GET: APIRoute = async () => {
	const { upcoming, past } = await getSortedEvents();
	const body = buildFeedICS([...upcoming, ...past]);
	return new Response(body, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'inline; filename="petrillo-family-events.ics"',
		},
	});
};
