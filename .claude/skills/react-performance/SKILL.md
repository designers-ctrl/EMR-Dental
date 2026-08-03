---
name: react-performance
description: >-
  React runtime-performance rules for this Vite SPA — re-renders, memoization, hooks discipline,
  code-splitting, bundle size, and JS hot paths. Use when a screen feels slow or janky, when
  profiling re-renders, when adding a heavy dependency (three.js, x-charts, x-data-grid), when
  reviewing hooks/effects, or when refactoring for performance. This owns HOW FAST code runs;
  it never decides how anything LOOKS — mui-ds is the sole authority on colour, spacing, radius,
  type and component choice, and this skill defers to it on every visual question.
license: MIT
metadata:
  author: vercel
  adaptedFor: EMR Dental (React 19 + Vite 8 + MUI 9, frontend-only)
  version: '1.0.0-emr'
---

# React Performance

Vercel Engineering's React performance rules, **filtered and adapted** for this codebase.
52 rules across 7 categories, ordered by impact.

## Scope — read this before applying anything

**This skill never overrides `mui-ds`.** If a rule and the design system disagree about a colour,
a spacing value, a radius, a type ramp, or which component to use, **mui-ds wins, every time.**
Performance is not a licence to hand-roll CSS, bypass `sx`, or hardcode a hex or px value.
Two specific places this matters:

- `js-batch-dom-css` and `rendering-animate-svg-wrapper` show direct `element.style` writes.
  That's for imperative animation loops and measurement code only — **never** as a substitute
  for `sx` or `styleOverrides` on a normal component.
- Any rule whose fix would change what a screen looks like is out of scope. Make it faster
  without making it different.

**This project is frontend-only.** No server, no SSR, no RSC, no API layer, no router, no state
library, no test runner. 18 rules from the Vercel original were removed because they prescribe
infrastructure this codebase deliberately does not have — see *What was removed* below. Don't
reintroduce them from memory: if a rule mentions `next/dynamic`, `'use server'`, `after()`,
`React.cache()`, or hydration, it does not apply here.

**No React Compiler.** [vite.config.ts](../../../vite.config.ts) runs plain `@vitejs/plugin-react`,
so nothing is auto-memoized. The `rerender-*` rules are live advice, not obsolete.
React is 19.2 — `<Activity>`, `useDeferredValue`, and `useEffectEvent` are all available.

## When to apply

- A screen feels slow, janky, or drops frames while typing/scrolling/dragging
- Profiling shows re-renders you can't explain
- Adding or splitting a heavy dependency (`three`, `@react-three/fiber`, `@mui/x-charts`, `@mui/x-data-grid`)
- Reviewing hooks, effects, and dependency arrays
- Refactoring a component that's grown expensive

Do **not** run this preemptively on new UI. Build it correctly first (mui-ds → frontend-design),
then reach for this when there's an actual cost to pay down.

## Rule categories by priority

| # | Category | Impact | Prefix | Rules |
|---|----------|--------|--------|-------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` | 4 |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` | 4 |
| 3 | Client-Side Browser APIs | MEDIUM-HIGH | `client-` | 3 |
| 4 | Re-render Optimization | MEDIUM | `rerender-` | 15 |
| 5 | Rendering Performance | MEDIUM | `rendering-` | 8 |
| 6 | JavaScript Performance | LOW-MEDIUM | `js-` | 14 |
| 7 | Advanced Patterns | LOW | `advanced-` | 4 |

## Quick reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` — Check cheap sync conditions before awaiting
- `async-defer-await` — Move await into the branch that actually uses it
- `async-parallel` — `Promise.all()` for independent operations
- `async-dependencies` — Partial dependencies without full serialization

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` — Deep-import MUI (`@mui/material/Button`), never the barrel
- `bundle-dynamic-imports` — `lazy()` + `<Suspense>` for the 3D stack, charts, data grid *(adapted for Vite)*
- `bundle-conditional` — Load a module only when its feature is activated
- `bundle-preload` — Preload on hover/focus to cut perceived latency

### 3. Client-Side Browser APIs (MEDIUM-HIGH)

- `client-event-listeners` — Deduplicate global listeners
- `client-passive-event-listeners` — Passive listeners for scroll/touch
- `client-localstorage-schema` — Version and minimize stored data

### 4. Re-render Optimization (MEDIUM) — the highest-value section here

- `rerender-no-inline-components` — Never define a component inside a component
- `rerender-derived-state-no-effect` — Derive during render, not in an effect
- `rerender-derived-state` — Subscribe to derived booleans, not raw values
- `rerender-defer-reads` — Don't subscribe to state only used in callbacks
- `rerender-dependencies` — Primitive dependencies in effects
- `rerender-memo` — Extract expensive work into a memoized child
- `rerender-memo-with-default-value` — Hoist default non-primitive props
- `rerender-simple-expression-in-memo` — Don't memo a primitive expression
- `rerender-functional-setstate` — Functional updates give stable callbacks
- `rerender-lazy-state-init` — Pass a function to `useState` for expensive initials
- `rerender-split-combined-hooks` — Split hooks with independent dependencies
- `rerender-move-effect-to-event` — Interaction logic belongs in the handler
- `rerender-transitions` — `startTransition` for non-urgent updates
- `rerender-use-deferred-value` — Keep inputs responsive during expensive renders
- `rerender-use-ref-transient-values` — Refs for high-frequency transient values

### 5. Rendering Performance (MEDIUM)

- `rendering-activity` — `<Activity>` to preserve state across show/hide
- `rendering-conditional-render` — Ternary, not `&&`
- `rendering-hoist-jsx` — Extract static JSX outside the component
- `rendering-content-visibility` — `content-visibility` for long lists
- `rendering-usetransition-loading` — `useTransition` over a loading boolean
- `rendering-resource-hints` — React DOM resource hints (`preload`, `preconnect`)
- `rendering-animate-svg-wrapper` — Animate the wrapper `div`, not the SVG *(see Scope)*
- `rendering-svg-precision` — Trim SVG coordinate precision

### 6. JavaScript Performance (LOW-MEDIUM)

Micro-optimizations for hot paths. On this app that means the 32-tooth odontogram loops,
chart data transforms, and the data grid — **not** ordinary render code. Applying these
broadly costs readability and buys nothing.

- `js-index-maps`, `js-set-map-lookups`, `js-early-exit`, `js-length-check-first`,
  `js-combine-iterations`, `js-flatmap-filter`, `js-min-max-loop`, `js-tosorted-immutable`,
  `js-hoist-regexp`, `js-cache-property-access`, `js-cache-function-results`, `js-cache-storage`,
  `js-batch-dom-css` *(see Scope)*, `js-request-idle-callback`

### 7. Advanced Patterns (LOW)

- `advanced-effect-event-deps` — Keep `useEffectEvent` results out of dep arrays
- `advanced-event-handler-refs` — Store handlers in refs
- `advanced-use-latest` — `useLatest` for stable callback refs
- `advanced-init-once` — Initialize once per app load

## How to use

Read the individual rule file for the full explanation and the incorrect/correct pair:

```
rules/rerender-derived-state-no-effect.md
rules/bundle-barrel-imports.md
```

Each contains a short rationale, a wrong example, a right example, and a reference link.
There is no compiled `AGENTS.md` here — the original's was dropped because it re-inlines the
18 removed rules.

## What was removed, and why

18 rules from the Vercel original are gone. All of them assume Next.js, a server, or SSR:

| Removed | Reason |
|---|---|
| All 10 `server-*` rules | No server, no RSC, no server actions |
| `async-api-routes` | No API routes |
| `async-suspense-boundaries` | Streaming SSR with async server components |
| `bundle-analyzable-paths` | Next build tracing |
| `bundle-defer-third-party` | No analytics or third-party scripts |
| `client-swr-dedup` | No data fetching; would pull in an uninstalled dependency |
| `rendering-hydration-no-flicker` | No SSR to hydrate |
| `rendering-hydration-suppress-warning` | No SSR to hydrate |
| `rendering-script-defer-async` | Vite handles module script loading |

`bundle-dynamic-imports` was kept but **rewritten** from `next/dynamic` to `lazy()` + `<Suspense>`.

## Provenance

Source: Vercel Engineering, *React Best Practices* v1.0.0 (January 2026), MIT.
Originally by [@shuding](https://x.com/shuding). Upstream also ships a React Native / Expo rule
set — it was **not** installed. It prescribes `StyleSheet.create`, Nativewind, `expo-image` and
FlashList, which directly contradict mui-ds, and there is no React Native in this project.
