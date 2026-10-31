# SMS Mart Web

## Run

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Google and email OTP configuration, callback URLs, and release checks:
[Infrastructure setup guide](../docs/infrastructure_setup_guide.md#7-e-commerce-google-login-and-email-otp).
Missing Supabase settings keep guest browsing available and show a configuration
error when login is attempted.

## Styling

Tailwind 3 is compiled by Vite through [PostCSS](postcss.config.js); no runtime
CDN is needed. [tailwind.config.js](tailwind.config.js) scans all source components.
[index.css](src/index.css) defines reusable buttons, inputs, grids, focus rings,
reduced-motion behavior, and safe-area spacing.

The [Flutter app](../ecommerce-mobile/README.md) uses matching visual tokens:
primary `#0284C7`, background `#F8FAFC`, text `#0F172A`, border `#E2E8F0`,
16px card corners, 12px control corners, and actions at least 44px high.
Web uses Plus Jakarta Sans; native uses its platform font.

Product grids show two columns on phones, three at 768px, and four at 1024px.
Phone layouts include bottom navigation; wider screens use header navigation.
Home, catalog, account, and authentication follow the same light card-based
visual language as the app, with platform-specific navigation.

## Delivery rescheduling (P.33)

Signed-in customers can request date/window changes from order tracking.
The server verifies ownership through the authenticated account; no supplied
customer ID is trusted. Windows are morning 09:00-12:00 and afternoon 12:00-17:00
in Asia/Jakarta (WIB).

Requests require a pending delivery on a planned trip with an explicit
departure time at least 24 hours away; exactly 24 hours is permitted.
The requested window must also start at least 24 hours from submission.
One pending request per stop is allowed. Submission does not change the schedule.
Pending, approved, and rejected decisions remain visible, with decision notes.
Reload tracking to retrieve later dispatcher decisions.

Dispatchers review requests in management **Deliveries & Trips** and select a
planned same-store trip on the requested date. Approval moves only that stop,
preserving other customers' trip schedules, and rechecks the 24-hour cutoff.
Missing schedules, ownership failures, and API failures are explicit; rescheduling
never falls back to mock data.

Apply backend migrations V35 and V36 and set actual planned dispatch times in
management before enabling this workflow. Date-only legacy trips are not treated
as having an invented departure time.

## Shared wishlist and gift intent (P.27)

Use **Share wishlist** on the private wishlist to create a server-persisted,
30-day snapshot. Each saved product represents one gift. Only product IDs,
names, variant names, images and quantity are copied: no identity, contact
details, private notes, prices or account/session identifiers are published.
Private wishlist edits do not modify a previously shared snapshot.

Account owners and guests can create and revoke their own links. Guest ownership
depends on the saved browser session: clearing storage loses owner management
access, but does not delete already-shared snapshots. Save the generated link
immediately; the server retains only its token hash and cannot show it again.
The sharing menu uses Web Share when available, otherwise clipboard copy; manual
copy remains available if browser clipboard permissions fail.

Anyone with `/wishlist/share/:token` can view without login and anonymously
reserve a whole gift. Reservation is **intent only**, not a verified purchase
or inventory hold. The successful claimant receives a private cancellation key,
saved locally and shown for manual recovery. Never send that key in the public
URL. Losing all copies of the key loses the ability to cancel the claim.
Revoked or expired links cannot be viewed or modified. Public API failures never
fall back to sample wishlists.

Set `VITE_PUBLIC_STOREFRONT_URL` to the production HTTPS origin (also a Docker
build argument). Without it, web uses its current origin; HTTP is allowed only
on localhost for development. All links require the backend migration and API.

Installed-app handover requires production Android App Links / iOS Universal
Links association files; see [mobile deployment instructions](../ecommerce-mobile/README.md).
Serve real `/.well-known/assetlinks.json` and
`/.well-known/apple-app-site-association` files from this HTTPS origin with no
redirects, using your actual release signing fingerprint and Apple Team ID.
Do not publish placeholder associations. Without verified native configuration,
links continue to open the website; no app installation detection is fabricated.

The [Nginx config](nginx.conf) serves SPA shared routes with `no-store`,
`noindex` and `no-referrer`, and returns 404 for missing association files rather
than an HTML SPA fallback. Other hosts must provide equivalent routing/headers.
Configure the public API gateway to return `Cache-Control: no-store`, redact
share tokens from access logs, and avoid recording cancellation request bodies.
No personalized social preview/identity is exported.

## Language

Every screen uses Indonesian by default. The always-visible **ID / EN** header
selector also works before login and on phones. The choice persists in browser
storage (`sms_storefront_language`) and follows changes in other tabs; changing
language does not clear cart, authentication, or in-progress forms.

[The source catalog](src/i18n/catalog.ts) contains English translations with
Indonesian source keys and explicit Indonesian overrides for English labels and
backend status/error codes. [The provider](src/i18n/index.tsx) updates document
language, title, and number/date formatting. Prices remain IDR; delivery windows
and dispatch times remain WIB (Asia/Jakarta), regardless of selected language.
Customer/product names, addresses, notes and server-authored catalog content are
not automatically translated. Known operational errors are translated; unknown
server diagnostics remain visible verbatim. Browser storage failures show an alert.

Add static UI copy through `useI18n().t`, with named interpolation parameters.
Use `message` only for known API status/error descriptions, preserving unknown
details. Never localize enum values sent to the API.

## Validation

```sh
npm test
npm run build
```

Tests compile the actual Tailwind CSS and verify layout tokens, authentication,
and product cart/wishlist actions.
