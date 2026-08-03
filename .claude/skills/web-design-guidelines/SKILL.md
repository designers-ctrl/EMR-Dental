---
name: web-design-guidelines
description: >-
  Review-TIME audit of EXISTING UI code for interface-correctness — accessibility, focus, keyboard,
  forms, states, motion, typography detail, and copy — returning terse file:line findings. Use when
  asked to "review my UI", "check accessibility", "audit the UI/UX", or "check this screen against
  best practices". Self-contained/offline, translated to React 19 + MUI 9; defers to mui-ds for
  anything visual. NOT design generation or layout/composition (that's frontend-design).
metadata:
  author: Adapted from Vercel's Web Interface Guidelines
  source: https://github.com/vercel-labs/web-interface-guidelines
  version: "2.0.0-template"
---

# Web Interface Guidelines

A self-contained checklist for reviewing UI **code correctness** in this app. It is intentionally
inlined (no network fetch) so it works offline and in headless runs, and it has been translated to
this stack: **React 19 + MUI 9**, @mui/icons-material, no Tailwind, no router, no SSR.

**Scope boundaries (read first):**

- **Defer to `mui-ds` for anything visual** — colors, radius, spacing, type scale, component
  choice. This skill checks whether the UI *works and is accessible*, not whether it's on-brand.
  If a fix would touch a token, phrase it in token terms and point at mui-ds.
- **MUI already ships** ripple/focus/hover, label association, and hit targets on its components.
  Only flag these on **hand-rolled** surfaces (`Box` + `sx` with `onClick`, plain `<div>`/`<span>`)
  — never recommend hand-rolling what an MUI component provides.
- **Trust rule:** accessibility and unambiguous states are requirements, not polish. Weight
  findings accordingly; never invent domain data to illustrate a finding.

## How to run a review

1. Read the specified files (ask for a file/pattern if none given).
2. Check against the rules below.
3. Output findings grouped **by file**, terse, in `file:line` format (VS Code clickable). Mark a
   clean file `✓ pass`. Omit explanation unless the issue is non-obvious.

---

## Accessibility

- Icon-only buttons need an accessible name (`aria-label`, or a wrapping `<Tooltip>` plus
  `aria-label`). `<IconButton>` renders no text — it needs one.
- Every form control needs a label — MUI's `label` prop, `<FormControlLabel>`, or `aria-label`.
- An action is a `<Button>`/`<ButtonBase>`; navigation is an `<a>`/`<Link>`. Don't put `onClick`
  navigation on a plain `<div>`/`<Box>` without button/link semantics + keyboard.
- Images need `alt` (`alt=""` if purely decorative).
- Decorative icons need `aria-hidden="true"`; icons that carry meaning need a text alternative.
  MUI icons render `aria-hidden` by default — check any you've given a role.
- Async updates (`<Snackbar>`, `<Alert>`, inline validation) need a polite live region
  (`aria-live="polite"`) so screen readers announce them.
- Prefer semantic HTML before reaching for ARIA.
- Headings run in order (`<h1>`→`<h6>`); provide a skip link to main content. `<Typography>` sets
  the tag from `variant` — check it matches the outline, or override with `component`.

## Focus & keyboard

- Every interactive element has a **visible** focus indicator. MUI components ship one — keep it.
  Custom surfaces must add their own.
- Never remove an outline without replacing it.
- Use `:focus-visible` (not `:focus`) so a ring doesn't flash on mouse click.
- Compound/custom controls: pair `:hover` with `:focus-within` for keyboard parity (see the
  reveal-on-hover pattern in mui-ds "State ownership").

## Forms

- Inputs carry a meaningful `name` and the right `autocomplete` value (and `autocomplete="off"` on
  non-auth fields that shouldn't be remembered).
- Use the correct `type` and `inputmode` (email, tel, numeric…) so the right keyboard appears.
- Never block paste; never block zoom.
- Labels are clickable and tied to their control (`<TextField label>` / `<FormControlLabel>` handle this).
- Turn off spellcheck on emails, codes, usernames (`spellcheck="false"`).
- Checkbox/radio: label + control share one hit target (`<FormControlLabel>` handles this — verify on custom
  ones).
- Submit stays enabled until the request actually starts; show `loading` then.
- Validation errors show **inline** (`error` + `helperText` on the field); move focus to the first
  error on submit.
- Placeholders and truncated hints end with `…`.
- Warn before discarding a form with unsaved changes (`beforeunload`, or a confirm dialog).

## Motion

- Honor `prefers-reduced-motion` — gate non-essential animation behind it.
- Animate `transform` / `opacity` only; never `transition: all`.
- Set a correct `transform-origin`; put SVG transforms on a `<g>` wrapper.
- Animations are interruptible.
- Restraint: on a high-trust surface, less motion reads as more trustworthy — don't decorate.

## Typography detail

- `…` not `...`; curly quotes (`“ ”` `‘ ’`) not straight (`" "` `' '`); non-breaking spaces in numbers, units,
  and brand names so they don't wrap awkwardly (e.g. `10 mg`, the product name).
- Loading states end with `…`.
- `font-variant-numeric: tabular-nums` for any column of numbers — data tables, metrics, counts —
  so digits align.
- `text-wrap: balance` on multi-line headings.
- (Sizing/scale itself is governed by mui-ds — use `<Typography variant>`, not raw font sizes.)

## Content handling

- Text containers handle long/overflowing content (truncate or wrap deliberately).
- A flex child that should truncate needs `min-width: 0` — otherwise it refuses to shrink.
- Every list/data view has a designed **empty state**.
- Anticipate variable input lengths (long names, long medication labels) — don't assume short.

## Images & media

- `<img>` carries explicit `width`/`height` (or an aspect-ratio box) to prevent layout shift.
- Below-the-fold images: `loading="lazy"`. Critical hero images: `fetchpriority="high"`.

## Performance

- Virtualize large lists. MUI **core** has no virtualiser, but **`@mui/x-data-grid` is installed
  and virtualizes rows natively** — reach for it before anything else. No third-party virtualiser
  (`react-window`, `virtua`) is installed; don't assume one. If you cap or paginate instead, say so.
- Don't read layout (`offsetWidth`, `getBoundingClientRect`) during render; batch DOM work.
  (`react-performance` → `js-batch-dom-css` has the detail.)
- `preconnect` to third-party origins. **Fonts need no preconnect here** — Inter is self-hosted via
  `@fontsource/inter`, imported in `main.tsx` and `storybook-main.tsx`, so there is no external font
  origin to reach.

## Navigation & state

- The URL reflects meaningful state; stateful views are deep-linkable. (No router is installed —
  flag only if one has been added.)
- Links are `<a>`/`<Link>`, not `onClick` handlers.
- **Destructive or irreversible actions require explicit confirmation in the UI** (also a house
  rule in CLAUDE.md).

## Touch & interaction

- `touch-action: manipulation` on tappable controls to kill the 300ms delay.
- Intentional `-webkit-tap-highlight-color`.
- `overscroll-behavior: contain` inside dialogs/scrollable modals so the page behind doesn't scroll.
- Disable text selection during drag interactions.
- Use `autofocus` sparingly and only when it genuinely helps.

## Layout & safe areas

- Full-bleed / edge-to-edge layouts respect `env(safe-area-inset-*)` on notched devices.
- Avoid unwanted scrollbars.
- Reach for `Stack`/`Grid`/`Box` over measuring in JS (copy the patterns from `Storybook.tsx`).

## Dark mode & theming

- MUI's `colorSchemes` handle most of this — verify both light and dark with the Storybook toggle.
- `color-scheme` set so native form controls match the theme; `<meta name="theme-color">` matches
  the background.

## Locale & i18n

- Format dates with `Intl.DateTimeFormat` and numbers with `Intl.NumberFormat` — never hardcode a
  format. Important wherever dates and figures carry weight.
- Wrap non-translatable identifiers (codes, IDs) with `translate="no"`.

## Copy — house voice

Reinforces `frontend-design`'s writing section; these two overrides diverge from the upstream
Vercel rules on purpose:

- **Sentence case**, not Title Case — matches the mui-ds hard rule (never uppercase unless the
  user explicitly asks). This overrides the upstream "Title Case headings/buttons."
- **Spell out "and"** — don't substitute `&`. Plain and unambiguous beats stylized.
- Active voice; a control names exactly what it does ("Save draft", then a "Draft saved" toast).
- Numerals for counts; specific button labels (not "Submit"/"OK").
- Error messages state what went wrong **and how to fix it**, in the interface's voice.
- Second person ("your account"), conversational but plain.

---

## Anti-patterns — flag these on sight

- Zoom-disabling `<meta viewport>` (`user-scalable=no` / `maximum-scale=1`).
- `@paste.prevent` / blocking paste.
- `transition: all`.
- Removing `outline` with no focus replacement.
- `onClick` navigation on a `<div>`/`<Box>` with no button/link role + keyboard.
- Images with no dimensions.
- Rendering large arrays unvirtualized.
- Unlabeled form inputs or icon-only buttons.
- Hardcoded date/number formats.
- Unjustified `autofocus`.

## Intentionally omitted from the upstream list

- **Hydration-safety rules** (controlled-input `onChange`, SSR date guards, `suppressHydration
  Warning`) — this is a client-only **React** SPA with no server rendering; they don't apply.
- **React/Next & Tailwind specifics** (`<Link>`, `nuqs`, `virtua`, `focus-visible:ring-*` class
  syntax) — translated above to the React/MUI equivalents.
