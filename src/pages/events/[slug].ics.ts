import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildEventICS, type EventEntry } from "../../lib/events";

export async function getStaticPaths() {
	const events = await getCollection("events");
	return events.map((event) => ({
		params: { slug: event.id },
		props: { event },
	}));
}

export const GET: APIRoute = ({ props }) => {
	const event = props.event as EventEntry;
	return new Response(buildEventICS(event), {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": `attachment; filename="${event.id}.ics"`,
		},
	});
};
