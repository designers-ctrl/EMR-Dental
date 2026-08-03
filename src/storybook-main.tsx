/**
 * Entry point for the Storybook preview app — NOT the product app.
 *
 * Named `storybook-main` rather than `storybook` because macOS filesystems are
 * case-insensitive: `src/storybook.tsx` and `src/Storybook.tsx` would collide.
 *
 * Storybook.tsx owns its own ThemeProvider and CssBaseline (it needs
 * useColorScheme for the light/dark toggle), so neither is mounted here.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Mirrors the weights loaded in src/main.tsx — separate app, separate entry,
// so a font change has to touch both. 300 backs MUI's stock h1/h2.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'

import Storybook from './Storybook.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Storybook />
  </StrictMode>,
)
