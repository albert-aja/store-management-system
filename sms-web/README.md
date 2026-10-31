# SMS Workspace

Management UI built with React, Material UI 9, MUI X Data Grid, Recharts 3,
MapLibre GL JS 6, and React Flow for approval workflows.

## Run

Use Node.js 22.12+ (or a supported newer version).

```sh
npm ci
npm run dev
```

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL`
in local Vite configuration. Management access still requires an authenticated
employee; the UI redesign does not bypass role or permission checks.

## Visual system

[theme.ts](src/theme.ts) owns light/dark colors, typography, card and dialog
surfaces, form controls, table density, and Data Grid styles.
[AppLayout](src/components/AppLayout.tsx) provides grouped desktop navigation,
phone/tablet drawer navigation, quick search (`Ctrl/Cmd+K`), notifications,
theme switching, and sign-out. All existing management routes are retained.

Use sky-blue for primary actions, slate backgrounds, 16px cards, restrained
borders, and minimal shadows. Standard controls are 40px high; small actions in
dense tables are 32px. Tables scroll inside their containers on narrow screens.
Respect the user's light/dark preference and reduced-motion setting.

## Language and formatting

The management interface defaults to Bahasa Indonesia and offers an ID/EN
switcher on sign-in and in the authenticated shell. The selection is stored in
`localStorage` (`sms-management-language`) and is applied to Material UI and
Data Grid locale packs. Localized UI messages are maintained in the source catalog at
[`src/lib/locale.ts`](src/lib/locale.ts); displayed customer, product, employee,
and backend values are not translated or changed before submission. Dates and
numbers use the selected locale while currency remains IDR and dispatch-time
rules remain WIB. Add new messages to both locale catalogs and render them
through `t()` rather than translating displayed data.

## Self-hosted maps

Set `VITE_MAP_STYLE_URL` to a MapLibre Style Specification JSON URL hosted on
your infrastructure. Docker Compose passes `MANAGEMENT_MAP_STYLE_URL` as this
build argument. Rebuild the management image after changing it.

The style, tiles, fonts, sprites, and any referenced resources must also be
self-hosted/trusted. Configure CORS for the management origin, retain required
map-data attribution, and serve resources over HTTPS in production. MapLibre
workers are bundled locally by Vite; no external worker CDN is used.
For restrictive CSP deployments, allow the bundled worker in `worker-src 'self'`
and your map host in the appropriate resource directives.

Worker GPS points and recorded route geometry are rendered client-side. No
geocoding, routing, or external telemetry service is added. Without a style,
the map displays a clearly labeled plain background with GPS positions; it
does not fabricate streets or a depot.

Live maps preserve camera position during polling and offer **Fit locations**.
Historical playback follows recorded latitude/longitude, with start/end and
current markers. Invalid GPS points produce a warning and break route segments.
WebGL/resource errors are shown explicitly; location tables remain available.

Delivery orders support optional verified destination latitude/longitude pairs
(migration V35). Enter both coordinates in the outbound delivery creation dialog
to enable worker-app navigation handover (Q.30). Legacy orders have no invented
coordinates. The management stop list remains a sequence view, not a calculated
street route; simulated distances and transit times are not operational facts.

## Customer reschedule review (P.33)

Management users with `DELIVERY_MANAGE` review pending requests under
**Deliveries & Trips**. Set explicit planned dispatch time (WIB) on new trips or
in a planned trip's detail screen. Legacy date-only trips remain ineligible for
self-service changes until an actual departure time is set.

Choose a planned trip in the same store on the customer's requested date, with
dispatch before their window ends, to approve a request. Approval changes only
that delivery order's assignment, appends it to the new trip's stop sequence,
and records the accepted window. It does not change other customers' shared
trip dates. Original/replacement dispatch and requested window start must remain
at least 24 hours away at approval time. Rejection requires a reason.

Requests retain original schedule snapshots and decision audit fields.
Stale/already-decided requests produce conflicts; optimistic versions protect
trip/order reassignment against concurrent dispatch and review. Migration V36
also enforces a single pending request per stop. Staff review and schedule edits
are restricted by store scope. Customer APIs require verified account ownership.

## Validation

```sh
npm test
npm run build
npm run lint
```

Tests cover management workflows, shared styling, responsive navigation, GPS
geometry, map lifecycle/selection, and reporting charts.
The repository has existing lint findings and dependency audit advisories;
do not suppress them with broad rule disables or force dependency upgrades.
