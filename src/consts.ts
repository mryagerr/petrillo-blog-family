// ---------------------------------------------------------------------------
// Site configuration
// Non-developers: this is the ONE file (besides src/data/events.json) you may
// need to touch. Everything below is safe to edit — keep the quotes.
// ---------------------------------------------------------------------------

export const SITE_TITLE = "The Petrillo Family";
export const SITE_DESCRIPTION =
	"Gatherings, celebrations, and get-togethers for the Petrillo family and friends. Come see what's coming up.";

// The public web address of the site (used for the calendar-feed links).
// Update this to your real domain once deployed.
export const SITE_URL = "https://example.com";

// Who to reach with questions. Routed through the RSVP form / shared alias —
// never a personal phone number or personal email in public view.
export const ORGANIZER_NAME = "Maria";
export const CONTACT_URL = "https://forms.gle/PetrilloFamilyRSVP"; // form or mailto to a shared alias
export const CONTACT_LABEL = "our family RSVP form";

// -------------------------- Privacy / access mode --------------------------
// The whole site can run in two modes. Switch by changing this one value.
//
//   "gated"  -> The site is meant for invited guests only. Exact home
//               addresses, private-home map links, and photo galleries ARE
//               included, and a shared-password screen covers the site.
//               IMPORTANT: the built-in password screen is light-touch
//               obfuscation, not real security. For genuine privacy, ALSO
//               put the deployed site behind Cloudflare Access or HTTP Basic
//               Auth (see the README). Never publish exact addresses to a
//               fully open URL relying on the JS gate alone.
//
//   "public" -> The site is a fully public URL. Exact addresses, private-home
//               map links, and galleries are OMITTED from the build entirely
//               (not just hidden) so they can never leak. Guests get the
//               exact address after they RSVP.
//
// Default is "public" — the safe choice for a link you might share widely.
export const ACCESS_MODE: "public" | "gated" = "public";

// Shared password for the built-in gate (only used when ACCESS_MODE === "gated").
export const GATE_PASSWORD = "famiglia";

// Convenience flag used throughout the site.
// (Cast keeps this valid no matter which mode ACCESS_MODE is set to above.)
export const IS_GATED = (ACCESS_MODE as string) === "gated";
