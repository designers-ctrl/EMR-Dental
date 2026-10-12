# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

> **EMR Dental** — a dental electronic medical record UI: patient charting, odontogram, treatment
> plans, scheduling and billing surfaces.
>
> Domain: clinical / healthcare records.

**Frontend-only.** This codebase owns the UI layer. There is no backend, no auth, and no database —
screens render from typed synthetic datasets, so a real backend drops in by producing the same
shapes.

### Domain rules

This is a clinical product. On top of the general rules, that means:

- **Never fabricate clinical data that looks authoritative.** Tooth notation, probing depths,
  medication names, dosages, diagnoses and billing figures are placeholders — keep them *clearly*
  synthetic and flag anything that would need a clinician to sign off.
- **Tooth numbering is a correctness surface.** Universal vs FDI vs Palmer notation are not
  interchangeable. Don't renumber, reorder or invent teeth to make a layout work.
- **Unambiguous states are a safety requirement.** Allergy flags, overdue recalls and treatment
  status must never rely on colour alone — pair with an icon or text.
- **No destructive or irreversible actions without explicit confirmation** in the UI.
- Clarity and accessibility are requirements, not polish: legible type, sufficient contrast,
  accessible labels on every interactive element.

## ⛔ One mandatory skill

**Any UI change — a screen, component, layout, colour, spacing, or style — requires loading
`/mui-ds` first.** Every time, not just the first. It is the authority on the design system, the
component-selection order, and the tokens-not-hex rule. If a request involves UI and you haven't
loaded it, stop and load it.

**Any chart goes through `@mui/x-charts`** — never a second charting library (D3, Chart.js,
Recharts, ECharts). Adding one is the failure this rule exists to prevent, so it's stated here
rather than only in the skill. The series palette, the fixed-slot-order rule, the three-series
scatter cap, and the reason status colours are never series colours all live in `/mui-ds` →
*Chart / data-viz selection logic*. The Storybook's **Data viz** section shows correct usage.

## Skills

`mui-ds` is the **one authority** on this project's design conventions; every other skill defers to
it. Skills auto-activate on their descriptions — this table is the tie-breaker.

| The task is… | Skill | Timing |
|---|---|---|
| Colours, spacing, radius, type, choosing/composing an MUI component | **mui-ds** | always, first (mandatory) |
| How a screen is *arranged* — composition, hierarchy, structure, UX copy | **frontend-design** | while designing |
| Auditing a finished screen — a11y, forms, focus, states, motion, copy | **web-design-guidelines** | after building |
| Retuning a chart palette (needs the colour validator) | **dataviz** | before editing chart hexes |
| Making a screen *faster* — re-renders, memoization, hooks, bundle size | **react-performance** | after building, when there's a real cost |

When several apply to one screen: **mui-ds** (styling, always) → **frontend-design** (arrange) →
build → **web-design-guidelines** (audit) → **react-performance** (only if it's actually slow).

- **Reviewer skills must never define a design language.** Any critique skill is a *reviewer only* —
  don't let one invent a competing palette or type scale. The DS already exists in `src/theme.ts`;
  point every review back at it.
- **`react-performance` owns speed, never looks.** It is Vercel's React perf guide, filtered to the
  52 rules that apply to a frontend-only Vite SPA — the 18 Next.js/RSC/SSR rules were stripped
  because this project has no server. It defers to **mui-ds** on every colour, spacing, radius,
  type and component decision; a perf fix that changes what a screen *looks like* is out of scope.
  Don't run it preemptively on new UI — build it right first, then pay down measured cost.

## Commands

All commands run from the **repo root** — the app lives at the root, not in a subfolder.

```bash
npm install
npm run dev            # product app — Vite dev server (default port 5173)
npm run dev:storybook  # standalone DS Storybook on port 3001
npm run dev:all        # both at once
npm run build          # tsc -b + vite build (product app only; Storybook has no build)
npm run preview        # serve dist/
npx tsc -p tsconfig.app.json --noEmit   # type-check only
npx oxlint                              # lint
```

- **There is no test suite.** Type-check + lint + a dev-server smoke check is the available
  verification. Don't claim tests passed.
- **Styling hot-reloads** — no Sass, no build-time style layer. See **mui-ds → Workflow** for the
  one exception (`@fontsource` weight imports).

## Architecture

Stack: **React 19 + Vite 8 + TypeScript, MUI 9** (Material UI) with Emotion. Icons:
**@mui/icons-material** (Outlined), referenced by semantic key through an `ICONS` record. Charts:
**@mui/x-charts**. Sortable/filterable tables: **@mui/x-data-grid**. Date/time entry:
**@mui/x-date-pickers** with the **dayjs** adapter — both community MIT tier only, Pro and Premium
need a paid licence key. 3D tooth models: **three + @react-three/fiber**. No path aliases — imports
are relative, with explicit `.ts`/`.tsx` extensions.

⚠️ **Every picker needs a `<LocalizationProvider dateAdapter={AdapterDayjs}>` ancestor** or it
throws at render. The Storybook wraps its whole tree in one; a product screen using a picker must
declare its own, since there is no shared shell.

**What this project deliberately does NOT have:** no router, no state library, no `src/api/` layer,
no mock server, no test runner. Don't assume any of them exist; if a task needs one, say so rather
than inventing the wiring.

### Boot chain

`src/main.tsx` → `@fontsource/inter` (weights **300/400/500/700**) → `<ThemeProvider theme={theme}
defaultMode="light">` → `<CssBaseline />` → `<App />`.

⚠️ **Inter replaces MUI's stock Roboto.** The family is *named* in `theme.ts`
(`typography.fontFamily`) but *loaded* in two entries — `main.tsx` and `storybook-main.tsx` — which
import the weight files independently. All three must move together or the browser silently falls
back to Helvetica. **300 is not optional**: MUI's stock `h1`/`h2` ask for it, and without the file
the browser synthesizes a thinner-looking fake. See **mui-ds → Type** for the full rule.

`src/App.tsx` holds **which of the two screens is up** — `PatientChart` (the default) or `Patients`
— as one `useState`, with no chrome above them; each screen brings its own rail and header. There is
still no router: screens change through callbacks (`onOpenPatients` from the chart's breadcrumb and
rail, `onOpenChart` from a row in the list), so the URL never changes and Back/reload land on the
chart. A third screen, or a need for links, is the point to add a real router rather than grow
that state.

⚠️ **`defaultMode` is not `defaultColorScheme`.** The theme's `defaultColorScheme: 'light'` picks
which scheme owns the `:root` CSS block; `defaultMode` is a **ThemeProvider prop** that decides what
actually renders and **defaults to `'system'`**. It is pinned to `'light'` in `main.tsx` because the
product app has no theme toggle. Removing it makes the app follow the OS.

### The Storybook is a separate app

`src/Storybook.tsx` is **not part of the product app**: its own entry (`storybook.html` →
`src/storybook-main.tsx`), its own Vite config, its own dev server on **port 3001**, and
deliberately **no build script**, so it can never ship in the product bundle. It owns its own
`ThemeProvider` because `useColorScheme` (the light/dark toggle) needs one — it renders the product
theme as-is, with nothing derived.

There is **no density toggle**, deliberately — MUI has no global density. See **mui-ds → The DS
preview is a curated subset** for why, and the Storybook's **Component sizes** section for the
per-component prop names.

### How screens are composed

There is **no shared shell wrapper**. Each screen is self-contained and declares its own chrome —
it mounts `<Rail>` itself. What two screens both need lives in **`src/components/`**: `Icon.tsx`
(the canonical `ICONS` record and `<Icon>`) and `Rail.tsx` (the app rail). Everything else is still
a **local function inside the screen that uses it** — `PatientChart.tsx` defines `PatientSidebar`,
`ChartPanel` and others, `Patients.tsx` defines `PatientList` and `DaySchedulePanel`, none exported
(the screen is each file's only export).

⚠️ **`Storybook.tsx` still declares its own `ICONS`**, with a different key set, pulled from the
`@mui/icons-material` barrel. `src/components/Icon.tsx` is the canonical one and deep-imports each
glyph, which is correct (see `react-performance` → `bundle-barrel-imports`). Fold the Storybook's
record into it when that file next changes.

Several files sit in `src/screens/` but are really reusable visuals or helpers, not screens:
`ArchGlyph.tsx`, `ToothArch.tsx`, `ToothStudio.tsx` and `toothScene.ts` — all reached through
`PatientChart`. They belong in a shared layer once one exists.

## Where to build new code

| Building… | Goes in | Notes |
|---|---|---|
| A **full screen / page** | `src/screens/` | One `.tsx` per screen; it declares its own chrome. Add it to the `Screen` state in `App.tsx`. |
| A **screen's dataset** | `src/data/<screen>.ts` | A typed contract + a synthetic data object. See the house rule below. |
| A **reusable component** | `src/components/` | Holds `Icon.tsx` and `Rail.tsx`. Move a piece here when a second screen needs it, not before. |
| A **chart** | inline in the screen | From `@mui/x-charts`; colours come from the theme. Add it to the Storybook's Data viz section. |
| **Storybook content** | `src/data/storybook.ts` | The Storybook view is a pure projection of this. |

## Reference map

- **`src/theme.ts`** — the design control panel, and by far the most important file here. Holds:
  - `colorSchemes.light` / `.dark` — two independent palettes. One `main` per channel; MUI derives
    `light`/`dark`/`contrastText`. The two schemes do **not** share hexes: the brand navy scores
    1.26:1 on the dark surface, so dark declares its own contrast-checked values.
  - `cssVariables: { colorSchemeSelector: 'data' }` — what makes a manual light/dark toggle
    possible at all. See **mui-ds → Colours** for the failure mode if it's changed.
  - `shape.borderRadius` (**8**) — the single radius token *and* the unit `sx` multiplies
    (`borderRadius: 1.5` → 12px). There is deliberately no separate radius scale.
  - `layout` — `railWidth` / `gutter` / `iconButton`; the only custom token group.
  - `chartSeriesColors` + `components.MuiChartsDataProvider` — the validated categorical palette.
  - A commented catalogue of **124 themeable components and 980 slots**, tiered by likelihood of
    editing; Tiers 1–2 carry real stock CSS, Tiers 3–7 list slot names.
- `src/Storybook.tsx` — the DS Storybook: a standalone app on port 3001, and **the reference for
  every component and chart here**. It previews only what the DS has adopted; it is not a catalogue
  of what MUI lacks, so a component's absence here says nothing either way.
- `src/data/storybook.ts` — everything the Storybook renders that isn't a live component: the edit
  map, the scale tables, the chart data.
- `src/data/patientChart.ts` — the main product dataset (rail, patient fields, all 32 teeth). Also
  owns the `IconName` type that `src/components/Icon.tsx` maps to glyphs.
- `src/data/patients.ts` — the Patients list dataset (rows, filters, the day schedule). A row opens
  the chart only when its `id` matches `patientChart.patient.id` (`hasChart`) — one synthetic record
  exists, and no other row may open it under another name.
- `src/data/toothModels.ts` — per-tooth measurements and the node names inside `teeth.glb`.
- **The odontogram is a single 3D arch.** `src/assets/teeth/teeth.glb` (32 separated meshes) is
  loaded by `src/screens/toothScene.ts` and rendered by `ToothArch.tsx` via @react-three/fiber —
  the orbitable dentition is now the *only* odontogram view. ⚠️ Its enamel material carries
  **hardcoded colours** that are *not* theme-driven and will not follow a palette change — a known
  open item. Two earlier views preceded it and have been removed: a 2D sprite odontogram, and the
  numbered grid of flat tooth rows (`ToothModel.tsx`), which drew these same meshes standing in
  columns.
- `tools/extract-teeth-3d.py` — regenerates `teeth.glb` from `teeth_skeleton_ligaments.blend` (334 MB,
  repo root, gitignore before committing). Deleting the blend makes the GLB unreproducible.
- `src/main.tsx` — boot, font loading, and the `defaultMode` pin described above.

## House rules

- Follow existing code style; keep code in TypeScript. Files carry substantial header comments
  explaining *why* — match that density when editing them.
- Use theme tokens and `sx` multipliers, never hardcoded hex/px.
- **Screens are dataset-driven.** Every screen renders from a typed dataset in `src/data/` (a
  contract + a synthetic data object) — no figures, labels, names, counts or copy hardcoded in the
  view. Import the dataset, bind the view to it, and seed mutable UI state from it. This keeps each
  screen a pure projection, so a real backend drops in by producing the same shape. Applies to
  *every* page as it's built.
- **Verify before claiming.** `tsc --noEmit` and `oxlint` are cheap; run them. When a claim depends
  on MUI's internals (a stock value, which components read a token, whether a prop exists), check
  `node_modules/@mui/material/**` rather than answering from memory — several conventions in
  `theme.ts` exist because the documented behaviour and the actual behaviour differed.
