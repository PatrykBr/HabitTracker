# UI review — 14 October 2026

The populated app has a coherent Apple-inspired visual hierarchy: large system
titles, inset grouped content, restrained color, and floating navigation. The
changes below improve the existing direction without replacing its design system.

## Review environment

- Dev server: http://localhost:3000, left running for review.
- Separate temporary Mongo replica set: localhost:27027, database
  `reset-ui-review`. Existing application data and `.env` were preserved.
- New account: `apple_review`, created through the signup form.
- Five habits and 35 resets: Smoking, Scrolling before bed, Energy drinks,
  Impulse shopping, and Late-night gaming and endless videos.
- Fixtures include zero resets, multiple resets on one day, long names,
  minute/hour/day streaks, savings, notes, triggers, and several months of history.
- Chromium on Windows, with 320 × 667, 390 × 844, and 1280 × 900 layouts.

## Findings and changes

- **Contrast:** secondary copy was too faint, and bright habit colors lost
  legibility on white surfaces. Text now uses stronger secondary colors and a
  separate theme-aware habit label color; decorative fills retain their color.
  Measured all 12 label colors in both themes: the minimum is 5.50:1 on grouped
  surfaces and 5.13:1 on 15% tinted surfaces. This measurement covers these label
  combinations, not a full WCAG conformance audit.
- **Navigation:** detail pages now share the large-title navigation component,
  with persistent back and edit controls and safe-area spacing. Navigation labels
  have room to grow with enlarged text.
- **Primary action:** the reset button was left-aligned and heavily styled.
  It is now a centered tinted action with the concise label “Log a reset.”
- **Touch targets:** segmented controls, color choices, trigger chips, sheet
  close controls, and month navigation now offer at least 44 CSS pixels in
  height. Calendar date targets use 44-pixel-high rows; on a 320-pixel viewport
  they are about 29 pixels wide, above Apple's documented 28-point minimum.
- **Sheets:** added a visible close button, kept drag dismissal and busy-state
  protection, and verified focus trapping, Escape dismissal, and focus restoration.
- **Compact layouts:** date and savings rows stack when space is limited. Icon
  and color pickers adapt to available width. Enlarging dashboard text to 200%
  previously reduced habit names to zero width; rows now reflow and preserve names.
- **Calendar:** day markers retain circular proportions without overlapping
  adjacent cells. Reset days include a restart symbol as well as color, and
  accessible labels include the full date. Today is exposed with `aria-current`.
- **Motion and appearance:** removed the continuously pulsing journey marker,
  added opaque material fallbacks for increased contrast/reduced transparency,
  and aligned browser theme colors with the app backgrounds.
- **Rendering:** fixed the online-state hydration mismatch. Node's navigator
  has no `onLine` property, so the server was rendering a false offline state.
  The first render is now consistent, with connection status read after mount.
  Disabled the development console bridge, which recursively echoed errors.

## Verified flows

- Signup → authenticated dashboard → create habit → reload persisted data.
- Backdate a reset with a note → confirm → updated streak, savings, and history.
- Edit and save a habit → reload saved data.
- Light/dark appearance changes, dashboard rows, detail pages, charts, and settings.
- Two resets on one calendar day → sheet displays both entries.
- Expand 16-reset history, then collapse to the initial seven entries.
- Keyboard focus stays in a sheet; Escape closes it and returns focus to its trigger.
- Offline state shows the banner and disables reset/edit actions; online restores them.
- An anonymous browser is redirected to `/login` and receives no habit UI.
- No page-level horizontal overflow in the tested compact and desktop layouts.
- 200% text checks on desktop detail and mobile dashboard/form layouts.
- Typecheck, 60 unit tests, and production build including service-worker generation.

## Scope and remaining device validation

This is a web PWA using Apple-inspired patterns, not native UIKit or SwiftUI.
Chromium emulation does not validate iPhone Safari, installed-PWA safe areas,
the software keyboard, VoiceOver, or system Dynamic Type. Those still need a
physical-device pass before claiming native-platform or full accessibility
conformance. The preview host also duplicated mobile screenshots; DOM measurements
and browser interactions were used to distinguish that capture artifact from the app.

The account and fixtures are in a throwaway database and last while the review
Mongo process runs. `bun scripts/seed-ui-review.mjs` idempotently populates only
this local review database after the account exists.

## Apple guidance used

- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  — legibility, contrast, text enlargement, and target sizes.
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  — glass for navigation and controls, clear separation from content, and accessibility adaptations.
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
  — system text styles, readable hierarchy, and larger-text support.
