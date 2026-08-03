import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-server config for the Storybook (DS preview) app ONLY.
 *
 * Kept separate from vite.config.ts so the product build never sees
 * storybook.html — there is deliberately no build script for this. Run it with
 * `npm run dev:storybook` (port 3001) or `npm run dev:all` to have it alongside
 * the product app on 5173.
 */
export default defineConfig({
  plugins: [react()],
  server: { port: 3001, open: '/storybook.html' },
})
