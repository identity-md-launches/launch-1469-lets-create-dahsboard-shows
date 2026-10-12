# Etherpeek design

## Overview

Etherpeek is a single-page, read-only ETH balance checker for anyone curious
about a public Ethereum wallet. The implemented direction is quiet and spacious:
warm off-white, dark olive text, a lime action, and an illustrated crystal with
a small dose of personality. These are project design choices inferred from the
brief, not a supplied brand system.

The page prioritizes a short title, one visible address field, one primary action,
and one large balance. The etherling shares the result surface on desktop and
becomes a compact companion row on narrow screens. Additional precision and
explanations use native disclosure controls instead of permanent dashboard clutter.

The source of truth is [src/styles.css](src/styles.css), with composition in
[src/App.tsx](src/App.tsx). The final production export was viewed at 320, 390,
736, and 1440 CSS pixels; automated layout checks also covered 560 and 900px.

## Colors

Colors use sRGB hex primitives and semantic aliases in `src/styles.css:1`.
There is one light theme. Forced-colors mode uses system colors for control
boundaries and focus. No dark theme is implemented.

| Semantic token | Primitive / value | Role |
| --- | --- | --- |
| `--page` | `--neutral-50`, `#f8f9f5` | Page background |
| `--surface` | `--neutral-0`, `#ffffff` | Balance panel, input, secondary action |
| `--surface-muted` | `--neutral-100`, `#f0f2eb` | Neutral hover and disabled primary action |
| `--border` | `--neutral-200`, `#e0e4d9` | Decorative separators, dashboard boundary |
| `--control-border` | `--neutral-400`, `#7b866f` | Input and outlined button boundaries |
| `--text-muted` | `--neutral-600`, `#626b5c` | Supporting text, timestamps, asset labels |
| `--text` | `--neutral-900`, `#272e24` | Headings, primary text, balance |
| `--accent` | `--lime-300`, `#dfff98` | Primary action and brand mark |
| `--accent-hover` | `--lime-400`, `#d0f282` | Primary action hover |
| `--art-surface` | `--lime-100`, `#eff4df` | Companion background |
| `--focus` | `--purple-600`, `#7153ad` | Keyboard focus outline |
| `--error` | `--red-700`, `#a33930` | Field and service error text |
| `--status` | `#526d35` | Mainnet/result dot, always accompanied by text |

The companion’s four decorative palettes live in `src/Etherling.tsx:5`:
purple (`#ae9aea`, `#7d64c5`, `#c9b8fa`, `#65509c`), green (`#86b9a5`,
`#508d75`, `#b4dac6`, `#396e5b`), peach (`#e4a687`, `#bb765d`, `#f4cbb2`,
`#9a5c4b`), and blue (`#90b6df`, `#628abe`, `#bdd6f3`, `#4b6b9d`).
Address hashing chooses a palette. These colors do not encode financial status,
balance size, or a unique identity. The other SVG fills are decorative details.

Measured final pairs include body/page 13.22:1, secondary/page 5.26:1,
secondary/white 5.56:1, secondary/art 4.94:1, primary text/lime 12.58:1,
and the outlined nudge boundary/art 3.41:1. Full measurement scope and limits
are in [validation](artifacts/validation.md).

## Typography

The family is `'DM Sans Variable', 'DM Sans', sans-serif`, imported from
`@fontsource-variable/dm-sans` in `src/main.tsx`. Vite bundles the Latin and
Latin Extended normal WOFF2 files locally. The files provide weights 100–1000;
the UI uses 400, 450, 550, 600, and 750. No italic style is used. Browser font
inspection confirmed the Latin face loaded. Font synthesis is disabled.

There are six semantic size roles, declared once:

| Token | Value | Use |
| --- | --- | --- |
| `--text-small` | `.8125rem` / 13px at default | Hints, metadata, small controls, addresses |
| `--text-label` | `.875rem` / 14px | Field and balance labels, errors |
| `--text-body` | `1rem` / 16px | Input, main action, description, result copy |
| `--text-title` | `1.5rem` / 24px | Wordmark and ETH unit |
| `--text-heading` | `clamp(2rem, 4.2vw, 3.5rem)` | H1, 32–56px; long balance display |
| `--text-balance` | `clamp(3.5rem, 7.5vw, 6.5rem)` | Large balance, 56–104px |

H1 uses weight 550, line-height 1.1, tracking `-.055em`, and balanced wrapping.
The balance uses weight 450, line-height 1.1, tracking `-.075em`, and tabular
numbers. The ETH unit uses `-.03em`; the wordmark uses weight 750 and `-.06em`.
Body paragraphs use unitless 1.6 line-height and `text-wrap: pretty`; compact
companion text uses 1.5 on mobile. Numeric values remain selectable.

Addresses and exact values wrap anywhere when needed, with the address isolated
using `<bdi>`. The input can scroll its complete value horizontally using native
text editing. Its text stays at 1rem, including on mobile. Full balance precision
is always available in a labeled disclosure. Long-form helper copy is limited to
55–58ch. No small tracked uppercase labels are used.

## Layout

The spacing tokens are 4, 8, 12, 16, 24, 32, and 48px at a 16px root size
(`--space-1` through `--space-7`). Component-specific values such as the 20px
mobile inset and 36px result padding are explicit in CSS.

`.page-shell` is centered at a maximum of 1200px, with 40px inline padding on
desktop. The header and form share the dashboard’s leading edge. `main` grows
to fill a short viewport without fixed content heights. The header wraps when
its contents grow, including under text enlargement.

The desktop dashboard is a two-column grid: a flexible balance panel and a
340px companion panel. The form places a flexible input next to the primary
button. Its helper line separates reassurance from the public-wallet shortcut.

| Breakpoint | Implemented change |
| --- | --- |
| Up to `62rem` / 992px | Page inset 28px; companion 285px; balance inset 28px; extra intro and footer copy removed; metadata may wrap |
| Up to `46rem` / 736px | Page inset 20px; header minimum 88px; dashboard stacks; companion becomes a horizontal illustration/copy row; balance area remains first |
| Up to `35rem` / 560px | Input and full-width primary button stack; hints stack; companion art column 110px; network badge shortens to “Ethereum”; secondary metadata is reduced |

At 390×844, the primary button’s bottom was measured at 356.78px, so the
product description, labeled field, and main action are visible in the first
screen. Horizontal overflow checks passed at 320, 390, 560, 736, 900, and 1440px
in empty and large-number states. At 200% root text size and 390px, controls and
text reflow without horizontal page scrolling. This was text enlargement, not
browser-native zoom. English is the only implemented locale.

## Elevation & Depth

The surface system is mostly flat. The dashboard has a 1px structural border and
one very faint `0 4px 12px #272e2403` shadow. White and pale green distinguish
the functional and illustrated portions of the card. The SVG uses a translucent
ellipse under the character; it conveys illustration depth, not UI elevation.
There are no modals, floating toolbars, gradients, or stacked overlays. The skip
link alone uses a foreground layer (`z-index: 10`) when focused.

## Shapes

`--radius-sm` is 12px for the field shell and primary button; `--radius-lg` is
24px for the dashboard. The parent dashboard clips its two surfaces to one outer
shape. Secondary and icon buttons use 8px. The network badge and nudge button use
999px pill radii. The 36×40px brand mark has 12px corners and a -7° rotation.
Status dots are 6px circles. The illustration is an original inline SVG, so it
scales without an external image request.

## Components

| Component / pattern | Source and behavior |
| --- | --- |
| `App` / lookup form | `src/App.tsx`; real label, text input, native form submission, inline validation, Enter support, clear/cancel action, disabled primary action during requests |
| Balance panel | `src/App.tsx`; empty dash, loading message, successful balance, genuine zero, and recoverable service error; stable polite result announcements; snapshot timestamp and Refresh |
| Exact balance disclosure | Native `<details>` in `src/App.tsx`; full integer-derived precision, copy action and persistent copy feedback; manual-copy guidance if clipboard access fails |
| `Etherling({ address? })` | `src/Etherling.tsx`; four deterministic color variants, four greetings, expression changes and a short user-triggered nudge; defaults to purple without an address |
| `Icon({ name, className? })` | `src/Icon.tsx`; one 24px-viewBox outline set, 1.7 stroke weight, currentColor, hidden from assistive technology beside text |
| `EthereumMark({ className? })` | `src/Icon.tsx`; reusable decorative Ethereum mark for branding, field and asset label |
| Button styles | `.primary-button` for the lookup; `.secondary-button` for retry/copy; `.text-button` for quiet actions; `.icon-button` for clear/cancel; `.nudge-button` for the companion |
| About disclosure | Native `<details>` in the footer; explains native ETH scope, snapshot behavior and public-provider privacy without a separate route |

Interactive targets are at least 44px high; the primary action is at least 60px
on desktop and 52px on narrow screens. Visible focus is a 3px purple outline with
a 4px offset; the input uses an inset offset to keep its ring inside its shell.
Forced-colors mode uses the system `Highlight` color. The skip link is first in
keyboard order. State and validation information always has text, not only color.

Hover styles apply only to hover-capable pointers. When reduced motion is not
requested, buttons use 150ms background/transform transitions and a `.96` pressed
scale. Nudge is a user-triggered 650ms keyframe sequence. Loading dots pulse over
1200ms while a cancellable lookup is pending. Reduced motion removes these
animations; loading labels and the companion’s changed face/greeting still work.
There are no entrance animations or ambient looping character animations.

## Do’s and don’ts

- Start with `.page-shell`, the six text roles, and semantic color tokens. Keep
  form and result edges aligned and use space before adding separators.
- Keep one filled primary action. Use the existing neutral action patterns for
  precision, refresh, retry, and other supporting controls.
- Preserve `bigint` balance arithmetic and access to exact values. Never replace
  unavailable data with zero or leave a previous wallet’s result under a new one.
- Keep the companion playful and decorative. Its color does not imply wealth,
  risk, ownership, or a financial recommendation.
- Keep required assets local and `dist/` complete. A future page should reuse the
  shell, tokens and icon set, give itself a real heading, and keep its main action
  near the top. Use in-page/hash navigation unless a separate static HTML page is
  explicitly exported.

The review method and attribution are recorded in [README.md](README.md), and
coverage and limitations are in [artifacts/validation.md](artifacts/validation.md).
