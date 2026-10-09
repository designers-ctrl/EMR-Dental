import { createTheme, responsiveFontSizes } from '@mui/material/styles'
// Type-only side-effect import: teaches TypeScript about the 40 `MuiCharts*`
// keys @mui/x-charts adds to `components`. Emits nothing at runtime.
import type {} from '@mui/x-charts/themeAugmentation'

/**
 * ★ DESIGN CONTROL PANEL ★
 *
 * THE single place to change how the whole app looks. Everything here applies
 * globally, to every screen at once.
 *
 * ─── HOW TO READ THIS FILE ──────────────────────────────────────────────
 *
 *   ACTIVE (uncommented)  — live app-wide overrides. Right now: `palette`
 *                           `shape`, plus our own `layout` group.
 *                           Everything else is MUI stock.
 *   MENU (commented out)  — the catalog of knobs you CAN turn on, annotated
 *                           with MUI's real stock value. Inert until you
 *                           uncomment. Comments are stripped at build time,
 *                           so the catalog costs nothing in the bundle.
 *
 * ─── THE TWO KINDS OF KNOB ──────────────────────────────────────────────
 *
 * This distinction matters more in MUI than in Vuetify, because MUI splits
 * what Vuetify keeps in one place:
 *
 *   `defaultProps`    PICKS A VARIATION. Exactly Vuetify's `defaults`: it only
 *                     changes which built-in look applies when you pass no
 *                     prop — text vs contained, small vs medium. It does NOT
 *                     define what "contained" looks like. Re-typing a stock
 *                     value here is a genuine no-op. Safe.
 *
 *   `styleOverrides`  DEFINES THE LOOK. This is the counterpart to Vuetify's
 *                     Sass variables ($button-height, $card-padding…) — the
 *                     layer that sets actual dimensions, weights and shadows.
 *                     Two differences from Sass:
 *                       · There are no named tokens. MUI bakes values straight
 *                         into CSS rules, so there is no `$button-min-width`
 *                         to set — you restate the property on a slot.
 *                       · A slot is a PART of the component. `root` is the
 *                         whole element; `label`, `sizeSmall`, `contained` are
 *                         narrower targets.
 *
 *   `variants`        ADDS A NEW NAMED OPTION, like a Figma variant. Needs a
 *                     `declare module` augmentation to be type-safe.
 *
 * ⚠ TWO TRAPS WHEN UNCOMMENTING A `styleOverrides` LINE
 *
 *   1. MOST STOCK VALUES ARE NOT SINGLE VALUES. Button padding is a 3 × 3
 *      matrix of variant × size:
 *
 *                    small          medium         large
 *          text      4px 5px        6px 8px        8px 11px
 *          outlined  3px 9px        5px 15px       7px 21px
 *          contained 4px 10px       6px 16px       8px 22px
 *
 *      Writing `padding` on `root` FLATTENS all nine into one. Target the
 *      narrow slot (`contained`, `sizeSmall`) whenever the stock value varies.
 *
 *   2. SPECIFICITY. `styleOverrides` emits at a different specificity than
 *      MUI's internal rule, so even a same-value paste can start winning over
 *      rules that used to apply.
 *
 * ─── SCOPE ──────────────────────────────────────────────────────────────
 *
 * 124 themeable components, 980 slots, catalogued below in 7 tiers ordered by
 * how likely you are to edit them. Unlike Vuetify there is no second,
 * build-time Sass catalog — MUI is entirely runtime JS, so this one file is
 * the whole surface.
 *
 * Docs: https://mui.com/material-ui/customization/theming/
 */

// ═══════════════════════════════════════════════════════════════════════
// OUR OWN TOKENS  (the one addition, not an override)
// ═══════════════════════════════════════════════════════════════════════
// `layout` is the only custom group left, because MUI genuinely has no
// app-shell metrics and no `sx` shorthand that expresses them.
//
// Two scales that USED to live here were removed once it was clear MUI
// already had the same capability:
//
//   radius  — `sx` treats a bare number on `borderRadius` as a MULTIPLIER of
//             `shape.borderRadius`, exactly as `p: 2` means 2 × spacing.
//             See the `shape` block below for the conversion table.
//   stroke  — `sx` takes plain numbers as px on borders (`border: 1` is
//             `1px solid`), and the scale had two of three values identical
//             with one of them unused. Write 1 or 2 directly.

/** App-shell metrics. MUI has no equivalent group, so these are ours. */
interface LayoutTokens {
  /** Width of the fixed icon rail down the left edge. */
  railWidth: number
  /** Page padding, in spacing units (multiplied by theme.spacing). */
  gutter: number
  /** Square edge of a rail item / header icon button. */
  iconButton: number
}

const layout: LayoutTokens = {
  railWidth: 88,
  gutter: 3,
  iconButton: 48,
}

// ═══════════════════════════════════════════════════════════════════════
// CHART SERIES COLOURS
// ═══════════════════════════════════════════════════════════════════════
// A categorical palette answers a DIFFERENT question from the UI palette, so
// it is a separate list — do not reach for `palette.primary` here:
//
//   · The UI palette has one brand hue plus four STATUS channels. Status
//     colours carry meaning (error = something is wrong) and must never be
//     spent on "series 3", or a chart will imply alarm it does not mean.
//   · Series colours must be distinguishable from EACH OTHER; UI colours only
//     need to be distinguishable from the background.
//
// Both rows below were machine-validated against this app's own surfaces
// (#ffffff light paper, #1B1F24 dark paper) for lightness band, chroma floor,
// colour-vision-deficiency separation, normal-vision separation and contrast.
// ⚠ If you edit a hex, RE-VALIDATE — these are not eyeball choices.
//
// Two rules that come with the palette:
//   1. Assign slots in FIXED ORDER, never cycled. A 7th series folds into
//      "Other" or becomes small multiples — it never gets a generated hue.
//   2. Scatter/bubble (where every pair is adjacent on screen) is capped at
//      the FIRST THREE slots. Past three, the yellow/orange pair fails
//      separation. Bar/line/stacked forms may use all six.
const CHART_SERIES_LIGHT = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
]

// Not a filter over the light row — the same six hues re-stepped for a dark
// surface and validated as their own set.
const CHART_SERIES_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
]

/**
 * Exported because charts CANNOT pick their own scheme automatically here.
 *
 * x-charts resolves series colours in JS, reading `theme.palette.mode`
 * (ChartsDataProvider/useChartsDataProviderProps.js). Under `cssVariables`
 * that value is frozen at `defaultColorScheme` — the whole point of CSS
 * variables is that schemes swap in CSS, not in the JS theme object. So a
 * `colors: (mode) => …` function only ever receives 'light' here.
 *
 * Any surface that actually toggles schemes must read the scheme itself and
 * pass the array through the chart's `colors` prop:
 *
 *     const { mode } = useColorScheme()
 *     <BarChart colors={chartSeriesColors[mode === 'dark' ? 'dark' : 'light']} … />
 *
 * See ChartSection in Storybook.tsx for the working example. The product app
 * is pinned light (main.tsx `defaultMode`), so the theme default below is
 * correct for it as-is.
 */
export const chartSeriesColors = {
  light: CHART_SERIES_LIGHT,
  dark: CHART_SERIES_DARK,
} as const

// Registers our custom group on the theme so `theme.layout.railWidth` is
// typed and autocompletes everywhere.
declare module '@mui/material/styles' {
  interface Theme {
    layout: LayoutTokens
  }
  interface ThemeOptions {
    layout?: Partial<LayoutTokens>
  }

  /**
   * Opts the TYPES in to CSS theme variables. `cssVariables` above already
   * turns the feature on at runtime; without this augmentation MUI keeps
   * `theme.vars` and `theme.colorSchemes` off the Theme type, because a theme
   * built without the flag genuinely does not have them.
   *
   * What it unlocks: `theme.vars.palette.*` (the var() references) and
   * `theme.colorSchemes.<light|dark>.palette` — the resolved hexes of BOTH
   * schemes, including MUI's derived light/dark/contrastText stops. Reading
   * the inactive scheme is otherwise impossible, since `theme.palette.*` and
   * every sx token path resolve to the active one only. Storybook.tsx uses it
   * to draw light and dark side by side.
   */
  interface CssThemeVariables {
    enabled: true
  }
}

/**
 * The theme, with the heading ramp made responsive.
 *
 * `responsiveFontSizes` is MUI's ONLY built-in auto-responsive helper, and it
 * is a post-processor: it takes a finished theme and rewrites each typography
 * variant into a base size plus `@media (min-width:…)` steps at sm/md/lg. A
 * heading is otherwise one size at every width — fine on a workstation, a large
 * bite out of a phone screen otherwise.
 *
 * What it does NOT touch, and why this is a narrow change:
 *  - Only variants ABOVE 1rem are rewritten. The helper's default list names 13
 *    variants but it skips any whose fontSize is <= 1rem, so body1, subtitle1,
 *    button, caption and overline come through untouched — in practice this is
 *    h1–h6 only.
 *  - `factor: 2` (the default) sets how far they shrink: the small-screen size
 *    is 1rem + (max - 1rem) / 2, so our 4rem h1 goes 64px → 40px, never below
 *    1rem.
 *  - Nothing outside `typography`. The helper shallow-copies the theme, so the
 *    custom `layout` group, `vars`, `colorSchemes` and every component override
 *    survive by reference.
 *
 * ⚠ It throws on a non-unitless lineHeight. Every stock variant is unitless; if
 *   you ever set `lineHeight: '1.5rem'` in the typography block above, this
 *   call is what will fail.
 */
export const theme = responsiveFontSizes(createTheme({
  // Emits the palette as CSS custom properties, so swapping scheme is a CSS
  // selector change rather than a React re-render. `theme.palette.*` still
  // returns real hexes (sx callbacks reading it keep working); `theme.vars.*`
  // gives the var() reference.
  //
  // ⚠ colorSchemeSelector MATTERS. Passing `cssVariables: true` on its own
  //   defaults to 'media', which emits the dark scheme under
  //   @media (prefers-color-scheme: dark) — the OS decides and
  //   useColorScheme().setMode() silently does nothing. 'data' emits
  //   [data-light] / [data-dark] attribute selectors instead, which is what
  //   makes a manual toggle possible. Use 'media' only if you want OS-only.
  cssVariables: { colorSchemeSelector: 'data' },

  // ═════════════════════════════════════════════════════════════════════
  // ACTIVE — the brand palette, per colour scheme
  // ═════════════════════════════════════════════════════════════════════
  //
  // ONE value per channel. MUI derives `light`, `dark` and `contrastText`
  // from `main` (lighten 0.2 / darken 0.3 / auto-contrast at 3:1), so
  // changing a single hex moves that whole channel. Spelling out all four
  // stops would PIN them and they'd stop following `main`.
  //
  // ⚠ The two schemes do NOT share brand hexes, and they cannot. #002855
  //   scores 1.26:1 against the dark background — invisible. Every colour
  //   below was contrast-checked against its own scheme's paper.
  //
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#002855' },
        secondary: { main: '#9c27b0' },

        // These four `main` values are MUI's own stock light hexes — kept
        // explicit so the channels are visible here and ready to rebrand.
        error: { main: '#d32f2f' },
        warning: { main: '#ed6c02' },
        info: { main: '#0288d1' },
        success: { main: '#2e7d32' },

        background: {
          /** The page behind the cards. */
          default: '#EAECED',
          paper: '#ffffff',
        },
        text: {
          primary: '#3D4A5C',
          secondary: '#8B95A3',
          disabled: '#B4BCC6',
        },
        divider: '#E6E9ED',
      },
    },

    dark: {
      palette: {
        // The brand navy lightened until it carries on a dark surface:
        // 7.43:1 on background.default, 6.67:1 on paper. Same hue family as
        // #002855 so it still reads as the brand.
        primary: { main: '#7FA8D4' },
        secondary: { main: '#ce93d8' },

        // MUI's own stock DARK stops — a full step lighter than the light
        // scheme's, because the light hexes lose contrast here.
        error: { main: '#f44336' },
        warning: { main: '#ffa726' },
        info: { main: '#29b6f6' },
        success: { main: '#66bb6a' },

        background: {
          /** Deliberately not pure black — keeps elevation readable. */
          default: '#121417',
          paper: '#1B1F24',
        },
        text: {
          primary: '#E4E8ED',
          secondary: '#98A2B0',
          /** 2.80:1 by design — disabled text is meant to recede. */
          disabled: '#5C6570',
        },
        divider: '#2A2F36',
      },
    },
  },

  // Which scheme renders before anything toggles. 'system' would follow the
  // OS setting instead.
  //
  // ⚠ NOT the same as ThemeProvider's `defaultMode` prop, which is what
  //   actually renders at runtime and defaults to 'system'. See main.tsx.
  defaultColorScheme: 'light',

  // ═════════════════════════════════════════════════════════════════════
  // ACTIVE — chart defaults
  // ═════════════════════════════════════════════════════════════════════
  // The only live `components` entry. Everything else per-component is the
  // commented menu further down.
  //
  // Every x-charts chart type (Bar, Line, Pie, Scatter, Gauge, Radar…)
  // renders through MuiChartsDataProvider, so setting `colors` once here
  // covers all of them. Per-chart-type keys (MuiBarChart, MuiLineChart…)
  // also work and would override this.
  //
  // ⚠ `colors` also accepts a function of the colour scheme, and that is the
  //   documented MUI way — but it does NOT work under `cssVariables`. The
  //   function is handed `theme.palette.mode`, which CSS-variable mode freezes
  //   at `defaultColorScheme`, so it would always receive 'light'. Writing the
  //   light array directly is honest about that; anything that toggles schemes
  //   passes `colors` explicitly. See `chartSeriesColors` above.
  components: {
    // Scrollbars are hidden app-wide; scrolling itself is untouched — wheel,
    // trackpad, touch and keyboard all still move every overflow container.
    // Set on `*` because the scroll areas are many (rail list, side panel,
    // drawers, menus) and none should grow a bar of its own.
    // ⚠ A hidden bar no longer hints that a region scrolls; a region whose
    //   overflow is easy to miss needs its own cue (a fade, a clipped row).
    MuiCssBaseline: {
      styleOverrides: {
        '*': { scrollbarWidth: 'none' },
        '*::-webkit-scrollbar': { display: 'none' },
      },
    },
    MuiChartsDataProvider: {
      defaultProps: {
        colors: CHART_SERIES_LIGHT,
      },
    },
  },

  // ── MENU: interaction tints ──────────────────────────────────────────
  // Stock is neutral black-alpha in light, white-alpha in dark. Uncomment
  // inside a scheme's `palette` above to brand every hover/selected/focus
  // state app-wide. The *Opacity numbers are also read by app code via
  // alpha(colour, n).
  //
  // action: {
  //   active:             'rgba(0, 0, 0, 0.54)',
  //   hover:              'rgba(0, 0, 0, 0.04)',
  //   hoverOpacity:       0.04,
  //   selected:           'rgba(0, 0, 0, 0.08)',
  //   selectedOpacity:    0.08,
  //   disabled:           'rgba(0, 0, 0, 0.26)',
  //   disabledBackground: 'rgba(0, 0, 0, 0.12)',
  //   disabledOpacity:    0.38,
  //   focus:              'rgba(0, 0, 0, 0.12)',
  //   focusOpacity:       0.12,
  //   activatedOpacity:   0.12,
  // },

  // ── MENU: derivation tuning (applies to both schemes) ────────────────
  // tonalOffset governs EVERY derived light/dark above. Raise it and all six
  // channels spread wider. contrastThreshold decides when contrastText flips
  // white ↔ black.
  //
  // palette: {
  //   tonalOffset:       0.2,   // dark stop uses this × 1.5
  //   contrastThreshold: 3,
  //   common: { black: '#000', white: '#fff' },
  //   grey:   { /* 50…900, A100…A700 — Material's neutral ramp */ },
  // },

  // ─── ACTIVE: our one custom group ────────────────────────────────────
  layout,

  // ═════════════════════════════════════════════════════════════════════
  // MENU — global tokens (inert; stock values shown)
  // ═════════════════════════════════════════════════════════════════════

  // The spacing base unit. Everywhere you write p={2} or spacing={3}, MUI
  // multiplies by this. Change 8 → 4 and the whole app tightens.
  // spacing: 8,

  // ─── ACTIVE: THE radius. One number, and the unit for every other. ───
  //
  // MUI's single radius token (stock 4). Two jobs:
  //
  //   1. It is the default for 14 components directly — Button, Paper,
  //      OutlinedInput, Tooltip, Accordion, ToggleButton, Skeleton… — and
  //      transitively for everything built on Paper (Card, Dialog, Menu,
  //      Alert). Those render at 8px unless overridden.
  //
  //   2. It is the UNIT that `sx` multiplies. A bare number on
  //      `borderRadius` in `sx` means n × this value, exactly the way
  //      `p: 2` means 2 × spacing. THIS is MUI's radius scale — there is
  //      no need to invent a separate one.
  //
  //          sx={{ borderRadius: 1 }}    →   8px
  //          sx={{ borderRadius: 1.5 }}  →  12px
  //          sx={{ borderRadius: 2 }}    →  16px
  //          sx={{ borderRadius: 3 }}    →  24px
  //          sx={{ borderRadius: '50%' }} → passes through untouched
  //
  //      Breakpoint objects work too:
  //          sx={{ borderRadius: { xs: 1, md: 3 } }}
  //
  // ⚠ The multiplier applies in `sx` ONLY. Inside `styleOverrides` you are
  //   writing plain CSS, so `borderRadius: 12` there means 12px, not 12 × 8.
  //
  // ⚠ Never set this to a pill value. CSS scales a radius down when it
  //   exceeds half the box, so a large value turns Paper/Dialog/Menu into
  //   stadiums. For a pill, override the short component directly:
  //   MuiButton → styleOverrides.root.borderRadius = 999.
  shape: { borderRadius: 8 },

  // Durations feed every component transition (Button 250ms, IconButton
  // 150ms). Easings are the Material curves.
  // transitions: {
  //   duration: {
  //     shortest: 150, shorter: 200, short: 250, standard: 300,
  //     complex: 375, enteringScreen: 225, leavingScreen: 195,
  //   },
  //   easing: {
  //     easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  //     easeOut:   'cubic-bezier(0.0, 0, 0.2, 1)',
  //     easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
  //     sharp:     'cubic-bezier(0.4, 0, 0.6, 1)',
  //   },
  // },

  // breakpoints.values drives every `size={{ xs, sm, md }}` in the app.
  // breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },

  // 25 elevation shadows, index 0–24. Paper/Button read these by index.
  // shadows: [ 'none', '0px 2px 1px -1px rgba(0,0,0,0.2)…', /* …23 more */ ],

  // zIndex: {
  //   mobileStepper: 1000, fab: 1050, speedDial: 1050, appBar: 1100,
  //   drawer: 1200, modal: 1300, snackbar: 1400, tooltip: 1500,
  // },

  // The live typography overrides. Everything else in the block below stays
  // stock — MUI deep-merges per variant, so naming one property here keeps the
  // variant's other stock values (size, weight, line-height, tracking).
  //
  // fontFamily: naming a family here does not load it. The weights that back
  // this stack are imported in `src/main.tsx` AND `src/storybook-main.tsx` (two
  // entry points, two apps). 300/400/500/700 are loaded — every weight the
  // stock scale references, so nothing is browser-synthesized. Add a file
  // before using a weight outside that set.
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',

    // Stock h1 is 6rem (96px) — display size, built for a marketing hero, not
    // for a name sitting in a record header. 4rem holds the top of the type
    // ramp without swamping the card. The one call site (the patient name in
    // PatientChart) gets no inline fontSize: size belongs to the scale, so the
    // next h1 inherits this instead of re-deciding it.
    //
    // Only fontSize is named — MUI deep-merges per variant, so weight 300,
    // lineHeight 1.167 and the -0.01562em tracking stay stock. And
    // responsiveFontSizes() still steps this down below lg, so 4rem is the
    // size at ≥1200px, not at every width.
    h1: { fontSize: '4rem' },

    // Stock h2 is 3.75rem (60px) at weight 300 — a second display size, which
    // this app has no use for: its only h2 is the screen title sitting in a row
    // with the chart-mode buttons. 1.75rem (28px) puts it a step under h1
    // instead of competing with it, and 500 is the heaviest loaded Inter face
    // below bold, so it renders as a real face rather than a synthesized one.
    //
    // Set here rather than inline on the one call site, matching h1 above:
    // size belongs to the scale, so the next h2 inherits it. lineHeight 1.2 and
    // the -0.00833em tracking stay stock, and responsiveFontSizes() still steps
    // this down below lg — 1.75rem is the size at ≥1200px.
    h2: { fontSize: '1.75rem', fontWeight: 500 },

    // Stock `button` is textTransform: 'uppercase'. Turned off — uppercase is
    // slower to read (it strips word-shape cues), and screen readers can spell
    // out short all-caps strings letter by letter. Labels are written in
    // sentence case at the source instead.
    //
    // ⚠ This variant is NOT button-only. Button, Fab, Tab and ToggleButton all
    //   spread `theme.typography.button` and none re-set textTransform after,
    //   so this one line de-uppercases all four. That is the intent — they sit
    //   next to each other and a half-uppercased UI reads as a bug. The
    //   `overline` variant uppercases separately and is untouched.
    button: { textTransform: 'none' },
  },

  // typography: {
  //   fontFamily:   '"Roboto", "Helvetica", "Arial", sans-serif',  // MUI stock — overridden above
  //   fontSize:     14,   // base body size in px
  //   htmlFontSize: 16,   // must match your html{} font-size for rem maths
  //   fontWeightLight: 300, fontWeightRegular: 400,
  //   fontWeightMedium: 500, fontWeightBold: 700,
  //
  //   // Complete stock definitions. Override only the properties you name —
  //   // the rest are kept.
  //   h1:        { fontSize: '6rem',     fontWeight: 300, lineHeight: 1.167, letterSpacing: '-0.01562em' },
  //   h2:        { fontSize: '3.75rem',  fontWeight: 300, lineHeight: 1.2,   letterSpacing: '-0.00833em' },
  //   h3:        { fontSize: '3rem',     fontWeight: 400, lineHeight: 1.167, letterSpacing: '0em' },
  //   h4:        { fontSize: '2.125rem', fontWeight: 400, lineHeight: 1.235, letterSpacing: '0.00735em' },
  //   h5:        { fontSize: '1.5rem',   fontWeight: 400, lineHeight: 1.334, letterSpacing: '0em' },
  //   h6:        { fontSize: '1.25rem',  fontWeight: 500, lineHeight: 1.6,   letterSpacing: '0.0075em' },
  //   subtitle1: { fontSize: '1rem',     fontWeight: 400, lineHeight: 1.75,  letterSpacing: '0.00938em' },
  //   subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57,  letterSpacing: '0.00714em' },
  //   body1:     { fontSize: '1rem',     fontWeight: 400, lineHeight: 1.5,   letterSpacing: '0.00938em' },
  //   body2:     { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43,  letterSpacing: '0.01071em' },
  //   button:    { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.75,  letterSpacing: '0.02857em', textTransform: 'uppercase' },  // ← transform overridden to 'none' above
  //   caption:   { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.66,  letterSpacing: '0.03333em' },
  //   overline:  { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 2.66,  letterSpacing: '0.08333em', textTransform: 'uppercase' },
  // },

  // ═════════════════════════════════════════════════════════════════════
  // MENU — per-component, 124 components in 7 tiers
  // ═════════════════════════════════════════════════════════════════════
  //
  // TIER 1 is written out in full: real stock CSS per slot, the values you
  // would actually change. TIERS 2–7 list each component's slot names, so
  // you know the targets; open the component's source or the MUI docs for
  // its stock CSS when you promote one.
  //
  // components: {
  //
  //   // ────────────────────────────────────────────────────────────────
  //   // TIER 1 — IN USE TODAY  (15 components)
  //   // ────────────────────────────────────────────────────────────────
  //   // Every one of these is mounted somewhere in PatientChart or the
  //   // Storybook. Edits here are visible immediately.
  //   //
  //
  //   // Not a component — a hook for raw CSS on html/body/*, applied
  //   // wherever <CssBaseline /> is mounted. The place for font smoothing,
  //   // scrollbar styling, print rules.
  //   MuiCssBaseline: {
  //     styleOverrides: {
  //       // body: { WebkitFontSmoothing: 'antialiased' },
  //       // '@media print': { body: { background: '#fff' } },
  //     },
  //   },
  //
  //   MuiPaper: {
  //     defaultProps: {
  //       variant:   'elevation',   // 'elevation' | 'outlined'
  //       elevation: 1,             // 0–24; 0 removes the shadow entirely
  //       square:    false,         // true drops the border radius
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     backgroundColor: palette.background.paper
  //       //     color:           palette.text.primary
  //       //     transition:      box-shadow 300ms (standard)
  //       //     backgroundImage: elevation overlay — DARK MODE ONLY;
  //       //                      set 'none' to kill the lightening tint
  //       // rounded — borderRadius: shape.borderRadius   (4)
  //       // outlined — border: 1px solid palette.divider
  //       // elevation1…24 — boxShadow: shadows[n]
  //       //
  //       // root: { borderRadius: 24 },   // raw px — no multiplier here
  //     },
  //     // A brand-new named option. Requires:
  //     //   declare module '@mui/material/Paper' {
  //     //     interface PaperPropsVariantOverrides { stat: true }
  //     //   }
  //     // The stat cards used this before moving to inline sx.
  //     // variants: [
  //     //   {
  //     //     props: { variant: 'stat' },
  //     //     style: ({ theme }) => ({
  //     //       padding: theme.spacing(2.5),
  //     //       height: '100%',
  //     //       borderRadius: 12,
  //     //       border: `1px solid ${theme.palette.divider}`,
  //     //       backgroundColor: theme.palette.background.paper,
  //     //     }),
  //     //   },
  //     // ],
  //   },
  //
  //   MuiButton: {
  //     defaultProps: {
  //       variant:          'text',      // 'text' | 'outlined' | 'contained'
  //       size:             'medium',    // 'small' | 'medium' | 'large'
  //       color:            'primary',
  //       disableElevation: false,       // true flattens contained buttons
  //       disableRipple:    false,
  //       fullWidth:        false,
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     ...typography.button  (0.875rem / 500 / lh 1.75 / UPPERCASE)
  //       //     minWidth:     64
  //       //     padding:      '6px 16px'   ⚠ see the 3×3 matrix at the top
  //       //     border:       0
  //       //     borderRadius: shape.borderRadius   (4)
  //       //     transition:   background-color, box-shadow, border-color,
  //       //                   color @ 250ms (short)
  //       //     &.disabled    color: palette.action.disabled
  //       // contained — boxShadow shadows[2]; hover [4]; active [8];
  //       //             focusVisible [6]; disabled [0]
  //       // outlined  — border 1px solid currentColor @ 0.5 alpha,
  //       //             padding '5px 15px'
  //       // text      — padding '6px 8px'
  //       // sizeSmall / sizeLarge — fontSize 0.8125rem / 0.9375rem
  //       //
  //       // Buttons already inherit shape.borderRadius (8). Override only
  //       // to deviate — e.g. a pill:
  //       // root: { borderRadius: 999 },
  //     },
  //     // slots: root, text, outlined, contained, disableElevation,
  //     //   focusVisible, disabled, colorInherit, colorPrimary,
  //     //   colorSecondary, colorSuccess, colorError, colorInfo,
  //     //   colorWarning, sizeMedium, sizeSmall, sizeLarge, fullWidth,
  //     //   startIcon, endIcon, icon, loading, loadingWrapper,
  //     //   loadingIconPlaceholder, loadingIndicator, loadingPositionCenter,
  //     //   loadingPositionStart, loadingPositionEnd
  //   },
  //
  //   MuiIconButton: {
  //     defaultProps: {
  //       size:          'medium',   // 'small' | 'medium' | 'large'
  //       color:         'default',
  //       edge:          false,      // false | 'start' | 'end'
  //       disableRipple: false,
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     textAlign:    'center'
  //       //     flex:         '0 0 auto'
  //       //     fontSize:     1.5rem  (24px)
  //       //     padding:      8
  //       //     borderRadius: '50%'   ← overriding this to px is what turns
  //       //                             circular icon buttons into squares
  //       //     color:        palette.action.active
  //       //     transition:   background-color @ 150ms (shortest)
  //       //     hover bg:     action.active @ action.hoverOpacity
  //       // sizeSmall  — padding 5, fontSize 1.125rem (18px)
  //       // sizeLarge  — padding 12, fontSize 1.75rem (28px)
  //       // edgeStart / edgeEnd — negative margin to align to a container edge
  //       //
  //       // IconButton does NOT read shape.borderRadius — it hardcodes
  //       // '50%'. To square it off you must state a value here:
  //       // root: { borderRadius: 12 },
  //     },
  //     // slots: root, disabled, colorInherit, colorPrimary, colorSecondary,
  //     //   colorError, colorInfo, colorSuccess, colorWarning, edgeStart,
  //     //   edgeEnd, sizeSmall, sizeMedium, sizeLarge, loading,
  //     //   loadingIndicator, loadingWrapper
  //   },
  //
  //   // Every icon in the app renders through this (the ICONS map in
  //   // PatientChart). One place to resize or recolour them all.
  //   MuiSvgIcon: {
  //     defaultProps: {
  //       fontSize: 'medium',   // 'inherit' | 'small' | 'medium' | 'large'
  //       color:    'inherit',
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     userSelect:  'none'
  //       //     width:       '1em'
  //       //     height:      '1em'
  //       //     fill:        'currentColor'
  //       //     transition:  fill 200ms (shorter)
  //       // fontSizeSmall  — 1.25rem  (20px)
  //       // fontSizeMedium — 1.5rem   (24px)
  //       // fontSizeLarge  — 2.1875rem (35px)
  //     },
  //     // slots: root, colorPrimary, colorSecondary, colorAction, colorError,
  //     //   colorDisabled, fontSizeInherit, fontSizeSmall, fontSizeMedium,
  //     //   fontSizeLarge
  //   },
  //
  //   MuiTypography: {
  //     defaultProps: {
  //       variant:      'body1',
  //       align:        'inherit',   // 'inherit'|'left'|'center'|'right'|'justify'
  //       gutterBottom: false,       // true adds 0.35em bottom margin
  //       noWrap:       false,       // true → ellipsis overflow
  //       // Remap a variant to a different HTML tag:
  //       // variantMapping: { h1:'h1', h2:'h2', subtitle2:'h6', body2:'p' },
  //     },
  //     styleOverrides: {
  //       // root — stock: margin 0 (MUI resets all heading margins)
  //       // Per-variant type is set in `typography` above, NOT here. Use these
  //       // slots only for things typography can't express (colour, margin).
  //     },
  //     // slots: root, h1…h6, subtitle1, subtitle2, body1, body2, inherit,
  //     //   button, caption, overline, alignLeft, alignRight, alignCenter,
  //     //   alignJustify, noWrap, gutterBottom
  //   },
  //
  //   MuiChip: {
  //     defaultProps: {
  //       size:    'medium',    // 'small' | 'medium'
  //       variant: 'filled',    // 'filled' | 'outlined'
  //       color:   'default',
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     height:          32
  //       //     borderRadius:    16          (height / 2 — a pill)
  //       //     fontSize:        0.8125rem   (13px)
  //       //     lineHeight:      1.5
  //       //     color:           palette.text.primary
  //       //     backgroundColor: palette.action.selected
  //       //     maxWidth:        '100%', whiteSpace: 'nowrap'
  //       //     transition:      background-color, box-shadow
  //       // sizeSmall — height 24, fontSize 0.75rem (12px)
  //       // label     — padding '0 12px' (small: '0 8px'), truncates
  //       // avatar / icon / deleteIcon — the three inner element slots
  //       //
  //       // label: { fontWeight: 500 },
  //     },
  //     // slots: root, sizeSmall, sizeMedium, colorDefault, colorError,
  //     //   colorInfo, colorPrimary, colorSecondary, colorSuccess,
  //     //   colorWarning, disabled, clickable, deletable, outlined, filled,
  //     //   avatar, icon, label, deleteIcon, focusVisible
  //   },
  //
  //   MuiDivider: {
  //     defaultProps: {
  //       orientation: 'horizontal',   // 'horizontal' | 'vertical'
  //       variant:     'fullWidth',    // 'fullWidth' | 'inset' | 'middle'
  //       flexItem:    false,
  //       textAlign:   'center',       // 'center' | 'left' | 'right'
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     margin:            0
  //       //     borderStyle:       'solid'
  //       //     borderColor:       palette.divider
  //       //     borderBottomWidth: 'thin'   ← renders as 1px
  //       // inset  — marginLeft 72
  //       // middle — margin 16 horizontal (or 8 vertical when vertical)
  //     },
  //     // slots: root, absolute, fullWidth, inset, middle, flexItem, vertical,
  //     //   withChildren, textAlignRight, textAlignLeft, wrapper,
  //     //   wrapperVertical
  //   },
  //
  //   MuiTooltip: {
  //     defaultProps: {
  //       placement:    'bottom',
  //       arrow:        false,
  //       enterDelay:   100,
  //       leaveDelay:   0,
  //       followCursor: false,
  //     },
  //     styleOverrides: {
  //       // tooltip — stock:
  //       //     backgroundColor: grey[700] @ 0.92 alpha
  //       //     borderRadius:    shape.borderRadius   (4)
  //       //     padding:         '4px 8px'
  //       //     fontSize:        0.6875rem  (11px)
  //       //     fontWeight:      500
  //       //     maxWidth:        300
  //       // touch — padding '8px 16px', fontSize 0.875rem (14px)
  //       // arrow — 'currentColor', 1em × 0.71em
  //       //
  //       // Note this is the one tier-1 component whose surface colour does
  //       // NOT come from the palette — it is a hardcoded grey.
  //     },
  //     // slots: popper, popperInteractive, popperArrow, popperClose, tooltip,
  //     //   tooltipArrow, touch, tooltipPlacementLeft, tooltipPlacementRight,
  //     //   tooltipPlacementTop, tooltipPlacementBottom, arrow
  //   },
  //
  //   MuiAvatar: {
  //     defaultProps: {
  //       variant: 'circular',   // 'circular' | 'rounded' | 'square'
  //     },
  //     styleOverrides: {
  //       // root — stock:
  //       //     width:        40
  //       //     height:       40
  //       //     fontSize:     1.25rem  (20px)
  //       //     borderRadius: '50%'
  //       //     lineHeight:   1
  //       //     backgroundColor: palette.grey[400]  (the fallback tint)
  //       // rounded — borderRadius: shape.borderRadius
  //       // square  — borderRadius: 0
  //       // img     — width/height 100%, objectFit 'cover'
  //     },
  //     // slots: root, colorDefault, circular, rounded, square, img, fallback
  //   },
  //
  //   MuiContainer: {
  //     defaultProps: {
  //       maxWidth:       'lg',   // 'xs'|'sm'|'md'|'lg'|'xl'|false
  //       fixed:          false,
  //       disableGutters: false,
  //     },
  //     styleOverrides: {
  //       // root — stock: paddingLeft/Right 16, rising to 24 at the sm
  //       //        breakpoint. maxWidthLg caps at 1200px.
  //       // Set gutters from `layout.gutter` to keep page padding in one place.
  //     },
  //   },
  //
  //   MuiGrid: {
  //     defaultProps: {
  //       spacing:   0,
  //       container: false,
  //       direction: 'row',
  //       wrap:      'wrap',
  //     },
  //     // 88 slots — the largest in MUI, almost all generated
  //     // (grid-xs-1 … grid-xl-12, spacing-*, direction-*). You will very
  //     // rarely target one; set `spacing` per call site instead.
  //   },
  //
  //   MuiStack: {
  //     defaultProps: {
  //       spacing:    0,
  //       direction:  'column',
  //       useFlexGap: false,
  //     },
  //     // No style slots — layout only.
  //   },
  //
  //   MuiBox: {
  //     // No style slots and no variants — Box is a raw sx container.
  //     // defaultProps only, and rarely worth setting.
  //   },
  //
  //   MuiButtonBase: {
  //     defaultProps: {
  //       disableRipple:      false,
  //       disableTouchRipple: false,
  //       focusRipple:        false,
  //     },
  //     styleOverrides: {
  //       // root — stock: the unstyled button reset (no background, no border,
  //       //        margin 0, cursor pointer, outline 0, appearance none).
  //       //        The rail buttons in PatientChart build on this directly.
  //     },
  //     // slots: root, disabled, focusVisible
  //   },
  //
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 2 — FORMS & INPUTS  (26 components)
  // ──────────────────────────────────────────────────────────────────────
  // Nothing here is mounted yet. For an EMR this is the next surface to hit:
  // charting forms, patient search, consent toggles. Highest-value tier
  // after tier 1, so stock CSS is written out in full.
  //
  // ⚠ READ THIS FIRST — the input family is a COMPOSITION, not one component.
  //   A <TextField> is four themeable components stacked:
  //
  //       MuiTextField     ← wrapper only. NO styles of its own.
  //         MuiFormControl ← layout/margin
  //           MuiInputLabel  → MuiFormLabel   ← the floating label
  //           MuiOutlinedInput → MuiInputBase ← the box + the <input>
  //           MuiFormHelperText              ← the message below
  //
  //   Style the LEAF, not the wrapper. Setting padding on MuiTextField does
  //   nothing; you want MuiOutlinedInput. And a rule on MuiInputBase hits
  //   outlined, filled AND standard at once — usually what you want for
  //   font/colour, rarely for padding.
  //
  //   Same pattern elsewhere in this tier: MuiCheckbox and MuiRadio have
  //   almost no CSS — they are MuiSwitchBase (padding 9) wrapping an SVG
  //   icon, so size is set via `fontSize` on the icon, not width/height.
  //
  //   MuiTextField  (1 slot: root)
  //       Wrapper. No stock CSS at all — it only forwards props to the
  //       four components above. Use defaultProps here, styleOverrides never.
  //     defaultProps:
  //       variant:     'outlined'   // 'outlined' | 'filled' | 'standard'
  //       size:        'medium'     // 'small' | 'medium'
  //       margin:      'none'       // 'none' | 'dense' | 'normal'
  //       fullWidth:   false
  //       multiline:   false
  //       rows / minRows / maxRows: undefined
  //
  //   MuiInputBase  (15 slots)
  //       The shared base under all three input variants. Rules here apply
  //       to outlined + filled + standard.
  //     root — stock:
  //         fontSize:    1rem      (from typography.body1)
  //         lineHeight:  '1.4375em'  (23px)
  //         color:       palette.text.primary
  //         boxSizing:   'border-box'
  //         display:     'inline-flex', alignItems: 'center'
  //         &.disabled   color: palette.text.disabled, cursor: default
  //     input — stock (the native <input> itself):
  //         padding:     '4px 0 5px'
  //         height:      '1.4375em'
  //         border:      0
  //         boxSizing:   'content-box'
  //         background:  'none'
  //         &::placeholder  opacity 0.42 (light) / 0.5 (dark), colour
  //                         currentColor, transitions on focus @ 200ms
  //     sizeSmall — input paddingTop 1
  //     multiline — root padding '4px 0 5px', input padding 0
  //     slots: root, formControl, focused, disabled, adornedStart, adornedEnd,
  //       error, sizeSmall, multiline, colorSecondary, fullWidth, hiddenLabel,
  //       readOnly, input, inputTypeSearch
  //
  //   MuiOutlinedInput  (16 slots)
  //       The default variant. THE place to change field height and radius.
  //     root — stock:
  //         borderRadius: shape.borderRadius   (4)
  //         position:     'relative'
  //         hover  → notchedOutline borderColor: palette.text.primary
  //         focused → notchedOutline borderWidth 2, borderColor palette[color].main
  //         error  → notchedOutline borderColor: palette.error.main
  //     input — stock:
  //         padding: '16.5px 14px'      ← medium field height comes from here
  //       sizeSmall:   '8.5px 14px'
  //       multiline root: padding '16.5px 14px' (small '8.5px 14px'),
  //                 input padding 0
  //       adornedStart: paddingLeft 14 → 0 on the input
  //       adornedEnd:   paddingRight 14 → 0 on the input
  //     notchedOutline — stock:
  //         borderRadius: 'inherit'
  //         borderColor:  palette.divider-ish (rgba black 0.23 in light mode)
  //         The <legend> inside is what cuts the gap for the floating label.
  //     slots: root, formControl, focused, disabled, adornedStart, adornedEnd,
  //       error, sizeSmall, multiline, colorSecondary, fullWidth, hiddenLabel,
  //       readOnly, input, inputTypeSearch, notchedOutline
  //
  //   MuiFilledInput  (16 slots)
  //     root — stock:
  //         backgroundColor:      rgba(0,0,0,0.06)   light
  //                               rgba(255,255,255,0.09) dark
  //         hover:                rgba(0,0,0,0.09)
  //         disabled:             rgba(0,0,0,0.12)
  //         borderTopLeftRadius / borderTopRightRadius: shape.borderRadius
  //         (bottom corners stay square by design)
  //         transition: background-color @ 200ms easeOut
  //     underline — 1px solid bottom border, 2px palette[color].main on focus,
  //         dotted when disabled, palette.error.main on error
  //     slots: as InputBase, plus `underline`
  //
  //   MuiInput  (16 slots)
  //       The "standard" variant — no box, just a bottom rule.
  //     underline — stock:
  //         borderBottom: 1px solid rgba(0,0,0,0.42)
  //         hover:        2px solid palette.text.primary
  //         focus:        2px solid palette[color].main
  //         disabled:     borderBottomStyle 'dotted'
  //     slots: as InputBase, plus `underline`
  //
  //   MuiInputLabel  (13 slots)
  //       The floating label. Every value is a transform — changing field
  //       padding above WITHOUT adjusting these will misalign the label.
  //     root — stock:
  //         transformOrigin: 'top left'
  //         transition:      color, transform, max-width @ 200ms easeOut
  //     outlined:  rest  translate(14px, 16px) scale(1)
  //                small translate(14px,  9px) scale(1)
  //                shrunk translate(14px, -9px) scale(0.75)
  //     filled:    rest  translate(12px, 16px) scale(1)
  //                small translate(12px, 13px) scale(1)
  //                shrunk translate(12px,  7px) scale(0.75)
  //                (dense shrunk translate(12px, 4px) scale(0.75))
  //     standard:  rest  translate(0, 20px) scale(1)
  //                small translate(0, 17px) scale(1)
  //                shrunk translate(0, -1.5px) scale(0.75)
  //     slots: root, formControl, animated, shrink, disabled, error, focused,
  //       required, asterisk, filled, sizeSmall, standard, outlined
  //
  //   MuiFormLabel  (9 slots)
  //       Base under InputLabel; also labels Radio/Checkbox groups.
  //     root — stock:
  //         color:      palette.text.secondary
  //         fontSize:   1rem  (typography.body1)
  //         lineHeight: '1.4375em'
  //         padding:    0
  //         &.focused  color: palette[color].main
  //         &.disabled color: palette.text.disabled
  //         &.error    color: palette.error.main   ← every red label in the app
  //     slots: root, colorSecondary, focused, disabled, error, filled,
  //       required, asterisk, root
  //
  //   MuiFormHelperText  (8 slots)
  //       The validation / hint line under a field.
  //     root — stock:
  //         color:      palette.text.secondary
  //         fontSize:   0.75rem  (typography.caption)
  //         marginTop:  3   (marginRight/Bottom/Left: 0)
  //         &.disabled  color: palette.text.disabled
  //         &.error     color: palette.error.main
  //       contained — marginLeft 14, marginRight 14 (aligns under an
  //                   outlined/filled field's text, not its border)
  //       sizeSmall — marginTop 4
  //     slots: root, error, disabled, sizeSmall, contained, focused, filled,
  //       required
  //
  //   MuiFormControl  (4 slots)
  //       Layout wrapper — owns vertical rhythm between stacked fields.
  //     root — stock: padding 0, margin 0, border 0, display inline-flex,
  //                   flexDirection column, verticalAlign top
  //       marginNormal — marginTop 16, marginBottom 8
  //       marginDense  — marginTop  8, marginBottom 4
  //     defaultProps: variant 'outlined', size 'medium', margin 'none',
  //                   fullWidth false, required false
  //     slots: root, marginNormal, marginDense, fullWidth
  //
  //   MuiFormControlLabel  (10 slots)
  //       Pairs a checkbox/radio/switch with its text.
  //     root — stock:
  //         marginLeft:  -11   ← cancels the control's own padding 9 + 2
  //         marginRight:  16
  //         &.disabled   color: palette.text.disabled
  //       labelPlacementStart — marginLeft 16, marginRight -11
  //       asterisk.error      — color: palette.error.main
  //     defaultProps: labelPlacement 'end'  // 'end'|'start'|'top'|'bottom'
  //     slots: root, labelPlacementStart, labelPlacementTop,
  //       labelPlacementBottom, disabled, label, error, required, asterisk,
  //       focused
  //
  //   MuiFormGroup  (3 slots)
  //       No stock CSS beyond display flex / flexDirection column.
  //       `row` switches to a horizontal run.
  //     slots: root, row, error
  //
  //   MuiSelect  (11 slots)
  //       No CSS of its own — it renders an Input variant plus a Menu.
  //       To restyle the closed field, target MuiOutlinedInput. For the open
  //       list, MuiMenu / MuiMenuItem (tier 5).
  //     defaultProps: variant 'outlined', autoWidth false, displayEmpty false,
  //                   multiple false, native false
  //     select — stock: paddingRight 24 (32 when outlined) to clear the arrow;
  //              minWidth 16; cursor pointer; background none
  //     icon   — the dropdown chevron: position absolute, right 7,
  //              color palette.action.active, pointerEvents none
  //     slots: root, select, multiple, filled, outlined, standard, disabled,
  //       focused, icon, iconOpen, iconFilled, iconOutlined, iconStandard,
  //       nativeInput, error
  //
  //   MuiNativeSelect  (9 slots)
  //       The native <select> flavour. Same geometry as MuiSelect above.
  //     slots: root, select, multiple, filled, outlined, standard, disabled,
  //       icon, iconOpen, nativeInput, error
  //
  //   MuiCheckbox  (6 slots)
  //       Almost no CSS. It is MuiSwitchBase (padding 9) around an SVG icon.
  //       ⚠ To resize, set `fontSize` on the icon — width/height on root
  //         changes the hit area, not the glyph.
  //     root — stock:
  //         padding: 9   (from SwitchBase)
  //         color:   palette.text.secondary when unchecked,
  //                  palette[color].main when checked
  //         hover:   alpha(palette[color].main, action.hoverOpacity)
  //       sizeSmall  — icon fontSize 1.25rem (20px)
  //       sizeMedium — icon fontSize 1.5rem  (24px)
  //     defaultProps: color 'primary', size 'medium', disableRipple false
  //     slots: root, checked, disabled, indeterminate, colorPrimary,
  //       colorSecondary, sizeSmall, sizeMedium
  //
  //   MuiRadio  (6 slots)
  //       Same structure as Checkbox — SwitchBase padding 9 + SVG icon.
  //     defaultProps: color 'primary', size 'medium', disableRipple false
  //     slots: root, checked, disabled, colorPrimary, colorSecondary,
  //       sizeSmall, sizeMedium
  //
  //   MuiRadioGroup  (1 slot: root)
  //       Layout only, via FormGroup. `row` for a horizontal run.
  //
  //   MuiRadioButtonIcon  (3 slots)
  //       The internal dot-in-circle SVG. `checked` scales the inner dot;
  //       rarely worth touching.
  //
  //   MuiSwitch  (16 slots)
  //       Geometry is unusual — the root is mostly padding so the thumb's
  //       ripple has room. Track is 34 × 14; root is 58 × 38.
  //     root — stock:
  //         width:   58   (34 + 12 × 2)
  //         height:  38   (14 + 12 × 2)
  //         padding: 12
  //         overflow: 'hidden'
  //       edgeStart — marginLeft -8;  edgeEnd — marginRight -8
  //       sizeSmall — width 40, height 24, padding 7;
  //                   thumb 16 × 16; checked transform translateX(16px)
  //     switchBase — position absolute, top 0, left 0, padding 9,
  //         color common.white, checked transform translateX(20px),
  //         transition left/transform @ 150ms (shortest)
  //     thumb — width 20, height 20, borderRadius '50%',
  //         backgroundColor 'currentColor', boxShadow shadows[1]
  //     track — height 100%, width 100%, borderRadius 7  (14 / 2),
  //         backgroundColor common.black (light) / common.white (dark),
  //         opacity 0.38 unchecked → 0.5 checked, 0.12 disabled,
  //         transition opacity + background-color
  //     slots: root, edgeStart, edgeEnd, switchBase, colorPrimary,
  //       colorSecondary, sizeSmall, sizeMedium, checked, disabled, input,
  //       thumb, track
  //
  //   MuiSwitchBase  (no style slots — internal)
  //       Shared base for Checkbox, Radio and Switch. padding 9 lives here,
  //       which is why all three have the same 42px hit area.
  //
  //   MuiSlider  (27 slots)
  //       Not obviously an EMR control, but useful for pain / severity scales.
  //     root — stock:
  //         borderRadius: 12
  //         color:        palette.primary.main
  //         height:  4, padding '13px 0'  (horizontal)
  //         width:   4, padding '0 13px'  (vertical)
  //         sizeSmall — height 2 / width 2
  //         marks + label — marginRight 44 when a value label is shown
  //     rail  — borderRadius 'inherit', backgroundColor 'currentColor',
  //             opacity 0.38
  //     track — borderRadius 'inherit', backgroundColor 'currentColor',
  //             transition left/width/bottom/height
  //     thumb — width 20, height 20, borderRadius '50%',
  //             backgroundColor 'currentColor';
  //             hover/focus boxShadow a 0 0 0 8px colour ring
  //     slots: root, marked, vertical, disabled, dragging, rail, track,
  //       trackInverted, trackFalse, thumb, active, focusVisible, valueLabel,
  //       valueLabelOpen, valueLabelCircle, valueLabelLabel, mark,
  //       markActive, markLabel, markLabelActive, sizeSmall,
  //       thumbColorPrimary, thumbColorSecondary, thumbSizeSmall,
  //       colorPrimary, colorSecondary
  //
  //   MuiAutocomplete  (26 slots)
  //       Likely the patient-search control. Its own padding fights the
  //       underlying input's — the numbers below are the reconciliation.
  //     root — when combined with an outlined input:
  //         input padding '7.5px 4px 7.5px 5px'  (the field shrinks to fit
  //         chips/tags), inputRoot padding 9,
  //         paddingRight 26+4+9 with a clear button,
  //                      52+4+9 with clear + popup
  //       size small — input padding '2px 4px 3px 0'
  //     listbox — padding '8px 0', maxHeight '40vh', overflow auto
  //     option  — minHeight 48 (36 at sm+), padding '6px 16px',
  //               hover  action.hover, selected action.selected
  //     paper   — inherits MuiPaper; the dropdown surface
  //     tag     — a Chip; margin 3
  //     slots: root, fullWidth, focused, focusVisible, tag, tagSizeSmall,
  //       tagSizeMedium, hasPopupIcon, hasClearIcon, inputRoot, input,
  //       inputFocused, endAdornment, clearIndicator, popupIndicator,
  //       popupIndicatorOpen, popper, popperDisablePortal, paper, listbox,
  //       loading, noOptions, option, groupLabel, groupUl
  //
  //   MuiToggleButton  (12 slots)
  //       A good fit for tooth-surface / arch selectors — a real alternative
  //       to the hand-rolled ButtonBase rail in PatientChart.
  //     root — stock:
  //         borderRadius: shape.borderRadius   (4)
  //         padding:      11
  //         border:       1px solid palette.divider
  //         color:        palette.action.active
  //         selected:     color palette[color].main,
  //                       backgroundColor alpha(main, selectedOpacity)
  //         disabled:     color action.disabled,
  //                       border 1px solid action.disabledBackground
  //       sizeSmall — padding 7,  fontSize 0.8125rem (13px)
  //       sizeLarge — padding 15, fontSize 0.9375rem (15px)
  //     defaultProps: size 'medium', color 'standard', disableRipple false
  //     slots: root, disabled, selected, standard, primary, secondary,
  //       sizeSmall, sizeMedium, sizeLarge, fullWidth
  //
  //   MuiToggleButtonGroup  (10 slots)
  //     root — stock: borderRadius shape.borderRadius, display inline-flex
  //       grouped/middle/last — marginLeft -1 so borders collapse into one
  //         hairline instead of doubling; first/last keep the outer radius,
  //         middle buttons get radius 0.
  //     defaultProps: orientation 'horizontal', exclusive false,
  //                   size 'medium', fullWidth false
  //     slots: root, selected, vertical, disabled, grouped,
  //       groupedHorizontal, groupedVertical, fullWidth, firstButton,
  //       lastButton, middleButton
  //
  //   MuiRating  (18 slots)
  //       ⚠ The one component with a hardcoded brand colour: #faaf00, not a
  //         palette token. Rebranding the palette will NOT move it.
  //     root — stock:
  //         fontSize:  1.5rem  (24px)
  //         color:     '#faaf00'
  //         display:   'inline-flex'
  //       sizeSmall — 1.125rem (18px);  sizeLarge — 1.875rem (30px)
  //     iconEmpty    — color palette.action.disabled
  //     iconHover    — transform scale(1.2)
  //     iconActive   — transform scale(1.2)
  //     slots: root, sizeSmall, sizeMedium, sizeLarge, readOnly, disabled,
  //       focusVisible, visuallyHidden, pristine, label,
  //       labelEmptyValueActive, icon, iconEmpty, iconFilled, iconHover,
  //       iconFocus, iconActive, decimal
  //
  //   MuiInputAdornment  (10 slots)
  //       The icon or text tucked inside a field.
  //     root — stock:
  //         display:   'flex', alignItems 'center'
  //         maxHeight: '2em'
  //         color:     palette.action.active
  //       positionStart — marginRight 8
  //       positionEnd   — marginLeft  8
  //       filled + not hiddenLabel — marginTop 16 (clears the floating label)
  //     slots: root, filled, outlined, standard, positionStart, positionEnd,
  //       disablePointerEvents, hiddenLabel, sizeSmall
  //
  //   MuiNotchedOutlined  (no style slots — internal)
  //       The <fieldset>/<legend> pair that draws the outlined border and
  //       cuts the notch for the floating label. Reached through
  //       MuiOutlinedInput's `notchedOutline` slot, not directly.
  //
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 3 — TABLES & LISTS  (17 components)
  // ──────────────────────────────────────────────────────────────────────
  // Where an EMR lives: appointment grids, treatment history, medication
  // lists. Density (padding, row height, header weight) is the usual edit.
  //
  //   MuiTable  (2 slots)
  //       root, stickyHeader
  //   MuiTableHead  (1 slot)
  //       root
  //   MuiTableBody  (1 slot)
  //       root
  //   MuiTableRow  (5 slots)
  //       root, selected, hover, head, footer
  //   MuiTableCell  (13 slots)
  //       root, head, body, footer, sizeSmall, sizeMedium, paddingCheckbox,
  //       paddingNone, alignLeft, alignCenter, alignRight, alignJustify,
  //       stickyHeader
  //   MuiTableContainer  (1 slot)
  //       root
  //   MuiTableFooter  (1 slot)
  //       root
  //   MuiTablePagination  (11 slots)
  //       root, toolbar, spacer, selectLabel, selectRoot, select, selectIcon, input,
  //       menuItem, displayedRows, actions
  //   MuiTableSortLabel  (5 slots)
  //       root, active, icon, directionDesc, directionAsc
  //   MuiList  (4 slots)
  //       root, padding, dense, subheader
  //   MuiListItem  (7 slots)
  //       root, dense, alignItemsFlexStart, divider, gutters, padding,
  //       secondaryAction
  //   MuiListItemButton  (8 slots)
  //       root, focusVisible, dense, alignItemsFlexStart, disabled, divider, gutters,
  //       selected
  //   MuiListItemIcon  (2 slots)
  //       root, alignItemsFlexStart
  //   MuiListItemText  (6 slots)
  //       root, multiline, dense, inset, primary, secondary
  //   MuiListItemAvatar  (2 slots)
  //       root, alignItemsFlexStart
  //   MuiListItemSecondaryAction  (2 slots)
  //       root, disableGutters
  //   MuiListSubheader  (6 slots)
  //       root, colorPrimary, colorInherit, gutters, inset, sticky
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 4 — CARDS & GROUPING  (12 components)
  // ──────────────────────────────────────────────────────────────────────
  // Card is Paper plus padding conventions. If you adopt Card, mirror the
  // Paper decisions above or the two will drift.
  //
  //   MuiCard  (1 slot)
  //       root
  //   MuiCardHeader  (6 slots)
  //       root, avatar, action, content, title, subheader
  //   MuiCardContent  (1 slot)
  //       root
  //   MuiCardActions  (2 slots)
  //       root, spacing
  //   MuiCardActionArea  (3 slots)
  //       root, focusVisible, focusHighlight
  //   MuiCardMedia  (3 slots)
  //       root, media, img
  //   MuiBadge  (25 slots)
  //       root, badge, dot, standard, anchorOriginTopRight, anchorOriginBottomRight,
  //       anchorOriginTopLeft, anchorOriginBottomLeft, invisible, colorError,
  //       colorInfo, colorPrimary, colorSecondary, colorSuccess, colorWarning,
  //       overlapRectangular, overlapCircular, anchorOriginTopLeftCircular,
  //       anchorOriginTopLeftRectangular, anchorOriginTopRightCircular,
  //       anchorOriginTopRightRectangular, anchorOriginBottomLeftCircular,
  //       anchorOriginBottomLeftRectangular, anchorOriginBottomRightCircular,
  //       anchorOriginBottomRightRectangular
  //   MuiAccordion  (7 slots)
  //       root, heading, rounded, expanded, disabled, gutters, region
  //   MuiAccordionSummary  (7 slots)
  //       root, expanded, focusVisible, disabled, gutters, content,
  //       expandIconWrapper
  //   MuiAccordionDetails  (1 slot)
  //       root
  //   MuiAccordionActions  (2 slots)
  //       root, spacing
  //   MuiButtonGroup  (15 slots)
  //       root, contained, outlined, text, disableElevation, disabled, firstButton,
  //       fullWidth, horizontal, vertical, colorPrimary, colorSecondary, grouped,
  //       lastButton, middleButton
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 5 — OVERLAYS & FEEDBACK  (18 components)
  // ──────────────────────────────────────────────────────────────────────
  // Dialogs, menus and alerts. Alert is the first consumer of the
  // error/warning/info/success palette — see the derivation note at the top.
  //
  //   MuiDialog  (14 slots)
  //       root, backdrop, scrollPaper, scrollBody, container, paper, paperWidthFalse,
  //       paperWidthXs, paperWidthSm, paperWidthMd, paperWidthLg, paperWidthXl,
  //       paperFullWidth, paperFullScreen
  //   MuiDialogTitle  (1 slot)
  //       root
  //   MuiDialogContent  (2 slots)
  //       root, dividers
  //   MuiDialogContentText  (1 slot)
  //       root
  //   MuiDialogActions  (2 slots)
  //       root, spacing
  //   MuiModal  (3 slots)
  //       root, hidden, backdrop
  //   MuiBackdrop  (2 slots)
  //       root, invisible
  //   MuiPopover  (2 slots)
  //       root, paper
  //   MuiPopper  (1 slot)
  //       root
  //   MuiMenu  (3 slots)
  //       root, paper, list
  //   MuiMenuItem  (7 slots)
  //       root, focusVisible, dense, disabled, divider, gutters, selected
  //   MuiAlert  (11 slots)
  //       root, action, icon, message, filled, colorSuccess, colorInfo, colorWarning,
  //       colorError, outlined, standard
  //   MuiAlertTitle  (1 slot)
  //       root
  //   MuiSnackbar  (7 slots)
  //       root, anchorOriginTopCenter, anchorOriginBottomCenter,
  //       anchorOriginTopRight, anchorOriginBottomRight, anchorOriginTopLeft,
  //       anchorOriginBottomLeft
  //   MuiSnackbarContent  (3 slots)
  //       root, message, action
  //   MuiCircularProgress  (9 slots)
  //       root, determinate, indeterminate, colorPrimary, colorSecondary, svg, track,
  //       circle, circleDisableShrink
  //   MuiLinearProgress  (11 slots)
  //       root, colorPrimary, colorSecondary, determinate, indeterminate, buffer,
  //       query, dashed, bar, bar1, bar2
  //   MuiSkeleton  (10 slots)
  //       root, text, rectangular, rounded, circular, pulse, wave, withChildren,
  //       fitContent, heightAuto
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 6 — NAVIGATION  (26 components)
  // ──────────────────────────────────────────────────────────────────────
  // The app rail is hand-built from ButtonBase rather than Drawer/Tabs, so
  // most of this is unused. Relevant if the shell is ever rebuilt on MUI
  // primitives.
  //
  //   MuiAppBar  (15 slots)
  //       root, positionFixed, positionAbsolute, positionSticky, positionStatic,
  //       positionRelative, colorDefault, colorPrimary, colorSecondary, colorInherit,
  //       colorTransparent, colorError, colorInfo, colorSuccess, colorWarning
  //   MuiToolbar  (4 slots)
  //       root, gutters, regular, dense
  //   MuiTabs  (12 slots)
  //       root, vertical, list, centered, scroller, fixed, scrollableX, scrollableY,
  //       hideScrollbar, scrollButtons, scrollButtonsHideMobile, indicator
  //   MuiTab  (10 slots)
  //       root, labelIcon, textColorInherit, textColorPrimary, textColorSecondary,
  //       selected, disabled, fullWidth, wrapped, icon
  //   MuiTabScrollButton  (4 slots)
  //       root, vertical, horizontal, disabled
  //   MuiDrawer  (8 slots)
  //       root, docked, paper, anchorLeft, anchorRight, anchorTop, anchorBottom,
  //       modal
  //   MuiSwipeableDrawer  (no style slots — defaultProps only)
  //   MuiSwipeArea  (no style slots — defaultProps only)
  //   MuiLink  (6 slots)
  //       root, underlineNone, underlineHover, underlineAlways, button, focusVisible
  //   MuiBreadcrumbs  (4 slots)
  //       root, ol, li, separator
  //   MuiBreadcrumbCollapsed  (no style slots — defaultProps only)
  //   MuiPagination  (4 slots)
  //       root, ul, outlined, text
  //   MuiPaginationItem  (16 slots)
  //       root, page, sizeSmall, sizeLarge, text, outlined, rounded, ellipsis,
  //       firstLast, previousNext, focusVisible, disabled, selected, icon,
  //       colorPrimary, colorSecondary
  //   MuiStepper  (5 slots)
  //       root, horizontal, vertical, nonLinear, alternativeLabel
  //   MuiStep  (5 slots)
  //       root, horizontal, vertical, alternativeLabel, completed
  //   MuiStepLabel  (11 slots)
  //       root, horizontal, vertical, label, active, completed, error, disabled,
  //       iconContainer, alternativeLabel, labelContainer
  //   MuiStepIcon  (5 slots)
  //       root, active, completed, error, text
  //   MuiStepConnector  (8 slots)
  //       root, horizontal, vertical, alternativeLabel, active, completed, disabled,
  //       line
  //   MuiStepContent  (3 slots)
  //       root, last, transition
  //   MuiStepButton  (4 slots)
  //       root, horizontal, vertical, touchRipple
  //   MuiBottomNavigation  (1 slot)
  //       root
  //   MuiBottomNavigationAction  (4 slots)
  //       root, iconOnly, selected, label
  //   MuiSpeedDial  (8 slots)
  //       root, fab, directionUp, directionDown, directionLeft, directionRight,
  //       actions, actionsClosed
  //   MuiSpeedDialAction  (7 slots)
  //       fab, fabClosed, staticTooltip, staticTooltipClosed, staticTooltipLabel,
  //       tooltipPlacementLeft, tooltipPlacementRight
  //   MuiSpeedDialIcon  (6 slots)
  //       root, icon, iconOpen, iconWithOpenIconOpen, openIcon, openIconOpen
  //   MuiMobileStepper  (8 slots)
  //       root, positionBottom, positionTop, positionStatic, dots, dot, dotActive,
  //       progress
  //
  // ──────────────────────────────────────────────────────────────────────
  // TIER 7 — RARELY TOUCHED  (10 components)
  // ──────────────────────────────────────────────────────────────────────
  // Utilities, transitions, internals and one-off widgets. Listed so you know
  // they are themeable; promote one upward if it ever earns a house style.
  //
  //   MuiAvatarGroup, MuiCollapse, MuiFab, MuiIcon, MuiImageList,
  //   MuiImageListItem, MuiImageListItemBar, MuiScopedCssBaseline,
  //   MuiTablePaginationActions, MuiTouchRipple
  // },
}))
