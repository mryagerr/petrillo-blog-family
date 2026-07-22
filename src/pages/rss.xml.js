import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";

// A human-readable content feed (news-reader style). For adding events to a
// calendar app, use /calendar.ics instead.
export async function GET(context) {
	const events = (await getCollection("events")).filter((e) => !e.data.draft);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: events.map((event) => ({
			title: event.data.title,
			description: event.data.description,
			pubDate: event.data.eventDate ?? event.data.pubDate,
			link: `/events/${event.id}/`,
		})),
	});
}
