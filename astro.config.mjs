// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	// IMPORTANT: set this to the real URL where the site is deployed (e.g.
	// "https://petrillo-blog-family.<account>.workers.dev" or a custom domain).
	// Pages are prerendered to static HTML, so this value is baked into the
	// absolute og:image / og:url / canonical links used for chat + social link
	// previews. While it's left as example.com, those previews will point at the
	// wrong host and the hero image will NOT show when you paste a URL in a chat.
	site: "https://example.com",
	integrations: [mdx(), sitemap()],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
