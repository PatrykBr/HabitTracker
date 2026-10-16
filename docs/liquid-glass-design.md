# Liquid Glass design pass

Implemented on 15 October 2026, using Apple's iOS 27 design direction and
[materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials).

## Material hierarchy

Navigation and actions use the strongest glass treatment: a directional sheen,
continuous rim highlight, backdrop blur/saturation, and a soft floating shadow.
Content uses a quieter frosted material with a fine inset edge. A subdued cool
canvas makes the translucency visible without competing with habit colors.

The light and dark palettes have separate glass, surface, edge, and shadow tokens.
Increased contrast and reduced transparency switch to opaque surfaces. Existing
reduced-motion handling remains in place.

## Screens

- The dashboard uses individual habit cards with readable names, streaks,
  history counts, and progress toward the next milestone. Habit colors still
  identify the content; the navigation retains Reset's green accent.
- Both the single-habit home screen and habit details share a streak ring.
  Its arc represents progress toward the next milestone, with a visible text
  equivalent. The counter remains live and the time/date context stays available.
- The reset action is centered and uses tinted glass, a restart symbol, and a
  clear text label. Milestones use compact circular marks with accessible labels.
- The floating tab bar is wider, with a distinct selection lens and a separate
  add button. Its dimensions adapt to compact screens and enlarged text.
- Sheets retain focus trapping, dismissal, and busy protections. Their headers,
  close controls, and segmented selections now use the same material vocabulary.
- Login and profile styling follow the same shapes and system typography.
  Repeated staggered animations were removed from the detail sections.

## Verification

- Main review account restored after the server restart: `apple_review`, with
  five habits and 35 resets in the isolated local review database.
- Checked light and dark dashboard/detail/sheet appearances.
- Measured tab selection alignment at 320, 390, 430, 768, and 1280 CSS pixels.
  The settled selection and active tab align without page-level horizontal overflow.
- Created a separate single-habit account through signup, saved a Coffee habit,
  and verified its home-screen ring. Logged a reset with a trigger and note;
  the saved history appeared and the ring restarted toward 24 hours.
- Returned the preview to the original populated account.
- Typecheck, 60 unit tests, and the production build pass.

The preview host still duplicates captured mobile screenshots, so screenshots
were supplemented with DOM measurements and actual interactions. Physical iPhone
Safari and installed-PWA behavior remain outside this browser pass. This is a CSS
interpretation of Apple's material hierarchy, not the native rendering system.

References:

- [iOS 27 overview](https://images.apple.com/os/ios/)
- [iOS 27 design kits](https://developer.apple.com/news/?id=e2lxw9l1)
