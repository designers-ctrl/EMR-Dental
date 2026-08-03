/**
 * Typed contract + data for the Storybook (design-system preview) view.
 *
 * Everything the Storybook renders that ISN'T a live MUI component comes from
 * here — the edit map, the type/radius/spacing/size scale tables and the demo
 * rows. The view is a pure projection of this object.
 *
 * Values that mirror MUI internals (px sizes, weights) were read from
 * @mui/material 9.2.0 source, not guessed. If you bump MUI, re-check them.
 *
 * ⚠ NO COLOUR HEXES LIVE HERE. Palette channels, neutrals and the chart series
 * rows are all read live from src/theme.ts — this file carries only the labels
 * and usage notes that sit next to them. A second copy of the palette would
 * drift the first time someone rebrands a channel and only the swatch changed.
 */

// ─── EDIT MAP ────────────────────────────────────────────────────────────

export interface EditRow {
  /** What changing this affects, in the designer's words. */
  what: string
  /** Project-relative path to open. */
  file: string
  /** Which key to change, and whether it hot-reloads. */
  where: string
}

export interface EditGroup {
  group: string
  rows: EditRow[]
}

// ─── SCALE TABLES ────────────────────────────────────────────────────────

export interface TypeSpec {
  /** The MUI variant name, as passed to <Typography variant="…">. */
  variant:
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'subtitle1' | 'subtitle2'
    | 'body1' | 'body2'
    | 'button' | 'caption' | 'overline'
  px: number
  weight: number
  /** Set when the variant uppercases its text, so the table can flag it. */
  note?: string
}

export interface TypeGroup {
  family: string
  /** Specimen string — deliberately domain-neutral. */
  sample: string
  items: TypeSpec[]
}

export interface RadiusStep {
  /** What you type in sx. */
  multiplier: number | string
  px: string
  usage: string
}

export interface SpacingStep {
  multiplier: number
  px: number
  usage: string
}

// ─── COMPONENT SIZES ─────────────────────────────────────────────────────
//
// This table replaces the comfortable/compact toggle the Vuetify Storybook has.
// Vuetify's `density` is a real framework feature that cascades through
// <v-defaults-provider>; MUI has NO global density — zero core components take
// a `density` prop. Sizing is per-component, under four different prop names,
// and on three components `size` does not mean size at all. A toggle would have
// implied a system that isn't there, so the reality is documented instead.
//
// FIGURES: the `values` column is the COMPONENT's own size — height or box —
// never the size of the text inside it. That distinction matters: Button's
// font is 14px but the button is 36.5px tall, and only the second is useful
// when you are spacing a toolbar.
//
// MUI declares surprisingly few heights (Chip, Fab, Switch, Pagination and
// Avatar are the exceptions). The rest are DERIVED from the declared padding,
// line-height and border — all read from @mui/material 9.2.0 source, none
// guessed, and each such row says "computed" in its notes. Re-check on a
// version bump: a change to typography.button silently moves every Button and
// ToggleButton figure here.

/**
 * One accepted value of a size prop, paired with what it actually produces.
 *
 * The name alone ("small") is useless without the number, and the number alone
 * is useless without knowing what it measures — so the row carries a `measure`
 * label and every option carries its figure under that same measure.
 */
export interface SizeOption {
  /** The value you pass, e.g. 'small'. */
  name: string
  /** What it yields, in the unit named by the row's `measure`. */
  value: string
}

export interface SizeRow {
  /** Component name, as you'd type it in JSX. */
  component: string
  /** The prop that resizes it. They are NOT all called `size`. */
  prop: string
  /**
   * What the numbers in `values` measure — 'height', 'box (square)', 'row
   * height'. Without it a bare px is ambiguous: 40px is IconButton's whole box
   * but only TextField's shrunken height.
   *
   * Keep this a COMPONENT dimension. Font sizes and padding belong in `effect`;
   * a table of label sizes does not answer "how tall is this control".
   */
  measure: string
  /** Accepted values, in MUI's own order, each with its figure. */
  values: SizeOption[]
  /** What you get when you pass nothing. */
  fallback: string
  /** Caveats the numbers alone do not convey. */
  effect: string
}

export interface SizeGroup {
  group: string
  /** Why these rows belong together — the point of the grouping. */
  note: string
  rows: SizeRow[]
}

/** The six palette channels, spelled as MUI keys so the view can index a palette. */
export type PaletteChannelName = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

/**
 * Annotation only — NO hexes. Every colour the Storybook draws is read live
 * from theme.colorSchemes.<scheme>.palette, because a second copy here would
 * drift silently the first time someone rebrands a channel.
 */
export interface PaletteChannel {
  name: PaletteChannelName
  /** True when light/dark/contrastText are derived rather than pinned. */
  derived: boolean
  usage: string
}

/** Neutral token paths, as a union so the view's resolver can be exhaustive. */
export type NeutralTokenName =
  | 'background.default' | 'background.paper'
  | 'text.primary' | 'text.secondary' | 'text.disabled'
  | 'divider'

/** Annotation only — see PaletteChannel on why there are no hexes here. */
export interface NeutralToken {
  token: NeutralTokenName
  usage: string
}

/**
 * One colour scheme, as a labelled card. The Storybook renders both side by
 * side rather than only whichever one the toolbar is toggled to: the schemes
 * are independent sets of hexes, so a reader who only ever sees one has no way
 * to tell what the other does.
 */
export interface SchemeCard {
  scheme: 'light' | 'dark'
  label: string
  /** Why this scheme is the way it is — shown under the label. */
  note: string
}

// ─── DEMO CONTENT ────────────────────────────────────────────────────────

export type Severity = 'error' | 'warning' | 'info' | 'success'

export interface LabRow {
  id: string
  name: string
  value: string
  status: string
  severity: Severity
}

export interface NavItem {
  id: string
  label: string
  /** Key into the view's icon map. */
  icon: string
}

/**
 * Rows for the @mui/x-data-grid specimen. Longer than labRows on purpose —
 * sorting, filtering and pagination are only legible over enough rows.
 *
 * SYNTHETIC. Names, fees and clinical detail are placeholders for layout only;
 * none of it is a real ledger. `tooth` is UNIVERSAL notation (1–32) — the
 * column header says so, because Universal / FDI / Palmer are not
 * interchangeable and a bare number is ambiguous.
 */
export interface GridRow {
  id: number
  /** Universal notation, 1–32. Not FDI, not Palmer. */
  tooth: number
  procedure: string
  provider: string
  /** ISO date — the grid parses it into a Date for the `date` column type. */
  date: string
  /** Placeholder figure in GBP. Not a real fee schedule. */
  fee: number
  status: string
  severity: Severity
}

/**
 * Column config the view turns into GridColDef. Kept as data so widths and
 * headers are editable here, but `renderCell` (the status Chip) has to stay in
 * the view — a dataset cannot hold JSX.
 */
export interface GridColumn {
  field: keyof GridRow
  headerName: string
  width: number
  type?: 'number' | 'date' | 'string'
  align?: 'left' | 'right'
}

/**
 * Config for the @mui/x-date-pickers specimens.
 *
 * Dates are ISO strings, NOT dayjs objects. The date library is the adapter's
 * business, not the dataset's — keeping strings here means swapping
 * AdapterDayjs for AdapterDateFns touches the view and nothing else.
 *
 * SYNTHETIC. The booking window and closing days are placeholder practice
 * hours, not a real schedule.
 */
export interface PickerConfig {
  /** Seeds every uncontrolled specimen so they all open on the same month. */
  defaultDate: string
  /** ISO datetime — the time and date-time specimens read this. */
  defaultDateTime: string
  /** Bounds for the constrained specimen. */
  minDate: string
  maxDate: string
  /**
   * Weekday indices the practice is closed, 0 = Sunday. Rendered DISABLED
   * rather than hidden: a missing day looks like a rendering bug, a greyed one
   * reads as a rule.
   */
  closedWeekdays: number[]
  labels: {
    date: string
    time: string
    dateTime: string
    field: string
    calendar: string
    constrained: string
  }
  /** Helper text under the constrained specimen — states the rule in words. */
  constrainedHelper: string
}

// ─── CHARTS ──────────────────────────────────────────────────────────────

export interface ChartSeries {
  label: string
  data: number[]
}

export interface ScatterSeries {
  label: string
  data: { x: number; y: number; id: string }[]
}

export interface ChartsData {
  /** Shared x-axis for the time-series charts. */
  months: string[]
  /** Magnitude by category — the bar chart. */
  procedures: ChartSeries[]
  /** Change over time — the line and area charts. */
  recall: ChartSeries[]
  /** Composition of a whole — the pie. */
  treatmentMix: { id: number; value: number; label: string }[]
  /**
   * Correlation. Capped at THREE series on purpose: in a scatter every pair
   * is adjacent on screen, and past three slots the yellow/orange pair fails
   * colour-separation validation.
   */
  scatter: ScatterSeries[]
  /** A single headline figure — the gauge. */
  gauge: { value: number; label: string; caption: string }
  /** Inline trend, no axes. */
  spark: number[]
  /** Constraints that ride along with the palette. */
  rules: string[]
}

// ─── THE DATASET ─────────────────────────────────────────────────────────

export interface StorybookData {
  editMap: EditGroup[]
  typeScale: TypeGroup[]
  radiusScale: RadiusStep[]
  spacingScale: SpacingStep[]
  sizeTable: SizeGroup[]
  /** Both schemes, in the order every colour strip renders them. */
  schemeCards: SchemeCard[]
  /** Marker on whichever scheme the toolbar is currently rendering. */
  activeSchemeBadge: string
  paletteChannels: PaletteChannel[]
  neutrals: NeutralToken[]
  sampleIcons: string[]
  labRows: LabRow[]
  navItems: NavItem[]
  gridColumns: GridColumn[]
  gridRows: GridRow[]
  pickers: PickerConfig
  stepperSteps: string[]
  selectOptions: string[]
  charts: ChartsData
}

export const storybook: StorybookData = {
  editMap: [
    {
      group: 'Colour',
      rows: [
        {
          what: 'Brand colour — one hex drives light/dark/contrastText',
          file: 'src/theme.ts',
          where: 'colorSchemes.<light|dark>.palette.primary.main · hot-reload',
        },
        {
          what: 'Status colours (error / warning / info / success)',
          file: 'src/theme.ts',
          where: 'colorSchemes.<light|dark>.palette.<channel>.main · hot-reload',
        },
        {
          what: 'Page + card surfaces, text, divider',
          file: 'src/theme.ts',
          where: 'colorSchemes.<light|dark>.palette.background / text / divider · hot-reload',
        },
        {
          what: 'Dark scheme — a SEPARATE set of hexes, not a filter over light',
          file: 'src/theme.ts',
          where: 'colorSchemes.dark.palette · hot-reload',
        },
        {
          what: 'Which scheme renders first (light / dark / system)',
          file: 'src/theme.ts',
          where: 'defaultColorScheme · hot-reload',
        },
        {
          what: 'Hover / selected / focus tints (currently stock black-alpha)',
          file: 'src/theme.ts',
          where: 'palette.action — commented menu · hot-reload',
        },
        {
          what: 'Tooth enamel/material colours — NOT theme-driven',
          file: 'src/screens/toothScene.ts',
          where: 'the enamel material · hot-reload',
        },
      ],
    },
    {
      group: 'Shape & spacing',
      rows: [
        {
          what: 'THE radius — default for 14 components, and the sx multiplier unit',
          file: 'src/theme.ts',
          where: 'shape.borderRadius · hot-reload',
        },
        {
          what: 'Spacing base (8px) — drives every p={2} / spacing={3} / gap',
          file: 'src/theme.ts',
          where: 'spacing — commented menu · hot-reload',
        },
        {
          what: 'Border widths — no token; sx takes px numbers (border: 1)',
          file: 'at the call site',
          where: 'sx prop · hot-reload',
        },
        {
          what: 'App shell — rail width, page gutter, icon button size',
          file: 'src/theme.ts',
          where: 'layout · hot-reload',
        },
      ],
    },
    {
      group: 'Type',
      rows: [
        {
          what: 'Type scale — all 13 variants',
          file: 'src/theme.ts',
          where: 'typography — commented menu · hot-reload',
        },
        {
          what: 'Font FAMILY — Inter, a live typography override',
          file: 'src/theme.ts',
          where: 'typography.fontFamily · hot-reload — NAMES the font, does not load it',
        },
        {
          what: 'Button label case — uppercase is OFF',
          file: 'src/theme.ts',
          where: 'typography.button.textTransform · hot-reload — also drives Fab, Tab, ToggleButton',
        },
        {
          what: 'Font FILES — 300/400/500/700 loaded, covering the whole stock scale',
          file: 'src/main.tsx + src/storybook-main.tsx',
          where: '@fontsource imports · RESTART — a new family needs a new dep, in BOTH entries',
        },
        {
          what: 'Responsive heading ramp — ON, h1–h6 step up at sm/md/lg',
          file: 'src/theme.ts',
          where: 'responsiveFontSizes() wrapping the export · hot-reload — `factor` sets how far they shrink',
        },
      ],
    },
    {
      group: 'Components',
      rows: [
        {
          what: 'Which variation is the default (variant / size / colour)',
          file: 'src/theme.ts',
          where: 'components.<Mui*>.defaultProps · hot-reload',
        },
        {
          what: 'What that variation LOOKS like (padding, height, shadow)',
          file: 'src/theme.ts',
          where: 'components.<Mui*>.styleOverrides · hot-reload',
        },
        {
          what: 'Brand-new named options, e.g. a "stat" Paper',
          file: 'src/theme.ts',
          where: 'components.<Mui*>.variants + declare module · hot-reload',
        },
      ],
    },
    {
      group: 'Charts',
      rows: [
        {
          what: 'Series colours for EVERY chart type at once (Bar/Line/Pie/Scatter/Gauge)',
          file: 'src/theme.ts',
          where: 'components.MuiChartsDataProvider.defaultProps.colors · hot-reload',
        },
        {
          what: 'Series colours for ONE chart type only',
          file: 'src/theme.ts',
          where: 'components.MuiBarChart (or MuiLineChart…) .defaultProps.colors · hot-reload',
        },
        {
          what: 'Axes, grid, legend, tooltip styling — 40 MuiCharts* keys',
          file: 'src/theme.ts',
          where: 'components.MuiChartsAxis / MuiChartsGrid / MuiChartsLegend .styleOverrides · hot-reload',
        },
        {
          what: 'A one-off override for a single chart instance',
          file: 'at the call site',
          where: 'the chart’s own `colors` / `sx` prop · hot-reload',
        },
      ],
    },
    {
      group: 'Content',
      rows: [
        {
          what: 'Everything this Storybook renders that is not a live component',
          file: 'src/data/storybook.ts',
          where: 'the storybook object · hot-reload',
        },
        {
          what: 'Patient chart copy, counts, names, tooth data',
          file: 'src/data/patientChart.ts, src/data/toothModels.ts',
          where: 'hot-reload',
        },
      ],
    },
  ],

  // Stock MUI values — the typography block in theme.ts is currently all
  // commented, so what renders IS this table.
  typeScale: [
    {
      family: 'Headings',
      sample: 'Section overview',
      items: [
        { variant: 'h1', px: 96, weight: 300 },
        { variant: 'h2', px: 60, weight: 300 },
        { variant: 'h3', px: 48, weight: 400 },
        { variant: 'h4', px: 34, weight: 400 },
        { variant: 'h5', px: 24, weight: 400 },
        { variant: 'h6', px: 20, weight: 500 },
      ],
    },
    {
      family: 'Body & subtitles',
      sample: 'The quick brown fox jumps over the lazy dog',
      items: [
        { variant: 'subtitle1', px: 16, weight: 400 },
        { variant: 'subtitle2', px: 14, weight: 500 },
        { variant: 'body1', px: 16, weight: 400 },
        { variant: 'body2', px: 14, weight: 400 },
      ],
    },
    {
      family: 'Utility',
      sample: 'Supporting label',
      items: [
        { variant: 'button', px: 14, weight: 500, note: 'uppercase turned OFF in theme.ts — also drives Fab, Tab, ToggleButton' },
        { variant: 'caption', px: 12, weight: 400 },
        { variant: 'overline', px: 12, weight: 400, note: 'UPPERCASE by default' },
      ],
    },
  ],

  radiusScale: [
    { multiplier: 0.5, px: '4px', usage: 'Tight — inline tags, dense cells' },
    { multiplier: 1, px: '8px', usage: 'THE default. Every unstyled MUI component.' },
    { multiplier: 1.5, px: '12px', usage: 'Panels, stat cards, rail buttons' },
    { multiplier: 2, px: '16px', usage: 'Larger surfaces' },
    { multiplier: 3, px: '24px', usage: 'Feature cards, the chart panel' },
    { multiplier: "'50%'", px: 'circle', usage: 'Strings pass through — avatars, dots' },
    { multiplier: 999, px: 'pill', usage: 'Short elements ONLY — deforms large surfaces' },
  ],

  spacingScale: [
    { multiplier: 0.5, px: 4, usage: 'Icon-to-label gap' },
    { multiplier: 1, px: 8, usage: 'Tight stack' },
    { multiplier: 2, px: 16, usage: 'Default card padding' },
    { multiplier: 2.5, px: 20, usage: 'Stat card padding' },
    { multiplier: 3, px: 24, usage: 'Page gutter (layout.gutter)' },
    { multiplier: 4, px: 32, usage: 'Section separation' },
    { multiplier: 6, px: 48, usage: 'Major breaks' },
  ],

  sizeTable: [
    {
      group: 'size — the height / padding knob',
      note: 'Does what Vuetify density does, but one component at a time. There is no provider that cascades it; a global default is `components.<Mui*>.defaultProps.size` in `theme.ts`.',
      rows: [
        {
          component: 'Button',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'small', value: '30.75px' },
            { name: 'medium', value: '36.5px' },
            { name: 'large', value: '42.25px' },
          ],
          fallback: 'medium',
          effect:
            'Height is computed, not declared. Padding is a 3 × 3 matrix with variant — contained 4/10 · 6/16 · 8/22px, outlined 3/9 · 5/15 · 7/21px, text 4/5 · 6/8 · 8/11px — but outlined trades 1px of padding for its border, so all three variants land on the same height.',
        },
        {
          component: 'IconButton',
          prop: 'size',
          measure: 'box (square)',
          values: [
            { name: 'small', value: '28 × 28px' },
            { name: 'medium', value: '40 × 40px' },
            { name: 'large', value: '52 × 52px' },
          ],
          fallback: 'medium',
          effect: 'Padding 5 · 8 · 12px around an 18 · 24 · 28px icon. Radius stays 50% at every size — it ignores `shape.borderRadius`.',
        },
        {
          component: 'Chip',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'medium', value: '32px' },
            { name: 'small', value: '24px' },
          ],
          fallback: 'medium',
          effect: 'One of the few heights MUI declares outright. No large. Label font 13 · 12px; radius is height ÷ 2, so it stays a pill at both.',
        },
        {
          component: 'ToggleButton',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'small', value: '38.75px' },
            { name: 'medium', value: '48.5px' },
            { name: 'large', value: '58.25px' },
          ],
          fallback: 'medium',
          effect: 'Computed. Padding is uniform on all four sides (7 · 11 · 15px), unlike Button, and the 1px border adds 2px — so it runs taller than a Button at the same size.',
        },
        {
          component: 'Fab',
          prop: 'size',
          measure: 'box',
          values: [
            { name: 'small', value: '40 × 40px' },
            { name: 'medium', value: '48 × 48px' },
            { name: 'large', value: '56 × 56px' },
          ],
          fallback: 'large',
          effect: 'The one component here that does NOT fall back to medium.',
        },
        {
          component: 'TextField · OutlinedInput',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'medium', value: '56px' },
            { name: 'small', value: '40px' },
          ],
          fallback: 'medium',
          effect: 'Height comes from the input, not from `TextField`: a 23px line box plus 16.5 / 8.5px padding. Horizontal padding stays 14px either way.',
        },
        {
          component: 'Checkbox · Radio',
          prop: 'size',
          measure: 'box (square)',
          values: [
            { name: 'medium', value: '42 × 42px' },
            { name: 'small', value: '38 × 38px' },
          ],
          fallback: 'medium',
          effect: 'Only the glyph shrinks — 24 → 20px, forwarded to the icon as `fontSize`. The 9px hit-area padding is fixed, so the tap target barely moves.',
        },
        {
          component: 'Switch',
          prop: 'size',
          measure: 'box',
          values: [
            { name: 'medium', value: '58 × 38px' },
            { name: 'small', value: '40 × 24px' },
          ],
          fallback: 'medium',
          effect: 'Mostly ripple padding — the medium box is 34 + 12 × 2 wide by 14 + 12 × 2 tall. Thumb 20 → 16px.',
        },
        {
          component: 'Table',
          prop: 'size',
          measure: 'row height',
          values: [
            { name: 'medium', value: '53px' },
            { name: 'small', value: '33px' },
          ],
          fallback: 'medium',
          effect:
            'Computed: a 20px body2 line, 16 / 6px vertical cell padding, plus the 1px divider. Horizontal padding stays 16px. Cascades to every `TableCell` by context — set it on `Table`, not per cell.',
        },
        {
          component: 'Rating',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'small', value: '18px' },
            { name: 'medium', value: '24px' },
            { name: 'large', value: '30px' },
          ],
          fallback: 'medium',
          effect: 'Rating hardcodes #faaf00 — the one component whose brand colour is not a palette token.',
        },
        {
          component: 'Pagination',
          prop: 'size',
          measure: 'item box (square)',
          values: [
            { name: 'small', value: '26 × 26px' },
            { name: 'medium', value: '32 × 32px' },
            { name: 'large', value: '40 × 40px' },
          ],
          fallback: 'medium',
          effect: 'Forwarded to every PaginationItem. Label font is 14 · 14 · 15px — small and medium share one.',
        },
        {
          component: 'Autocomplete',
          prop: 'size',
          measure: 'height',
          values: [
            { name: 'small', value: '40px' },
            { name: 'medium', value: '56px' },
          ],
          fallback: 'medium',
          effect: 'Has no size of its own — it forwards the prop to the `TextField` it renders.',
        },
      ],
    },
    {
      group: 'size — but it means something else',
      note: 'Same prop name, unrelated meaning. Setting these expecting "smaller" is the most common way to break a layout.',
      rows: [
        {
          component: 'Grid',
          prop: 'size',
          measure: 'columns of 12',
          values: [
            { name: '1–12', value: 'n/12 of the row' },
            { name: '"auto"', value: 'content width' },
            { name: '"grow"', value: 'fills the remainder' },
          ],
          fallback: 'none',
          effect: 'COLUMN SPAN, not dimensions. `size={6}` is a half-width item. Also takes a responsive object.',
        },
        {
          component: 'CircularProgress',
          prop: 'size',
          measure: 'diameter',
          values: [
            { name: '40', value: '40px — the default' },
            { name: '24', value: '24px, inline with text' },
            { name: '"3rem"', value: 'any CSS length' },
          ],
          fallback: '40',
          effect: 'A literal diameter, number or string. `size="small"` is NOT valid — it would be read as a CSS length and ignored.',
        },
        {
          component: 'Slider',
          prop: 'size',
          measure: 'rail / thumb',
          values: [
            { name: 'small', value: '2 / 12px' },
            { name: 'medium', value: '4 / 20px' },
          ],
          fallback: 'medium',
          effect: 'Thickness only. Length is layout — set it with width in `sx`.',
        },
      ],
    },
    {
      group: 'Density under another prop name',
      note: 'Same intent, four different spellings. This scattering is exactly why MUI has no single toggle.',
      rows: [
        {
          component: 'List · ListItem · ListItemButton · MenuItem',
          prop: 'dense',
          measure: 'item padding-y',
          values: [
            { name: 'false', value: '8px' },
            { name: 'true', value: '4px' },
          ],
          fallback: 'false',
          effect: 'Set on `List` and it cascades to children by context.',
        },
        {
          component: 'Toolbar',
          prop: 'variant',
          measure: 'minHeight',
          values: [
            { name: 'regular', value: '56px xs · 64px sm+' },
            { name: 'dense', value: '48px, flat' },
          ],
          fallback: 'regular',
          effect: 'The only component whose density lives on `variant`. regular is the one responsive height here.',
        },
        {
          component: 'FormControl · TextField',
          prop: 'margin',
          measure: 'margin top / bottom',
          values: [
            { name: 'none', value: '0' },
            { name: 'dense', value: '8 / 4px' },
            { name: 'normal', value: '16 / 8px' },
          ],
          fallback: 'none',
          effect: 'Margin AROUND the field, not its height. Combine with `size` — they are independent.',
        },
        {
          component: 'DataGrid',
          prop: 'density',
          measure: 'row height',
          values: [
            { name: 'compact', value: '36px' },
            { name: 'standard', value: '52px' },
            { name: 'comfortable', value: '67px' },
          ],
          fallback: 'standard',
          effect:
            'The only real density prop in the stack, and the only place MUI names the same three levels Vuetify does. It is a FACTOR on rowHeight — Math.floor(52 × 0.7 / 1 / 1.3) — so a custom rowHeight scales with it.',
        },
      ],
    },
    {
      group: 'No size prop at all',
      note: 'The gap against Vuetify. These never shrink, so a "compact" MUI page is always less compact than a Vuetify one. Resize them with `sx`.',
      rows: [
        {
          component: 'Avatar',
          prop: '—',
          measure: 'box',
          values: [{ name: '—', value: '40 × 40px, fixed' }],
          fallback: '40 × 40px',
          effect: 'Resize with `sx={{ width: 32, height: 32 }}` — and set `fontSize` too, or the initials keep their size.',
        },
        {
          component: 'Paper · Card',
          prop: '—',
          measure: 'padding',
          values: [{ name: '—', value: 'none — you pass it' }],
          fallback: 'no padding',
          effect: '`elevation` changes shadow only, never dimensions.',
        },
        {
          component: 'Typography',
          prop: 'variant',
          measure: 'font-size',
          values: [
            { name: 'h1…h6', value: '96 → 20px' },
            { name: 'body1 · body2', value: '16 · 14px' },
            { name: 'caption', value: '12px' },
          ],
          fallback: 'body1',
          effect: 'Sized by the type scale, not by density — see the Typography section. Never scale it to fake a compact mode.',
        },
        {
          component: 'Dialog',
          prop: 'maxWidth',
          measure: 'max width',
          values: [
            { name: 'xs', value: '444px' },
            { name: 'sm', value: '600px' },
            { name: 'md', value: '900px' },
            { name: 'lg · xl', value: '1200 · 1536px' },
          ],
          fallback: 'sm',
          effect: 'Width only, read from breakpoints (xs is floored at 444px). Internal padding comes from `DialogContent` and does not follow it.',
        },
        {
          component: 'Alert · Accordion',
          prop: '—',
          measure: '—',
          values: [{ name: '—', value: 'fixed padding' }],
          fallback: '—',
          effect: 'Override via theme `styleOverrides` if a denser variant is genuinely needed.',
        },
      ],
    },
  ],

  schemeCards: [
    {
      scheme: 'light',
      label: 'Light scheme',
      note: 'What the product app ships — main.tsx pins defaultMode="light", so this is the only one a patient-facing screen renders today.',
    },
    {
      scheme: 'dark',
      label: 'Dark scheme',
      note: 'Its own contrast-checked hexes, not a filter over light. The brand navy scores 1.26:1 on the dark surface, so dark cannot reuse it.',
    },
  ],

  activeSchemeBadge: 'Rendering now',

  paletteChannels: [
    {
      name: 'primary',
      derived: true,
      usage: 'Brand. Rail active state, filled buttons, focus rings. Dark gets a lightened hex — same hue family, usable contrast.',
    },
    { name: 'secondary', derived: true, usage: 'Unused in the app today — stock MUI purple.' },
    { name: 'error', derived: true, usage: 'Failed fields, destructive actions, allergy flags. Always paired with an icon or text — never colour alone.' },
    { name: 'warning', derived: true, usage: 'Overdue recalls, items needing review.' },
    { name: 'info', derived: true, usage: 'Neutral notices.' },
    { name: 'success', derived: true, usage: 'Completed treatment, healthy values.' },
  ],

  neutrals: [
    { token: 'background.default', usage: 'The page behind the cards' },
    { token: 'background.paper', usage: 'Every card and panel surface' },
    { token: 'text.primary', usage: 'Body copy and headings' },
    { token: 'text.secondary', usage: 'Captions, inactive rail labels' },
    { token: 'text.disabled', usage: 'Disabled controls' },
    { token: 'divider', usage: 'Hairlines, card borders' },
  ],

  // Keys into the view's ICONS map — a representative slice of the app's
  // vocabulary, not the whole set. Full map: src/screens/PatientChart.tsx.
  sampleIcons: [
    'schedule', 'patients', 'treatmentPlans', 'billing', 'imaging', 'lab',
    'pharmacy', 'erx', 'notes', 'clinicalNotes', 'forms', 'charts',
    'recall', 'alerts', 'history', 'settings', 'help', 'message',
  ],

  labRows: [
    { id: 'r1', name: 'Periodontal probing depth', value: '5 mm · UR6', status: 'Watch', severity: 'warning' },
    { id: 'r2', name: 'Bitewing caries screen', value: 'No new lesions', status: 'Clear', severity: 'success' },
    { id: 'r3', name: 'Pulp vitality · LL7', value: 'No response', status: 'Refer', severity: 'error' },
    { id: 'r4', name: 'Plaque index', value: '18%', status: 'Improving', severity: 'info' },
  ],

  navItems: [
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'patients', label: 'Patients', icon: 'patients' },
    { id: 'treatmentPlans', label: 'Treatment plans', icon: 'treatmentPlans' },
    { id: 'billing', label: 'Billing', icon: 'billing' },
  ],

  gridColumns: [
    { field: 'tooth', headerName: 'Tooth (Universal)', width: 150, type: 'number', align: 'left' },
    { field: 'procedure', headerName: 'Procedure', width: 200 },
    { field: 'provider', headerName: 'Provider', width: 160 },
    { field: 'date', headerName: 'Charted', width: 120, type: 'date' },
    { field: 'fee', headerName: 'Fee (£)', width: 110, type: 'number' },
    { field: 'status', headerName: 'Status', width: 140 },
  ],

  // Synthetic placeholder ledger — see GridRow. Nothing here is a real fee or
  // a real clinical finding.
  gridRows: [
    { id: 1, tooth: 3, procedure: 'Composite filling', provider: 'A. Okonkwo', date: '2026-05-04', fee: 145, status: 'Completed', severity: 'success' },
    { id: 2, tooth: 14, procedure: 'Crown prep', provider: 'A. Okonkwo', date: '2026-05-11', fee: 620, status: 'In progress', severity: 'info' },
    { id: 3, tooth: 19, procedure: 'Root canal', provider: 'M. Sandoval', date: '2026-05-18', fee: 780, status: 'Referred', severity: 'warning' },
    { id: 4, tooth: 30, procedure: 'Extraction', provider: 'M. Sandoval', date: '2026-06-02', fee: 210, status: 'Planned', severity: 'info' },
    { id: 5, tooth: 8, procedure: 'Scale & polish', provider: 'R. Whitfield', date: '2026-06-09', fee: 85, status: 'Completed', severity: 'success' },
    { id: 6, tooth: 12, procedure: 'Composite filling', provider: 'A. Okonkwo', date: '2026-06-15', fee: 145, status: 'Completed', severity: 'success' },
    { id: 7, tooth: 25, procedure: 'Bitewing series', provider: 'R. Whitfield', date: '2026-06-22', fee: 60, status: 'Completed', severity: 'success' },
    { id: 8, tooth: 2, procedure: 'Sealant', provider: 'R. Whitfield', date: '2026-06-29', fee: 45, status: 'Planned', severity: 'info' },
    { id: 9, tooth: 31, procedure: 'Root canal', provider: 'M. Sandoval', date: '2026-07-06', fee: 780, status: 'Overdue', severity: 'error' },
    { id: 10, tooth: 6, procedure: 'Veneer', provider: 'A. Okonkwo', date: '2026-07-13', fee: 540, status: 'Planned', severity: 'info' },
    { id: 11, tooth: 18, procedure: 'Perio maintenance', provider: 'R. Whitfield', date: '2026-07-20', fee: 120, status: 'In progress', severity: 'info' },
    { id: 12, tooth: 21, procedure: 'Crown prep', provider: 'M. Sandoval', date: '2026-07-27', fee: 620, status: 'Overdue', severity: 'error' },
  ],

  // Synthetic practice hours — see PickerConfig.
  pickers: {
    defaultDate: '2026-08-12',
    defaultDateTime: '2026-08-12T09:30',
    minDate: '2026-08-03',
    maxDate: '2026-10-31',
    closedWeekdays: [0, 6],
    labels: {
      date: 'Appointment date',
      time: 'Chair time',
      dateTime: 'Recall due',
      field: 'Date of birth',
      calendar: 'Pick a day',
      constrained: 'Next available',
    },
    constrainedHelper: 'Closed at weekends and outside the booking window — disabled, never hidden.',
  },

  stepperSteps: ['Patient details', 'Clinical findings', 'Confirm plan'],

  selectOptions: ['Composite filling', 'Root canal', 'Crown prep', 'Scale & polish', 'Extraction'],

  charts: {
    months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],

    procedures: [
      { label: 'Restorative', data: [42, 38, 51, 47, 55, 49] },
      { label: 'Hygiene', data: [61, 66, 58, 72, 69, 74] },
      { label: 'Endodontic', data: [12, 15, 9, 14, 11, 16] },
    ],

    recall: [
      { label: 'Booked', data: [68, 71, 66, 74, 79, 82] },
      { label: 'Attended', data: [54, 60, 57, 63, 70, 71] },
    ],

    treatmentMix: [
      { id: 0, value: 38, label: 'Hygiene' },
      { id: 1, value: 27, label: 'Restorative' },
      { id: 2, value: 16, label: 'Ortho' },
      { id: 3, value: 11, label: 'Endodontic' },
      { id: 4, value: 8, label: 'Oral surgery' },
    ],

    // Three series only — see the ScatterSeries doc comment.
    scatter: [
      {
        label: 'Under 30',
        data: [
          { x: 6, y: 12, id: 'a1' }, { x: 9, y: 18, id: 'a2' }, { x: 12, y: 15, id: 'a3' },
          { x: 15, y: 24, id: 'a4' }, { x: 19, y: 21, id: 'a5' },
        ],
      },
      {
        label: '30–55',
        data: [
          { x: 8, y: 28, id: 'b1' }, { x: 13, y: 34, id: 'b2' }, { x: 17, y: 30, id: 'b3' },
          { x: 21, y: 41, id: 'b4' }, { x: 24, y: 37, id: 'b5' },
        ],
      },
      {
        label: 'Over 55',
        data: [
          { x: 10, y: 44, id: 'c1' }, { x: 14, y: 52, id: 'c2' }, { x: 18, y: 48, id: 'c3' },
          { x: 23, y: 58, id: 'c4' }, { x: 27, y: 61, id: 'c5' },
        ],
      },
    ],

    gauge: { value: 86, label: 'Chair utilisation', caption: 'Target 80%' },

    spark: [54, 60, 57, 63, 70, 71, 68, 75],

    rules: [
      'Assign slots in FIXED order, never cycled — a 7th series folds into “Other” or becomes small multiples.',
      'Scatter and bubble are capped at the first THREE slots: every pair is adjacent on screen, and past three the yellow/orange pair fails separation.',
      'Never a dual y-axis. Two measures of different scale = two charts, or index both to a common base.',
      'Status colours (error / warning / success) are reserved for state and never spent on “series 4”.',
      'Colour follows the entity, not its rank — filtering a series out must not repaint the survivors.',
      'The dark row is not the light row dimmed — the same six hues were re-stepped and validated again against the dark paper.',
      'On the light surface three slots fall under 3:1 against white, so those charts carry visible labels or a table view.',
    ],
  },
}
