import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

// Inter replaces MUI's stock Roboto — these load it locally, no Google CDN
// call. The family is NAMED in theme.ts (typography.fontFamily); these imports
// are what actually ship the files, so the two must move together. The same
// four weights are imported in src/storybook-main.tsx for the preview app.
//
// 300 is here because MUI's stock h1/h2 ask for it. Without the file the
// browser synthesizes a light weight, which under Inter reads visibly thinner
// and looser than a real cut. Every weight the type scale references needs a
// file, or it gets faked.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'

import App from './App.tsx'
import { theme } from './theme.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      ThemeProvider hands theme.ts down to every MUI component below it.

      `defaultMode` is NOT the same as the theme's `defaultColorScheme`:
        defaultColorScheme — which scheme owns the :root CSS block
        defaultMode        — what actually renders at runtime

      It defaults to 'system', so once theme.ts gained a dark scheme the app
      started following the OS setting. Pinned to 'light' because the product
      app has no theme toggle. Change to 'system' to respect the OS instead.
    */}
    <ThemeProvider theme={theme} defaultMode="light">
      {/* CssBaseline is MUI's CSS reset — normalises browser defaults. */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
