import type { APIRoute, GetStaticPaths } from "astro";
import { loadEvents } from "../../lib/events";
import { singleEventICS } from "../../lib/calendar";

// One downloadable .ics file per dated event, powering the "Add to calendar"
// button. TBD events have no date and are skipped.
export const getStaticPaths: GetStaticPaths = async () => {
	const { all } = await loadEvents();
	return all
		.filter((e) => singleEventICS(e) !== null)
		.map((e) => ({ params: { id: e.id }, props: { ics: singleEventICS(e)! } }));
};

export const GET: APIRoute = ({ props }) => {
	return new Response(props.ics as string, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": "attachment",
		},
	});
};
