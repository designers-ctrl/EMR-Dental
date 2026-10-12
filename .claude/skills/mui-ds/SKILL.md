---
name: mui-ds
description: >-
  THE styling/token authority for this app (React 19 + MUI 9) — colours, radius, spacing, type,
  and components. Use when building or restyling any UI: picking theme colours, applying
  spacing/radius, changing component defaults, or composing a card, header, list, dialog, chart,
  etc. The DS is the styling config (src/theme.ts) and applies to the WHOLE MUI library; the
  Storybook (src/Storybook.tsx) previews only a curated subset — when a needed component isn't
  there, pull it from the full MUI library and add it to the Storybook. This owns HOW things look;
  for how a screen is arranged (composition, hierarchy, copy) use frontend-design, and to audit a
  finished screen (accessibility, forms, states) use web-design-guidelines.
---

# MUI Design System

Stack: **React 19 + Vite + MUI 9 (Material UI)**, TypeScript, **npm**. Emotion is the style engine.
Icons: **@mui/icons-material**, Outlined style, referenced by SEMANTIC KEY through an `ICONS`
record — never imported straight into markup. App code lives at the repo root; run `npm run dev`.

**Adding or changing an icon:** add the key to the `ICONS` map in `src/components/Icon.tsx` (the
canonical one, shared by every screen) and to `IconName` in `src/data/patientChart.ts`, then use the
key from the dataset. The map
is the single source of truth — that's what makes an icon swap one edit instead of nineteen. Size
comes from `fontSize`, never `width`/`height`: the SVG renders at `1em` with `fill="currentColor"`,
so `color` and font-size cascade normally.

## What "the DS" actually is

The design system is the **styling configuration**, not a fixed list of components. Unlike the
Vuetify project this codebase descends from, there is **no build-time Sass layer** — MUI is
entirely runtime JS, so one file is the whole surface:

| Layer | Where in `src/theme.ts` | What it holds | Reloads how |
|---|---|---|---|
| **Colour schemes** | `colorSchemes.light` / `.dark` | Brand + status + neutral palettes, per scheme | **Hot-reload** |
| **Global tokens** | `shape`, `spacing`, `typography`, `transitions`, `breakpoints` | Radius unit, spacing base, type scale | **Hot-reload** |
| **Component defaults** | `components.<Mui*>.defaultProps` | Which variation is the default | **Hot-reload** |
| **Component looks** | `components.<Mui*>.styleOverrides` | What that variation *is* — padding, height, shadow | **Hot-reload** |
| **Chart series** | `chartSeriesColors` + `components.MuiChartsDataProvider` | Categorical palette for @mui/x-charts | **Hot-reload** |
| **App-shell metrics** | `layout` | `railWidth`, `gutter`, `iconButton` — our only custom group | **Hot-reload** |

`theme.ts` is the **design control panel**. It carries a commented catalogue of **124 themeable
components and 980 style slots**, tiered by how likely you are to edit them — Tier 1 (in use today)
and Tier 2 (forms & inputs) are written out with real stock CSS; Tiers 3–7 list slot names.

## The two kinds of knob — this distinction is load-bearing

- **`defaultProps` PICKS A VARIATION.** It only changes what a prop falls back to when you pass
  nothing — `text` vs `contained`, `small` vs `medium`. It does **not** define what "contained"
  looks like. Re-typing a stock value here is a genuine no-op. **Safe.**
- **`styleOverrides` DEFINES THE LOOK.** Raw CSS per slot. This is the counterpart to Vuetify's
  Sass variables. **Sharp**, for two reasons:
  1. **Most stock values are per-variant/per-size.** Button padding is a 3 × 3 matrix
     (text/outlined/contained × small/medium/large). Writing `padding` on `root` **flattens all
     nine**. Target the narrow slot (`contained`, `sizeSmall`) whenever the stock value varies.
  2. **Specificity.** It emits at a different specificity than MUI's own rule, so even a same-value
     paste can start winning over rules that used to apply.
- **`variants`** adds a brand-new named option; needs a `declare module` augmentation to be typed.

## The DS preview is a curated subset — not the limit

`src/Storybook.tsx` is a **living preview** ("kitchen sink") of the components adopted so far,
rendered with the real theme. It exists to *see* the styling, not to *bound* it — the **full MUI
library is available** in any screen. It is a **standalone dev-only app**: its own entry
(`storybook.html` → `src/storybook-main.tsx` → `vite.storybook.config.ts`), served on **port 3001**
by `npm run dev:storybook` (or `dev:all` alongside the product app). There is deliberately **no
build script**, so it can never ship in the product bundle.

Everything it renders that isn't a live component is a projection of **`src/data/storybook.ts`** —
add content there, not inline in the view.

Toggle **light/dark** at the top to check both schemes at once.

⚠️ **There is no density toggle, and MUI has no global density.** Not one core component takes a
`density` prop — sizing is per-component under four different prop names (`size`, `dense`,
`variant="dense"`, `margin="dense"`), and on `Grid` / `CircularProgress` / `Slider` the `size` prop
means something else entirely. The Storybook's **Component sizes** section is the full reference,
with the stock px read from MUI source. To make the whole app denser, set
`components.<Mui*>.defaultProps.size` in `theme.ts` — there is no provider that cascades it.

## Component selection logic (follow this every time you build a screen)

1. **Check the preview first.** Look in `Storybook.tsx` for a component and snippet that fits. If
   one does, copy it and tweak props — those are the composed, DS-correct patterns.
2. **If nothing fits, search the full MUI library** (https://mui.com/material-ui/all-components/).
   Pick the component whose semantics match.
3. **If you find one, do BOTH:** use it in the screen (it inherits DS styling automatically), and
   **add it to the preview** as a new `<Section>` so the preview reflects what the DS now covers.
4. **Never hand-roll** bespoke markup/CSS for something MUI already provides.
5. **Promote its catalogue entry.** If the component sits in Tier 3–7 of `theme.ts` (slot names
   only), that's fine — but note the slots you targeted.

## Chart / data-viz selection logic

Charts come from **@mui/x-charts** (installed, MIT). Never add a second charting library.

1. **Check the Storybook's Data viz section first** — BarChart · LineChart · area · PieChart ·
   ScatterChart · Gauge · SparkLineChart, all dataset-driven.
2. **Else extend one** — adjust props; colours still flow from the theme.
3. **Only then compose a custom chart** from the x-charts primitives (`ChartsXAxis`,
   `ChartsTooltip`, `ChartsLegend`…), and **add it to the Storybook**.

The series palette lives in `src/theme.ts` as `CHART_SERIES_LIGHT` / `CHART_SERIES_DARK`, exported
as `chartSeriesColors`. Rules that ride along with it:

- **It is NOT the UI palette.** Status colours carry meaning; spending `error` on "series 3" implies
  alarm the chart doesn't mean. Never reach for `palette.error` as a series colour.
- **Fixed order, never cycled.** A 7th series folds into "Other" or becomes small multiples.
- **Scatter/bubble cap at the first THREE slots** — every pair is adjacent on screen there, and past
  three the yellow/orange pair fails colour-separation.
- **Never a dual y-axis.** Two measures of different scale = two charts, or index to a common base.
- The hexes are **machine-validated** colourblind-safe against this app's own surfaces. If you
  retune them, **re-validate with the `dataviz` skill's checker** — no validator ships in this repo.

⚠️ **Charts cannot pick their own scheme.** x-charts resolves colours in JS from
`theme.palette.mode`, which `cssVariables` freezes at `defaultColorScheme`. A `colors: (mode) => …`
function therefore only ever receives `'light'`. Any surface that toggles schemes must read it and
pass the array:

```tsx
const { mode } = useColorScheme()
<BarChart colors={[...chartSeriesColors[mode === 'dark' ? 'dark' : 'light']]} … />
```

`ChartSection` in `Storybook.tsx` is the working example.

## State ownership: pick the component by which states it already has

- **Default states — free from the DS.** hover, focus, ripple, `disabled`, `loading`, and
  `selected` *on components that expose it*. Theme-styled; you write nothing.
- **Custom states — always app code.** Domain meaning (charted, flagged, in-plan) and bespoke
  interactions are never built in — `useState` + handler + your own `sx`.

| You want… | Use | Because |
|---|---|---|
| an interaction MUI ships (hover / ripple / focus / `disabled` / `selected`) | `ButtonBase`, `ListItemButton`, `Button`, `Chip`, `ToggleButton` | built-in and theme-styled — zero code |
| a **custom** interaction MUI has no concept of | **`Box`** + `sx` | a styled but *stateless* surface — no overlay/ripple to fight |

`Box` is the right base for custom precisely because it has **no** interaction states. The same
thing on `Paper` or `Card` means suppressing their behaviour first.

⚠️ **`Paper` has no `selected` state; `Box` has none at all** — "selected" always costs code.
`ListItemButton` and `ToggleButton` *do* have it; prefer them when the semantics fit.

**Going custom, you inherit the accessibility MUI would have given you.** `ButtonBase` provides the
focus ring and keyboard activation free; `Box` does not. Always pair `:hover` with `:focus-within`
(or `:focus-visible`), and reserve revealed elements with `opacity` — not `display` — so nothing
shifts.

## ⚠️ Defining a colour ≠ applying it

`palette.primary.main` only **names** what `primary` means. It does not make any component use it.
To brand one you must **assign** it — per instance (`color="primary"`) or, better, as a global
default (`components.MuiCheckbox.defaultProps.color = 'primary'`).

**The Storybook can mislead:** its examples sometimes set `color="primary"` inline, so a control
looks branded there but renders plain on a real screen that omits the prop. When something looks
branded in the Storybook, confirm it's set in `defaultProps` — not just on the example.

## Colours

Two independent schemes in `colorSchemes.light` / `.dark`. Channels: `primary`, `secondary`,
`error`, `warning`, `info`, `success`, plus `background.default/paper`, `text.primary/secondary/
disabled`, `divider`, and MUI-supplied `action.*`.

**ONE value per channel.** MUI derives `light`, `dark` and `contrastText` from `main` — so changing
a single hex moves the whole channel. Spelling out all four stops **pins** them and they stop
following `main`. Don't.

**The two schemes do NOT share hexes, and cannot.** The brand navy scores 1.26:1 on the dark
surface — invisible. Dark declares its own, contrast-checked values.

**Use a token — never a raw hex.**

```tsx
<Button color="primary">                       // semantic prop
sx={{ bgcolor: 'background.paper' }}           // theme path in sx
sx={{ color: 'text.secondary' }}
sx={{ borderColor: 'divider' }}
alpha(theme.palette.primary.main, 0.08)        // computed tint
```

⚠️ **`defaultColorScheme` ≠ `defaultMode`.** The former picks which scheme owns the `:root` CSS
block; the latter is a **ThemeProvider prop** that decides what actually renders and **defaults to
`'system'`**. `main.tsx` pins `defaultMode="light"`. Changing scheme at runtime is
`useColorScheme()`, which works because `colorSchemeSelector: 'data'` emits `[data-light]` /
`[data-dark]` — with the default `'media'` it would follow the OS and `setMode()` would silently do
nothing.

## Radius

**There is ONE radius token: `shape.borderRadius`** (currently **8**). It has two jobs:

1. The default for 14 components directly — Button, Paper, OutlinedInput, Tooltip, Accordion,
   ToggleButton, Skeleton… — and transitively for everything built on Paper (Card, Dialog, Menu,
   Alert).
2. **The unit `sx` multiplies.** A bare number on `borderRadius` in `sx` means n × that value,
   exactly as `p: 2` means 2 × spacing. **This is MUI's radius scale — do not invent a second one.**

```
sx={{ borderRadius: 1 }}     →   8px      sx={{ borderRadius: 3 }}    →  24px
sx={{ borderRadius: 1.5 }}   →  12px      sx={{ borderRadius: '50%' }} → passes through
sx={{ borderRadius: { xs: 1, md: 3 } }}   → responsive
```

⚠️ **The multiplier applies in `sx` ONLY.** Inside `styleOverrides` you're writing plain CSS, so
`borderRadius: 12` there means 12px, not 12 × 8.

⚠️ **Never set `shape.borderRadius` to a pill value.** CSS scales a radius down when it exceeds half
the box, so a large global value turns Paper/Dialog/Menu into stadiums. For a pill, override the
short component: `MuiButton.styleOverrides.root.borderRadius = 999`.

⚠️ **Some components ignore it entirely** — IconButton hardcodes `50%`, Avatar `50%`, Chip derives
`height / 2`. A global radius change leaves those untouched; override them by name.

A `radii` scale (`sm`/`md`/`lg`/`pill`) and a `stroke` scale used to exist here and were **removed
on purpose** — both duplicated capabilities MUI already had. Don't reintroduce them.

## Spacing

Base unit **8px** (`spacing`, currently stock). Every spacing prop is a multiplier.

```tsx
sx={{ p: 2 }}          // 16px          sx={{ px: 3, py: 1.5 }}
sx={{ mt: 4, mb: 2 }}                   <Stack spacing={2}>  <Grid spacing={2}>
sx={{ gap: 1.5 }}      // 12px          sx={{ p: { xs: 2, md: 3 } }}   // responsive
```

Layout uses `Stack`, `Grid` and `Box` with `sx` — copy the patterns from `Storybook.tsx` rather than
writing custom CSS. Page gutter is `theme.layout.gutter` (3 → 24px).

## Type

Font is **Inter**, loaded via `@fontsource/inter`. It replaced Roboto, which is no longer a
dependency.

⚠️ **The family is named in ONE place and loaded in TWO.** `typography.fontFamily` in `theme.ts`
names it; `src/main.tsx` and `src/storybook-main.tsx` import the actual weight files. Naming a
family the browser has no files for silently falls through the stack, so those three must move
together — and the imports are the one style change here that needs a **restart**, not a
hot-reload.

**Weights 300, 400, 500 and 700 are loaded** — every weight the stock scale references (300 backs
`h1`/`h2`). Using a weight outside that set gets a browser-synthesized fake; add the file instead.

The `typography` block in `theme.ts` is otherwise **entirely commented** — it carries exactly two
live overrides, `fontFamily` and `button: { textTransform: 'none' }` — so what renders is MUI's
stock scale: `h1…h6`, `subtitle1/2`, `body1/2`, `button`, `caption`, `overline` — 13 variants, all listed
with their stock px/weight in the file and in the Storybook's Typography section.

**Two rules for applying type:**

1. **Use the `variant` prop, not raw font-size.** `<Typography variant="h5">`. Set size in
   `theme.typography`, never inline.
2. **Component slots are already sized** — `ListItemText`, `Button`, `Chip`, `DialogTitle`,
   `AlertTitle`. Don't add a variant to them; add only `fontWeight` or a colour.

**Headings are responsive; nothing else is.** The theme export is wrapped in
`responsiveFontSizes()` — MUI's only built-in auto-responsive helper. It rewrites each variant above
1rem into a base size plus `@media (min-width:…)` steps at sm/md/lg, which in practice means **h1–h6
only**: body1, subtitle1, button, caption and overline are ≤1rem and are skipped. So a heading's
listed px is its size at ≥1200px, not everywhere.

⚠️ It throws on a **non-unitless `lineHeight`**. If you set `lineHeight: '1.5rem'` on a typography
variant, the theme stops building — use the unitless form.

## Restyling components

- **Global default** (every instance) → `components.<Mui*>.defaultProps` for a variation, or
  `.styleOverrides` for the look. `theme.ts` ships the full commented catalogue.
- **One instance** → `sx` on the element. Genuine one-offs only.
- **A new named option** → `variants` + a `declare module` augmentation.

**State parameters** (hover/selected/focus intensity) live in `palette.action.*` and tune every
component at once — `hoverOpacity`, `selectedOpacity`, `focusOpacity`, `disabledOpacity`. They are
currently stock neutral alpha; uncomment the block in `theme.ts` to brand them app-wide. App code
also reads the numbers directly: `alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)`.

**Selected is state-driven, never per-item colour.** Pass the boolean and let MUI stamp the class:

```tsx
<ListItemButton selected={item.id === current} onClick={…} />
```

## Workflow

1. Iterate look in **`Storybook.tsx`** (`npm run dev:storybook`, port 3001); toggle light/dark to
   check both schemes.
2. Change **colours / defaults / radius / type** in `src/theme.ts` — all hot-reload. There is no
   Sass and no build-time style layer. The **one** exception is adding a new `@fontsource` weight
   import (see "Type" above) — that touches Vite's dependency pre-bundle and may need a restart.
3. Build screens via the **selection logic** above; when you adopt a new MUI component, add it to
   the Storybook.
4. Verify with `npx tsc -p tsconfig.app.json --noEmit` and `npx oxlint`. **There is no test suite** —
   type-check + lint + a Storybook smoke check is the available verification. Don't claim tests passed.

## Don't

- Don't treat the Storybook as the limit — the whole MUI library is usable and styled by the DS.
- Don't adopt a new MUI component without adding it to the Storybook preview.
- Don't hardcode hex colours, px paddings, or px radii — use palette paths and `sx` multipliers.
- Don't write `padding` on a `root` slot when the stock value varies per variant/size — you'll
  flatten the whole matrix. Target the narrow slot.
- Don't pin `light`/`dark`/`contrastText` on a palette channel — state `main` only and let MUI derive.
- Don't reintroduce a `radii` or `stroke` token object; `sx` multipliers and plain numbers cover both.
- Don't set `shape.borderRadius` to a pill value — override the short component instead.
- Don't hand-roll markup/CSS when an MUI component + props will do.
- Don't build a custom interaction on a component that already ships it — reach for `Box` only when
  MUI has no such state.
- Don't hand-roll a custom state without keyboard parity — pair `:hover` with
  `:focus-within`/`:focus-visible`, and reserve revealed elements with opacity, not `display`.
- Don't use a status colour as a chart series colour, and don't exceed three series in a scatter.
- Don't add a second charting library.
- **Don't uppercase text unless the user explicitly asks.** Write labels, eyebrows, section headers,
  buttons and chips in sentence case. MUI's stock `button` variant uppercases, but `theme.ts`
  already overrides it to `textTransform: 'none'` — don't re-add it. **`overline` still uppercases**;
  override it the same way if you use it.
