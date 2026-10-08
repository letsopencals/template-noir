# Template conventions

This is a Next.js 15 (App Router) / React 19 storefront template built on
`@opencals/storefront-sdk`. These conventions keep the template fast and
maintainable. They apply to every template in `templates/` — this file is meant
to be copied across them (only the template name / branding differs).

## Data fetching

**RSC-first.** Read data on the server and pass it down. Do NOT fetch cacheable
data in a `useEffect` on the client.

- Server reads go through `lib/server-data.ts` — `React.cache()`-wrapped helpers
  (`getStoreSettings`, `getProducts`, `getProduct`) that call the SDK directly.
  `React.cache` dedupes calls within a request. Never import `lib/server-data.ts`
  from a `'use client'` file.
- `app/layout.tsx` is an async Server Component: it fetches store settings once
  and seeds `<Providers initialSettings={...}>`. `SettingsProvider` takes the
  value as a prop — it does not fetch.
- Read-only pages (e.g. `app/services/page.tsx`) are async Server Components that
  fetch with `lib/server-data.ts` and hand the result to a small `'use client'`
  child as `initialProducts` / `initialProduct`.

**Client reads use SWR, seeded with server data.** For data that genuinely needs
to live on the client (filtering, availability, add-ons, cart), use `useSWR`
against the template's own `/api/*` routes, with `fallbackData` set to the
server-rendered value so there's no loading flash on first paint.

- Shared fetcher: `lib/fetcher.ts`.
- Build the SWR key from its inputs and pass `null` when not ready (e.g. no date
  picked yet) so nothing fetches prematurely. Multiple SWR hooks run in parallel
  — never chain fetches through sequential `useEffect`s.
- `revalidateOnFocus: false` unless you specifically want refocus revalidation.

The `/api/*` routes stay: they are the client/SWR data source and call the SDK
server-side via the `@/lib/opencals` side-effect import.

## Components & files

**Pages compose; components implement.** A `page.tsx` should be: data fetching
(RSC) + layout/composition + wiring. Presentational blocks and interactive
widgets live in `components/`.

- Guideline: any `page.tsx` over ~150 lines, or one that defines a section /
  widget component, gets decomposed into `components/`.
- Group `components/` by route/domain: `components/booking/`, `components/account/`,
  `components/services/`, `components/home/`; shared primitives in `components/ui/`.
  Co-locate a route's private components under a matching subfolder
  (e.g. `components/account/appointment-detail/`).

**Never define a component inside another component** — it remounts on every
parent render. Define at module scope (or a separate file). Module-scope sibling
helpers below a page are fine.

**Use the shared UI primitives — don't hand-style buttons/inputs inline.**
- `components/ui/button.tsx`: `<Button variant size fullWidth caps>`. Variants:
  `primary` (champagne fill, black text), `outline` (hairline that warms to
  champagne), `ghost`. Sizes `sm|md|lg`. **NOIR buttons are squared (2px).** This
  is the canonical shape, so don't reintroduce pills. `caps` (default true) gives
  the letterspaced uppercase label; pass `caps={false}` in dense forms. Links that
  should look like buttons use `buttonClasses(variant, size, { caps, fullWidth, className })`.
  Pass only layout classes via `className`.
- `components/ui/input.tsx` — `<Input>` / `<Textarea>` for text fields.
- Leave genuinely-different controls inline: selection/toggle chips with an
  active/selected state (staff/time/day/variant/location/department pickers, step
  indicator/progress, pagination), destructive buttons (no destructive variant),
  `<select>`, checkboxes/radios, icon-only controls, and navigation rendered as
  `next/link` `<Link>` (Button renders a `<button>` and has no anchor mode).

**Hooks are single-concern.** Split multi-purpose hooks so each has one
responsibility and independent dependencies (see `hooks/use-checkout-questions.ts`,
`hooks/use-payment-providers.ts`, `hooks/use-cart-expiry.ts`, split out of the
booking flow / cart context). A large hook may remain as a thin orchestrator that
composes the smaller ones (`hooks/use-booking-flow.ts`).

## Re-render hygiene

- **Memoize context provider values** with `useMemo` — an inline `value={{...}}`
  object makes every consumer re-render on each provider render. All contexts here
  (`settings`, `location`, `timezone`, `cart`) follow this.
- Hoist static objects (framer-motion `initial`/`animate`/`transition`, default
  non-primitive props) to module-level `const`s instead of recreating them inline.
- `React.memo` leaf components that take stable props and render often
  (e.g. `components/booking/step-indicator.tsx`).
- Prefer a ternary (`cond ? <x/> : null`) over `cond && <x/>` for conditional
  rendering, to avoid accidentally rendering `0`/`''`.

## Bundle

- Load heavy / below-the-fold components with `next/dynamic`. Stripe is loaded
  this way in `components/booking/booking-view.tsx` (`PaymentStep`, `ssr: false`)
  so it isn't in the initial bundle.
- Import directly from module paths; avoid barrel/index re-export files that pull
  in more than you use.

## NOIR Drive: luxury car rental (Dubai, AED)

### Foundation files (owned by the template foundation; raise changes, don't fork them)
`lib/site-config.ts` (all copy and the 12-car `fleetContent`), `app/globals.css`
(tokens and utilities), `app/layout.tsx` (fonts, providers, JSON-LD AutoRental),
`app/template.tsx`, `components/layout/{header,footer,menu-overlay,wordmark}.tsx`,
`components/motion/*`, `components/ui/{button,safe-image,page-heading}.tsx`,
`lib/rental.ts`, `lib/server-data.ts`.

### Design
- Fonts come from next/font in the layout: Archivo with the `wdth` axis
  (`.heading-display` uses font-stretch 125%, uppercase), Inter Tight for body
  text and Geist Mono for `.tabular` (prices and specs).
- Black surfaces, ivory ink and one champagne accent (`--color-primary`). Every
  `rounded-*` collapses to 2px.
- **Images:** every image sits inside an `.image-placeholder` container and
  renders through `SafeImage`, which hides on error or a missing src so the dark
  gradient shows. Slots are listed in `public/images/PLACEHOLDERS.md`.
- **Motion:** use `components/motion/*` (Reveal, RevealText, RevealImage,
  ParallaxImage, CountUp, Marquee, MagneticButton, DriveIn, PageTransition,
  ScrollProgress, SmoothScroll/useSmoothScroll). Every component has a
  reduced-motion fallback, and transitions and variants are module-scope consts
  (`easing.ts`). Lenis owns scrolling, so scrollable overlays need `data-lenis-prevent`.
  Import `useReducedMotion` from `@/components/motion/use-reduced-motion`, not
  from framer-motion. Framer's hook is null on the server and true on the first
  client render, so branching on it causes a hydration mismatch. Ours returns
  false while hydrating.
- **Pickers:** touch devices get native controls; mouse and trackpad get branded ones.
  The switch is CSS only (`pointer-coarse:` / `pointer-fine:hidden`), with both
  bound to the same state. The native control carries the form `name`, so the
  plain GET fallback still works. The branded controls are `components/ui/listbox.tsx`
  and `components/rental/date-range-popover.tsx` (`RangeCalendar` in a panel),
  both built on `components/ui/floating-panel.tsx`. That panel is portalled with
  fixed positioning, because the hero clips overflow. Mark extra triggers with
  `data-panel-for={id}`. Don't put `hidden` on `buttonClasses`/`Button`: there's
  no tailwind-merge, so the base `inline-flex` wins. Use `max-sm:hidden`.
- **Z-index:** header z-60, FloatingPanel z-62, menu z-55, cart drawer z-65/66, ScrollProgress z-60,
  PageTransition curtain z-70.

### Rentals: the fleet flow (`/fleet` → `/fleet/[slug]` → `/book`)
Each car is one product with a 1-day base duration (86400 s),
`allowCustomDuration`, no staff and `maxAttendees: 1`, on a continuous 24/7
schedule. N days = N base units = N × daily price. All rental dates use
`siteConfig.timezone` (`Asia/Dubai`); `TimezoneProvider` defaults to it.
- Data: `getFleet()` / `getCar(slug)` in `server-data.ts` merge API products
  with `fleetContent[slug]` (specs, deposit, km/day, min age). Client
  availability comes from `/api/products/[slug]/ranges?from&to` via
  `hooks/use-car-ranges.ts`, which returns merged UTC ranges.
- Fit checks happen on the client with `lib/rental.ts` (`fitsDates`,
  `isDayAvailable`, `latestReturnDate`). The server re-validates on booking.
- Booking: build the slot with `toAppointmentSlot(from, until, tz)`, which gives
  local 00:00 → 00:00 converted to UTC. Then call `hooks/use-rental-booking.ts`:
  `{ productId, ...toAppointmentSlot(...), staffMemberId: null, locationId }`.
- The handover window, collection address, flight number and so on are **not**
  part of the slot. They travel as appointment `customAttributes` (string to
  string; keys in `siteConfig.customAttributeKeys`). `/api/book` passes them
  through after sanitising.
- Shared steps: `addons-selector`, `questions-form`, `details-step` and
  `payment-step` (`RENTAL_STEPS`).

### Chauffeur: the classic flow (`/chauffeur` → `/booking/[slug]`)
Chauffeur products have real staff (drivers), so they reuse
`booking-view` + `use-booking-flow` + `staff-selector` (the "Chauffeur" step) verbatim.

## Verifying changes

- `npm run build` and `npm run lint` must pass. In the route summary, read-only
  pages should be `○` (static) or `ƒ` (dynamic) Server Components, not pure
  client pages.
- Smoke test: `/` and `/fleet` return 200, a car's ranges route returns merged
  ranges, a rental books the right UTC slot with its custom attributes, and
  `/booking/[slug]` books a chauffeur with a chosen driver.
