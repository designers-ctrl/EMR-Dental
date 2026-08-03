---
title: Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, react-lazy, suspense
---

## Dynamic Imports for Heavy Components

Lazy-load large components that aren't needed on initial render. This project is a Vite SPA
with no SSR, so the tool is React's own `lazy()` + `<Suspense>` — **not** `next/dynamic`, which
does not exist here.

`import()` is what actually splits the chunk; `lazy()` is just the React wrapper around it.
Vite emits a separate chunk per dynamic import automatically — no config needed.

**Incorrect (three.js + the GLB bundle into the main chunk):**

```tsx
import { ToothModel } from './ToothModel.tsx'

function ChartPanel() {
  return <ToothModel toothId={toothId} />
}
```

**Correct (the 3D stack loads only when the odontogram renders):**

```tsx
import { lazy, Suspense } from 'react'
import Skeleton from '@mui/material/Skeleton'

const ToothModel = lazy(() => import('./ToothModel.tsx').then(m => ({ default: m.ToothModel })))

function ChartPanel() {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
      <ToothModel toothId={toothId} />
    </Suspense>
  )
}
```

The `.then(m => ({ default: m.X }))` step is only needed for named exports — a module with a
default export can be passed to `lazy()` directly.

**Give every boundary a real fallback.** A `<Suspense>` with `fallback={null}` collapses the
layout while the chunk loads and shifts it back on arrival. Reserve the space with a `<Skeleton>`
sized to the component.

Best candidates in this codebase: the three.js / `@react-three/fiber` tooth renderer and its GLB,
`@mui/x-charts` on screens that only sometimes show a chart, and `@mui/x-data-grid`. Each pulls in
a large dependency tree that most first paints don't need.

> Adapted from the Vercel original, which prescribed `next/dynamic`.
