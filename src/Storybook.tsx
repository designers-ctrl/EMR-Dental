/**
 * Storybook.tsx
 *
 * A living "kitchen sink" of the components this app is likely to use, rendered
 * with the real theme from src/theme.ts. This is the DS preview — a STANDALONE
 * app, kept separate from the product screens.
 *
 * USE THIS TO DESIGN, NOT TO SHIP:
 *  - Tune the look by editing src/theme.ts (hot-reloads). The "Edit map"
 *    section at the top says which key changes what.
 *  - Toggle light/dark at the top to check both schemes. There is no density
 *    toggle: MUI has no global density to drive one. The "Component sizes"
 *    section documents the real per-component size props instead.
 *  - Add a component: drop it into a new <Section>.
 *
 * Runs on its own dev server on port 3001 (`npm run dev:storybook`) — see
 * storybook.html / src/storybook-main.tsx / vite.storybook.config.ts. It has no
 * build script, so it never ships in the product bundle.
 *
 * Everything that is not a live MUI component is a projection of
 * src/data/storybook.ts.
 */

import { useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, AppBar, Autocomplete,
  Avatar, AvatarGroup, Badge, Box, Breadcrumbs, Button, ButtonGroup, Checkbox, Chip,
  CircularProgress, Container, CssBaseline, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormControlLabel, FormLabel,
  InputAdornment, InputLabel, LinearProgress, Link, List, ListItemButton, ListItemIcon, ListItemText,
  MenuItem, Pagination, Paper, Radio, RadioGroup, Rating, Select, Skeleton, Slider,
  Snackbar, Stack, Step, StepLabel, Stepper, Switch, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material'
import { ThemeProvider, useColorScheme, getContrastRatio } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'
import {
  AddPhotoAlternateOutlined, ArticleOutlined, BarChartOutlined, CachedOutlined,
  CalendarMonthOutlined, ContactPageOutlined, CreditCardOutlined, DynamicFormOutlined,
  EditNoteOutlined, ExpandMoreOutlined, ForwardToInboxOutlined, HelpOutlined,
  HistoryOutlined, LightModeOutlined, MedicationOutlined, NotificationImportantOutlined,
  ScienceOutlined, SettingsOutlined, StickyNote2Outlined, VaccinesOutlined,
  AssignmentIndOutlined, DarkModeOutlined,
} from '@mui/icons-material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { DateField } from '@mui/x-date-pickers/DateField'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import dayjs from 'dayjs'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import { Gauge } from '@mui/x-charts/Gauge'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { theme as appTheme, chartSeriesColors } from './theme.ts'
import {
  storybook,
  type GridRow,
  type NeutralTokenName,
  type PaletteChannelName,
  type SchemeCard,
} from './data/storybook.ts'

// ─── ICON VOCABULARY ─────────────────────────────────────────────────────
// A slice of the app's map (src/screens/PatientChart.tsx), keyed the same way
// so names read identically in both places.
const ICONS: Record<string, SvgIconComponent> = {
  schedule: CalendarMonthOutlined,
  patients: ContactPageOutlined,
  treatmentPlans: EditNoteOutlined,
  billing: CreditCardOutlined,
  imaging: AddPhotoAlternateOutlined,
  lab: ScienceOutlined,
  pharmacy: VaccinesOutlined,
  erx: MedicationOutlined,
  notes: StickyNote2Outlined,
  clinicalNotes: AssignmentIndOutlined,
  forms: DynamicFormOutlined,
  charts: BarChartOutlined,
  recall: CachedOutlined,
  alerts: NotificationImportantOutlined,
  history: HistoryOutlined,
  settings: SettingsOutlined,
  help: HelpOutlined,
  message: ForwardToInboxOutlined,
  docs: ArticleOutlined,
}

// ─── LAYOUT PRIMITIVES ───────────────────────────────────────────────────

function Section({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 8 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      {blurb && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
          <Ticks text={blurb} />
        </Typography>
      )}
      {children}
    </Box>
  )
}

/** A labelled row of specimens — the repeating unit inside most sections. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </Stack>
    </Box>
  )
}

const mono = { fontFamily: 'monospace', fontSize: 12 }

/**
 * Renders `backticks` in copy as monospace spans.
 *
 * Without this the ticks reach the DOM as literal characters — this page's
 * strings are full of prop and package names, so they are full of ticks. Split
 * on the pairs; every odd segment is code. An unmatched tick stays plain text.
 *
 * Used by Section blurbs, the size table and the exception cards, so a backtick
 * means the same thing everywhere on the page.
 */
function Ticks({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, i) =>
        i % 2 === 1 ? (
          <Box key={i} component="code" sx={{ ...mono, bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
            {part}
          </Box>
        ) : (
          part
        ),
      )}
    </>
  )
}

/**
 * Annotated alias for AvatarGroup. Its own prop type is large enough that, in a
 * file with this many MUI components in scope, inferring it inline exceeds
 * TypeScript's union complexity limit (TS2590). Narrowing to the two props this
 * page uses cuts the inference chain. Purely a type-level workaround — runtime
 * behaviour is unchanged.
 */
const Group = AvatarGroup as React.FC<{ max?: number; children?: React.ReactNode }>

const AVATAR_GROUP: { initials: string; color: string }[] = [
  { initials: 'JD', color: 'primary.main' },
  { initials: 'MK', color: 'success.main' },
  { initials: 'RS', color: 'warning.main' },
  { initials: 'TP', color: 'error.main' },
  { initials: 'AL', color: 'info.main' },
]

// ─── SHOWING BOTH COLOUR SCHEMES AT ONCE ─────────────────────────────────
// Every other section renders in whichever scheme the toolbar is toggled to.
// The colour sections cannot: light and dark are INDEPENDENT sets of hexes, so
// a reader who only ever sees one has no way to judge the other. These helpers
// draw both side by side, each on its own surface.

type Scheme = 'light' | 'dark'

/**
 * Real, resolved colours for a scheme that may not be the one rendering.
 *
 * `theme.palette.*` and every sx token path ('primary.main', 'divider') resolve
 * to the ACTIVE scheme only, so they are no use for the other half of a
 * side-by-side view. createTheme augments BOTH schemes eagerly, so the derived
 * light / dark / contrastText stops already sit on colorSchemes.<scheme>.palette
 * — read them from there rather than recomputing or keeping a second copy in
 * the dataset.
 */
const SCHEME_PALETTE = {
  light: appTheme.colorSchemes.light!.palette,
  dark: appTheme.colorSchemes.dark!.palette,
} as const

const STOPS = ['light', 'main', 'dark'] as const

/**
 * MUI's own two label colours (createPalette): white when it clears the
 * contrast threshold against the swatch, its black-alpha counterpart otherwise.
 * Applied PER STOP — `contrastText` is only guaranteed against `main`, so
 * reusing it on the lightened and darkened stops can drop a label below 3:1.
 */
const LABEL_ON_DARK = '#fff'
const LABEL_ON_LIGHT = 'rgba(0, 0, 0, 0.87)'
const labelOn = (bg: string) => (getContrastRatio(bg, LABEL_ON_DARK) >= 3 ? LABEL_ON_DARK : LABEL_ON_LIGHT)

/**
 * A patch of one scheme's own surface, labelled. Swatches for the scheme that
 * ISN'T rendering have to sit on their own background: a dark-scheme hex judged
 * against a white card answers a different question from the one the palette
 * was validated for.
 *
 * `surface` picks which background the plate uses — 'paper' for the chart rows,
 * because the series palette was validated against the card surface charts
 * actually sit on, not the page behind them.
 */
function SchemePlate({
  card,
  active,
  surface = 'default',
  note = false,
  children,
}: {
  card: SchemeCard
  active: boolean
  surface?: 'default' | 'paper'
  /** Off by default — the note is worth saying once per section, not per plate. */
  note?: boolean
  children: React.ReactNode
}) {
  const p = SCHEME_PALETTE[card.scheme]
  return (
    <Box
      sx={{
        flex: '1 1 380px',
        minWidth: 300,
        // Row centres its children; plates should match heights instead.
        alignSelf: 'stretch',
        p: 2,
        borderRadius: 1.5,
        border: 1,
        borderColor: p.divider,
        bgcolor: p.background[surface],
      }}
    >
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: note ? 0.5 : 2 }}>
        <Typography variant="subtitle2" sx={{ color: p.text.primary }}>
          {card.label}
        </Typography>
        {/* Text, not just a colour, so the live scheme is legible either way. */}
        {active && (
          <Chip
            label={storybook.activeSchemeBadge}
            size="small"
            variant="outlined"
            sx={{ color: p.text.secondary, borderColor: p.divider }}
          />
        )}
      </Stack>
      {note && (
        <Typography variant="caption" sx={{ display: 'block', color: p.text.secondary, mb: 2 }}>
          {card.note}
        </Typography>
      )}
      {children}
    </Box>
  )
}

/** The three stops MUI derives from one `main`, for one channel in one scheme. */
function ChannelSwatches({ scheme, channel }: { scheme: Scheme; channel: PaletteChannelName }) {
  const c = SCHEME_PALETTE[scheme][channel]
  return (
    <Stack direction="row" sx={{ borderRadius: 1, overflow: 'hidden' }}>
      {STOPS.map((stop) => (
        <Box
          key={stop}
          sx={{
            flex: 1,
            minWidth: 0,
            height: 62,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            bgcolor: c[stop],
            color: labelOn(c[stop]),
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {stop}
          </Typography>
          <Typography noWrap sx={{ ...mono, fontSize: 10, lineHeight: 1.3 }}>
            {c[stop]}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/** Exhaustive by construction — a new NeutralTokenName won't compile until it's mapped. */
function neutralValue(scheme: Scheme, token: NeutralTokenName) {
  const p = SCHEME_PALETTE[scheme]
  switch (token) {
    case 'background.default':
      return p.background.default
    case 'background.paper':
      return p.background.paper
    case 'text.primary':
      return p.text.primary
    case 'text.secondary':
      return p.text.secondary
    case 'text.disabled':
      return p.text.disabled
    case 'divider':
      return p.divider
  }
}

// ─── SECTIONS ────────────────────────────────────────────────────────────

function EditMap() {
  return (
    <Section
      title="Edit the design — where every knob lives"
      blurb="Everything below is changed by editing one file. Paths are project-relative. Hot-reload = the change appears instantly on save; RESTART = restart the dev server."
    >
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>What it changes</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>File to open</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>How &amp; reload</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storybook.editMap.map((grp) => [
              <TableRow key={grp.group} sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 700, py: 1 }}>
                  {grp.group}
                </TableCell>
              </TableRow>,
              ...grp.rows.map((r) => (
                <TableRow key={r.what}>
                  <TableCell>{r.what}</TableCell>
                  <TableCell sx={mono}>{r.file}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{r.where}</TableCell>
                </TableRow>
              )),
            ])}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}

function TypographySection() {
  return (
    <Section
      title="Typography"
      blurb="MUI's stock type scale, set in Inter. All four weights it asks for (300/400/500/700) are loaded, so nothing here is a browser-synthesized fake. The px figures are the WIDEST size: h1–h6 run through responsiveFontSizes(), so they step down below 1200px — narrow this window and the headings shrink with it. Everything at or under 16px (body, button, caption) is a fixed size and does not move."
    >
      {storybook.typeScale.map((group) => (
        <Box key={group.family} sx={{ mb: 4 }}>
          <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1 }}>
            {group.family}
          </Typography>
          {group.items.map((t) => (
            <Box
              key={t.variant}
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 3,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant={t.variant} noWrap sx={{ minWidth: 0 }}>
                {group.sample}
              </Typography>
              <Stack direction="row" spacing={2.5} sx={{ ...mono, color: 'text.secondary', flexShrink: 0 }}>
                {t.note && <span style={{ color: 'inherit', opacity: 0.8 }}>{t.note}</span>}
                <span>{t.variant}</span>
                <span style={{ width: 48, textAlign: 'right' }}>{t.px}px</span>
                <span style={{ width: 32, textAlign: 'right' }}>{t.weight}</span>
              </Stack>
            </Box>
          ))}
        </Box>
      ))}
    </Section>
  )
}

function ShapeSection() {
  return (
    <Section
      title="Spacing, radius & sizing"
      blurb="Both scales are multipliers, not token lists. sx borderRadius: n means n × shape.borderRadius; sx p: n means n × spacing. This is MUI's native scale mechanism — there is no separate radius token object."
    >
      <Row label="Radius — sx={{ borderRadius: n }}">
        {storybook.radiusScale.map((r) => (
          <Stack key={String(r.multiplier)} spacing={0.5} sx={{ alignItems: 'center', width: 108 }}>
            <Box
              sx={{
                width: 72,
                height: 48,
                bgcolor: 'primary.main',
                borderRadius: typeof r.multiplier === 'number' ? r.multiplier : '50%',
              }}
            />
            <Typography sx={mono}>{r.multiplier}</Typography>
            <Typography variant="caption" color="text.secondary">
              {r.px}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ lineHeight: 1.3 }}>
              {r.usage}
            </Typography>
          </Stack>
        ))}
      </Row>

      <Row label="Spacing — sx={{ p: n }} / spacing={n}">
        {storybook.spacingScale.map((s) => (
          <Stack key={s.multiplier} spacing={0.5} sx={{ alignItems: 'center', width: 108 }}>
            <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: s.px, height: 24, bgcolor: 'primary.main', borderRadius: 0.5 }} />
            </Box>
            <Typography sx={mono}>{s.multiplier}</Typography>
            <Typography variant="caption" color="text.secondary">
              {s.px}px
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ lineHeight: 1.3 }}>
              {s.usage}
            </Typography>
          </Stack>
        ))}
      </Row>

      <Row label="Border widths — sx takes plain numbers as px">
        {([1, 2, 4] as const).map((w) => (
          <Stack key={w} spacing={0.5} sx={{ alignItems: 'center', width: 108 }}>
            <Box sx={{ width: 72, height: 48, borderRadius: 1, border: w, borderColor: 'primary.main' }} />
            <Typography sx={mono}>border: {w}</Typography>
            <Typography variant="caption" color="text.secondary">
              {w}px solid
            </Typography>
          </Stack>
        ))}
      </Row>
    </Section>
  )
}

/**
 * The component-size reference — this project's answer to Vuetify's density
 * toggle. See SizeGroup in data/storybook.ts for why it is a table and not a
 * control: there is no global density in MUI to toggle.
 *
 * Pure projection of storybook.sizeTable. Every px in it came from MUI source.
 */
function SizeSection() {
  return (
    <Section
      title="Component sizes"
      blurb="Vuetify cascades one `density` prop through <v-defaults-provider>. MUI has no equivalent — sizing is per-component, spelled four different ways, and on three components `size` means something else entirely. This table is the whole picture; set a global default with components.<Mui*>.defaultProps.size in theme.ts."
    >
      {storybook.sizeTable.map((g) => (
        <Box key={g.group} sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {g.group}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 760 }}>
            <Ticks text={g.note} />
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '18%' }}>Component</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '8%' }}>Prop</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>Values → what they produce</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '9%' }}>Default</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {g.rows.map((r) => (
                  <TableRow key={r.component} hover sx={{ verticalAlign: 'top' }}>
                    <TableCell sx={{ fontWeight: 500 }}>{r.component}</TableCell>
                    <TableCell sx={mono}>{r.prop}</TableCell>
                    <TableCell>
                      {/*
                        The measure caption is what makes the numbers legible:
                        Button's 13px is a font size, Fab's 40px is a box. A
                        bare px column without it is guesswork.
                      */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {r.measure}
                      </Typography>
                      <Stack spacing={0.25}>
                        {r.values.map((v) => (
                          <Stack key={v.name} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                            <Box component="span" sx={{ ...mono, minWidth: 76, flexShrink: 0 }}>
                              {v.name}
                            </Box>
                            <Box component="span" sx={{ ...mono, color: 'text.secondary' }}>
                              {v.value}
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={mono}>{r.fallback}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      <Ticks text={r.effect} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Section>
  )
}

function ColorSection() {
  const { mode } = useColorScheme()
  const active: Scheme = mode === 'dark' ? 'dark' : 'light'

  return (
    <Section
      title="Colours"
      blurb="Each channel is ONE hex per scheme in theme.ts; MUI derives light / dark / contrastText from it. Both schemes are drawn here at once, each on its own surface, because they are independent sets of hexes rather than a filter over one another — the brand navy scores 1.26:1 on the dark background, so dark declares its own. Every swatch is read live from the theme, so editing a hex there moves this page."
    >
      <Row label="Brand & status channels — both schemes">
        {storybook.schemeCards.map((card) => (
          <SchemePlate key={card.scheme} card={card} active={card.scheme === active} note>
            <Stack spacing={2}>
              {storybook.paletteChannels.map((c) => (
                <Box key={c.name}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: SCHEME_PALETTE[card.scheme].text.primary }}>
                      {c.name}
                    </Typography>
                    <Typography sx={{ ...mono, color: SCHEME_PALETTE[card.scheme].text.secondary }}>
                      {SCHEME_PALETTE[card.scheme][c.name].main}
                    </Typography>
                  </Stack>
                  <ChannelSwatches scheme={card.scheme} channel={c.name} />
                </Box>
              ))}
            </Stack>
          </SchemePlate>
        ))}
      </Row>

      {/* Usage is a property of the CHANNEL, not of a scheme — so it is stated
          once here rather than repeated inside both plates. */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          What each channel is for
        </Typography>
        <Stack spacing={1.25}>
          {storybook.paletteChannels.map((c) => (
            <Stack key={c.name} direction="row" spacing={1} useFlexGap sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ width: 88 }}>
                {c.name}
              </Typography>
              {c.derived && <Chip label="derived stops" size="small" variant="outlined" />}
              <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 340px' }}>
                {c.usage}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Row label="Neutrals — each scheme shown on its own page surface">
        {storybook.schemeCards.map((card) => {
          const p = SCHEME_PALETTE[card.scheme]
          return (
            <SchemePlate key={card.scheme} card={card} active={card.scheme === active}>
              {/* An inner plate at background.paper, so the card-on-page
                  relationship every screen relies on is visible, not described. */}
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: p.background.paper, border: 1, borderColor: p.divider }}>
                <Stack spacing={1.25}>
                  {storybook.neutrals.map((n) => {
                    const value = neutralValue(card.scheme, n.token)
                    const isText = n.token.startsWith('text.')
                    return (
                      <Stack key={n.token} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: 0.5,
                            bgcolor: value,
                            border: 1,
                            borderColor: p.divider,
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          {/* Text tokens are drawn IN their own colour — the
                              only honest way to show that text.disabled is
                              meant to recede. */}
                          <Typography
                            sx={{ ...mono, fontWeight: 700, color: isText ? value : p.text.primary }}
                          >
                            {n.token}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: p.text.secondary }}>
                            {value} · {n.usage}
                          </Typography>
                        </Box>
                      </Stack>
                    )
                  })}
                </Stack>
              </Box>
            </SchemePlate>
          )
        })}
      </Row>
    </Section>
  )
}

function IconSection() {
  return (
    <Section
      title="Icons"
      blurb="@mui/icons-material, Outlined style. Semantic keys map to components in an ICONS record, so markup names the role rather than the glyph. Size comes from fontSize, not width/height."
    >
      <Row label="Vocabulary">
        {storybook.sampleIcons.map((name) => {
          const Glyph = ICONS[name]
          return Glyph ? (
            <Stack key={name} spacing={0.5} sx={{ alignItems: 'center', width: 104 }}>
              <Glyph sx={{ fontSize: 26 }} />
              <Typography variant="caption" color="text.secondary" align="center">
                {name}
              </Typography>
            </Stack>
          ) : null
        })}
      </Row>
      <Row label="Sizes — fontSize prop">
        {(['small', 'medium', 'large'] as const).map((s) => (
          <Stack key={s} spacing={0.5} sx={{ alignItems: 'center', width: 88 }}>
            <ScienceOutlined fontSize={s} />
            <Typography variant="caption" color="text.secondary">
              {s}
            </Typography>
          </Stack>
        ))}
      </Row>
      <Row label="Colours">
        {(['inherit', 'primary', 'error', 'warning', 'info', 'success', 'disabled'] as const).map((c) => (
          <Stack key={c} spacing={0.5} sx={{ alignItems: 'center', width: 88 }}>
            <NotificationImportantOutlined color={c} />
            <Typography variant="caption" color="text.secondary">
              {c}
            </Typography>
          </Stack>
        ))}
      </Row>
    </Section>
  )
}

function ButtonSection() {
  return (
    <Section
      title="Buttons"
      blurb="Three variants × three sizes. Padding is a 3 × 3 matrix of variant × size — which is why theme.ts warns against setting padding on the root slot."
    >
      {(['contained', 'outlined', 'text'] as const).map((variant) => (
        <Row key={variant} label={variant}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {size}
            </Button>
          ))}
          <Button variant={variant} disabled>
            disabled
          </Button>
          <Button variant={variant} startIcon={<ScienceOutlined />}>
            with icon
          </Button>
          {(['error', 'warning', 'success'] as const).map((c) => (
            <Button key={c} variant={variant} color={c}>
              {c}
            </Button>
          ))}
        </Row>
      ))}
      <Row label="Button group">
        <ButtonGroup variant="outlined">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </Row>
    </Section>
  )
}

function AvatarSection() {
  return (
    <Section title="Avatars" blurb="Circular by default. `rounded` reads shape.borderRadius; `square` drops it entirely.">
      <Row label="Variants">
        {(['circular', 'rounded', 'square'] as const).map((v) => (
          <Stack key={v} spacing={0.5} sx={{ alignItems: 'center', width: 96 }}>
            <Avatar variant={v} sx={{ bgcolor: 'primary.main' }}>
              AB
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {v}
            </Typography>
          </Stack>
        ))}
      </Row>
      <Row label="Sizes — width/height, no size prop">
        {[24, 32, 40, 56].map((n) => (
          <Stack key={n} spacing={0.5} sx={{ alignItems: 'center', width: 96 }}>
            <Avatar sx={{ width: n, height: n, bgcolor: 'secondary.main', fontSize: n / 2.5 }}>AB</Avatar>
            <Typography variant="caption" color="text.secondary">
              {n}px
            </Typography>
          </Stack>
        ))}
      </Row>
      <Row label="Group + badge">
        {/* Children come from a typed array rather than inline JSX. In a file
            this size TypeScript's inference for AvatarGroup tips past its union
            complexity limit (TS2590); the annotated `Group` alias below cuts
            the chain. Keep both if you add more to this section. */}
        <Group max={4}>
          {AVATAR_GROUP.map((a) => (
            <Avatar key={a.initials} sx={{ bgcolor: a.color }}>
              {a.initials}
            </Avatar>
          ))}
        </Group>
        <Badge badgeContent={4} color="error">
          <Avatar sx={{ bgcolor: 'primary.main' }}>AB</Avatar>
        </Badge>
      </Row>
    </Section>
  )
}

function SelectionSection() {
  const [check, setCheck] = useState(true)
  const [radio, setRadio] = useState('composite')
  const [toggle, setToggle] = useState(true)

  return (
    <Section
      title="Selection controls"
      blurb="Checkbox, Radio and Switch all sit on SwitchBase (padding 9), which is why they share a hit area. Resize them with the icon's fontSize, not width/height."
    >
      <Row label="Checkbox">
        <FormControlLabel control={<Checkbox checked={check} onChange={(e) => setCheck(e.target.checked)} />} label="Checked" />
        <FormControlLabel control={<Checkbox />} label="Unchecked" />
        <FormControlLabel control={<Checkbox indeterminate />} label="Indeterminate" />
        <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
        <FormControlLabel control={<Checkbox color="success" defaultChecked />} label="Success" />
      </Row>

      <Row label="Radio">
        <FormControl>
          <FormLabel sx={{ mb: 0.5 }}>Procedure</FormLabel>
          <RadioGroup row value={radio} onChange={(e) => setRadio(e.target.value)}>
            <FormControlLabel value="composite" control={<Radio />} label="Composite" />
            <FormControlLabel value="crown" control={<Radio />} label="Crown" />
            <FormControlLabel value="extraction" control={<Radio />} label="Extraction" disabled />
          </RadioGroup>
        </FormControl>
      </Row>

      <Row label="Switch">
        <FormControlLabel control={<Switch checked={toggle} onChange={(e) => setToggle(e.target.checked)} />} label="On" />
        <FormControlLabel control={<Switch />} label="Off" />
        <FormControlLabel control={<Switch disabled />} label="Disabled" />
        <FormControlLabel control={<Switch color="success" defaultChecked />} label="Success" />
      </Row>
    </Section>
  )
}

function InputSection() {
  const [text, setText] = useState('Amelia Hartley')
  const [proc, setProc] = useState(storybook.selectOptions[0])

  return (
    <Section
      title="Text inputs & selects"
      blurb="A TextField is four themeable components stacked — FormControl, InputLabel, OutlinedInput and FormHelperText. Field height comes from OutlinedInput's input padding, not from TextField."
    >
      {(['outlined', 'filled', 'standard'] as const).map((variant) => (
        <Row key={variant} label={variant}>
          <TextField variant={variant} label="Patient name" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField variant={variant} label="With helper" helperText="Shown below the field" />
          <TextField variant={variant} label="Error" error helperText="Required field" />
          <TextField variant={variant} label="Disabled" disabled />
        </Row>
      ))}

      <Row label="Sizes & multiline">
        <TextField label="Small" size="small" />
        <TextField label="Medium" size="medium" />
        <TextField label="Clinical note" multiline rows={3} sx={{ minWidth: 260 }} />
      </Row>

      <Row label="Leading icon (InputAdornment)">
        <TextField
          size="small"
          placeholder="Add…"
          slotProps={{
            htmlInput: { 'aria-label': 'Add a note' },
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                  <EditNoteOutlined sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Row>

      <Row label="Select & autocomplete">
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="proc-label">Procedure</InputLabel>
          <Select labelId="proc-label" label="Procedure" value={proc} onChange={(e) => setProc(e.target.value)}>
            {storybook.selectOptions.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          options={storybook.selectOptions}
          sx={{ minWidth: 260 }}
          renderInput={(params) => <TextField {...params} label="Search procedures" />}
        />
      </Row>
    </Section>
  )
}

/**
 * @mui/x-date-pickers, community (MIT) tier.
 *
 * Two things make this different from every other section here:
 *  1. It needs a <LocalizationProvider> ancestor supplying a date adapter.
 *     One wraps the whole app in <Storybook> — without it every picker throws.
 *  2. The text field is PickersTextField, not TextField. A theme default aimed
 *     at MuiTextField will NOT reach it — target MuiPickersTextField instead,
 *     and import '@mui/x-date-pickers/themeAugmentation' wherever you do.
 *
 * The dataset holds ISO strings; dayjs() is applied here so the adapter choice
 * stays in the view.
 */
function DatePickerSection() {
  const p = storybook.pickers
  const closed = new Set(p.closedWeekdays)

  return (
    <Section
      title="Date & time pickers"
      blurb="@mui/x-date-pickers — not in core MUI. Every picker is a text field plus a popper, so it inherits the input styling above; the calendar reads shape.borderRadius and the palette. Range pickers are Pro-tier and not installed."
    >
      <Row label="Date · time · date-time">
        <DatePicker label={p.labels.date} defaultValue={dayjs(p.defaultDate)} />
        <TimePicker label={p.labels.time} defaultValue={dayjs(p.defaultDateTime)} />
        <DateTimePicker label={p.labels.dateTime} defaultValue={dayjs(p.defaultDateTime)} />
      </Row>

      <Row label="Field only — keyboard entry, no popper">
        <DateField label={p.labels.field} defaultValue={dayjs(p.defaultDate)} />
        <DateField label="Disabled" defaultValue={dayjs(p.defaultDate)} disabled />
        <DateField label="Error" defaultValue={dayjs(p.defaultDate)} slotProps={{ textField: { error: true, helperText: 'Outside the booking window' } }} />
      </Row>

      <Row label="Constrained — bounds and closed days">
        <DatePicker
          label={p.labels.constrained}
          defaultValue={dayjs(p.defaultDate)}
          minDate={dayjs(p.minDate)}
          maxDate={dayjs(p.maxDate)}
          // Disabled, not filtered out: a day missing from the grid reads as a
          // bug, a greyed one reads as a rule.
          shouldDisableDate={(d) => closed.has(d.day())}
          slotProps={{ textField: { helperText: p.constrainedHelper } }}
        />
      </Row>

      <Row label="Inline calendar — no field, no popper">
        <Paper variant="outlined">
          <DateCalendar
            defaultValue={dayjs(p.defaultDate)}
            shouldDisableDate={(d) => closed.has(d.day())}
            aria-label={p.labels.calendar}
          />
        </Paper>
      </Row>
    </Section>
  )
}

function SliderSection() {
  const [val, setVal] = useState(40)
  const [range, setRange] = useState<number[]>([20, 70])
  const [rating, setRating] = useState<number | null>(3)

  return (
    <Section title="Sliders & rating" blurb="Rating hardcodes #faaf00 — it is the one component whose brand colour is not a palette token.">
      <Row label="Slider">
        <Box sx={{ width: 280 }}>
          <Slider value={val} onChange={(_, v) => setVal(v as number)} valueLabelDisplay="auto" />
        </Box>
        <Box sx={{ width: 280 }}>
          <Slider value={range} onChange={(_, v) => setRange(v as number[])} valueLabelDisplay="auto" />
        </Box>
        <Box sx={{ width: 280 }}>
          <Slider defaultValue={30} marks step={10} min={0} max={100} size="small" />
        </Box>
      </Row>
      <Row label="Rating">
        <Rating value={rating} onChange={(_, v) => setRating(v)} />
        <Rating defaultValue={2.5} precision={0.5} />
        <Rating defaultValue={3} readOnly />
        <Rating defaultValue={3} disabled />
      </Row>
    </Section>
  )
}

function ChipSection() {
  return (
    <Section title="Chips" blurb="Chip derives its radius from its own height (32 ÷ 2), so it ignores shape.borderRadius and stays a pill at either size.">
      <Row label="Variants & colours">
        <Chip label="Default" />
        <Chip label="Outlined" variant="outlined" />
        {(['primary', 'error', 'warning', 'info', 'success'] as const).map((c) => (
          <Chip key={c} label={c} color={c} />
        ))}
      </Row>
      <Row label="Sizes, icons, interaction">
        <Chip label="Small" size="small" />
        <Chip label="Medium" size="medium" />
        <Chip label="With icon" icon={<ScienceOutlined />} />
        <Chip label="Avatar" avatar={<Avatar>A</Avatar>} />
        <Chip label="Deletable" onDelete={() => {}} />
        <Chip label="Clickable" onClick={() => {}} />
        <Chip label="Disabled" disabled />
      </Row>
    </Section>
  )
}

function ToggleSection() {
  const [view, setView] = useState('list')
  const [formats, setFormats] = useState<string[]>(['bold'])

  return (
    <Section
      title="Toggle buttons (segmented)"
      blurb="Borders collapse via marginLeft -1 so adjacent buttons share one hairline. The closest MUI has to Vuetify's v-btn-toggle."
    >
      <Row label="Exclusive">
        <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="list">List</ToggleButton>
          <ToggleButton value="grid">Grid</ToggleButton>
          <ToggleButton value="chart">Chart</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)} size="small" color="primary">
          <ToggleButton value="list">Small</ToggleButton>
          <ToggleButton value="grid">Primary</ToggleButton>
        </ToggleButtonGroup>
      </Row>
      <Row label="Multi-select">
        <ToggleButtonGroup value={formats} onChange={(_, v) => setFormats(v)}>
          <ToggleButton value="bold">Bold</ToggleButton>
          <ToggleButton value="italic">Italic</ToggleButton>
          <ToggleButton value="underline">Underline</ToggleButton>
        </ToggleButtonGroup>
      </Row>
    </Section>
  )
}

function SurfaceSection() {
  return (
    <Section
      title="Cards & surfaces"
      blurb="Paper is the base for Card, Dialog, Menu and Alert — so its radius and elevation propagate widely."
    >
      <Row label="Elevation">
        {[0, 1, 2, 4, 8, 16, 24].map((e) => (
          <Paper key={e} elevation={e} sx={{ width: 96, height: 72, display: 'grid', placeItems: 'center' }}>
            <Typography sx={mono}>{e}</Typography>
          </Paper>
        ))}
      </Row>
      <Row label="Variants">
        <Paper variant="outlined" sx={{ width: 160, height: 88, p: 2 }}>
          <Typography variant="subtitle2">Outlined</Typography>
          <Typography variant="caption" color="text.secondary">
            1px divider border
          </Typography>
        </Paper>
        <Paper elevation={1} sx={{ width: 160, height: 88, p: 2 }}>
          <Typography variant="subtitle2">Elevation</Typography>
          <Typography variant="caption" color="text.secondary">
            shadow, no border
          </Typography>
        </Paper>
      </Row>
    </Section>
  )
}

function ListSection() {
  const [sel, setSel] = useState('schedule')
  return (
    <Section title="Lists" blurb="ListItemButton carries the selected state. `dense` is the closest thing List has to a density prop.">
      <Paper variant="outlined" sx={{ maxWidth: 360 }}>
        <List>
          {storybook.navItems.map((item) => {
            const Glyph = ICONS[item.icon]
            return (
              <ListItemButton key={item.id} selected={sel === item.id} onClick={() => setSel(item.id)}>
                <ListItemIcon>{Glyph && <Glyph />}</ListItemIcon>
                <ListItemText primary={item.label} secondary={sel === item.id ? 'Selected' : undefined} />
              </ListItemButton>
            )
          })}
        </List>
      </Paper>
    </Section>
  )
}

function TableSection() {
  return (
    <Section
      title="Data table"
      blurb="Core MUI Table — static rows, no sorting or virtualisation. Reach for it when the rows are few and fixed; for sorting, filtering or paging use the Data grid below."
    >
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Finding</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storybook.labRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{r.value}</TableCell>
                <TableCell align="right">
                  <Chip label={r.status} color={r.severity} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}

/**
 * @mui/x-data-grid, community (MIT) tier. It is a separate package from
 * @mui/material, but it reads the SAME theme — palette, radius and typography
 * flow in without configuration, so there is nothing to restyle here.
 *
 * Columns come from the dataset; only `renderCell` lives in the view, because
 * a dataset cannot hold JSX.
 */
function DataGridSection() {
  const columns: GridColDef<GridRow>[] = storybook.gridColumns.map((c) => {
    const base: GridColDef<GridRow> = {
      field: c.field,
      headerName: c.headerName,
      width: c.width,
      type: c.type,
      align: c.align,
      headerAlign: c.align,
    }

    // A `date` column needs a real Date, not the ISO string the dataset holds —
    // otherwise sorting is lexical and the filter operators never appear.
    if (c.field === 'date') return { ...base, valueGetter: (value: string) => new Date(value) }

    // Status carries its label as text, never colour alone.
    if (c.field === 'status') {
      return {
        ...base,
        renderCell: (params) => <Chip label={params.row.status} color={params.row.severity} size="small" />,
      }
    }

    return base
  })

  return (
    <Section
      title="Data grid"
      blurb="@mui/x-data-grid — sorting, filtering, column resize/reorder, pagination and row selection, none of which core Table has. The community tier is MIT; Pro and Premium (tree data, pivoting, Excel export) are commercially licensed and not installed."
    >
      <Box sx={{ height: 460, width: '100%' }}>
        <DataGrid
          label="Charted procedures (synthetic)"
          showToolbar
          checkboxSelection
          disableRowSelectionOnClick
          rows={storybook.gridRows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    </Section>
  )
}

function NavigationSection() {
  const [tab, setTab] = useState(0)
  const [page, setPage] = useState(1)

  return (
    <Section title="Navigation" blurb="Tabs with variant='scrollable' is the nearest equivalent to Vuetify's v-slide-group.">
      <Row label="Tabs">
        <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Overview" />
            <Tab label="Charting" />
            <Tab label="Imaging" />
            <Tab label="Ledger" />
          </Tabs>
        </Box>
      </Row>
      <Row label="Scrollable tabs">
        <Box sx={{ maxWidth: 480 }}>
          <Tabs value={0} variant="scrollable" scrollButtons="auto">
            {storybook.selectOptions.concat(storybook.selectOptions).map((o, i) => (
              <Tab key={`${o}-${i}`} label={o} />
            ))}
          </Tabs>
        </Box>
      </Row>
      <Row label="Breadcrumbs & links">
        <Breadcrumbs>
          <Link underline="hover" color="inherit" href="#">
            Patients
          </Link>
          <Link underline="hover" color="inherit" href="#">
            Amelia Hartley
          </Link>
          <Typography color="text.primary">Charting</Typography>
        </Breadcrumbs>
      </Row>
      <Row label="Pagination">
        <Pagination count={8} page={page} onChange={(_, p) => setPage(p)} />
        <Pagination count={8} shape="rounded" size="small" />
      </Row>
    </Section>
  )
}

function FeedbackSection() {
  const [snack, setSnack] = useState(false)
  const [dialog, setDialog] = useState(false)

  return (
    <Section title="Feedback & status" blurb="Alert is the first real consumer of the error / warning / info / success channels.">
      <Row label="Alerts">
        <Stack spacing={1.5} sx={{ width: '100%' }}>
          {(['error', 'warning', 'info', 'success'] as const).map((s) => (
            <Alert key={s} severity={s}>
              <AlertTitle sx={{ textTransform: 'capitalize' }}>{s}</AlertTitle>
              A short explanation of the {s} condition.
            </Alert>
          ))}
          <Alert severity="info" variant="outlined">
            Outlined variant
          </Alert>
          <Alert severity="info" variant="filled">
            Filled variant
          </Alert>
        </Stack>
      </Row>
      <Row label="Progress & skeleton">
        <CircularProgress />
        <CircularProgress variant="determinate" value={65} />
        <Box sx={{ width: 220 }}>
          <LinearProgress />
        </Box>
        <Box sx={{ width: 220 }}>
          <LinearProgress variant="determinate" value={65} />
        </Box>
        <Stack spacing={0.5} sx={{ width: 220 }}>
          <Skeleton variant="text" />
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
      </Row>
      <Row label="Overlays">
        <Button variant="outlined" onClick={() => setSnack(true)}>
          Show snackbar
        </Button>
        <Button variant="outlined" onClick={() => setDialog(true)}>
          Open dialog
        </Button>
        <Tooltip title="Tooltip uses a hardcoded grey, not a palette token">
          <Button variant="outlined">Hover for tooltip</Button>
        </Tooltip>
        <Badge badgeContent={12} color="error">
          <NotificationImportantOutlined />
        </Badge>
      </Row>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)} message="Treatment plan saved" />
      <Dialog open={dialog} onClose={() => setDialog(false)}>
        <DialogTitle>Confirm treatment plan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will lock the plan for Amelia Hartley and notify the practice. Dialog renders on a Paper, so it inherits the
            global radius.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialog(false)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Section>
  )
}

function StepperSection() {
  const [step, setStep] = useState(1)
  return (
    <Section title="Stepper" blurb="StepIcon reads palette[color].contrastText for its numeral.">
      <Box sx={{ mb: 2 }}>
        <Stepper activeStep={step}>
          {storybook.stepperSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button variant="contained" disabled={step === storybook.stepperSteps.length - 1} onClick={() => setStep((s) => s + 1)}>
          Next
        </Button>
      </Stack>
      <Box sx={{ mt: 3 }}>
        <Stepper activeStep={1} orientation="vertical">
          {storybook.stepperSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Section>
  )
}

function AccordionSection() {
  return (
    <Section title="Accordion" blurb="Built on Paper, so it inherits elevation and the global radius.">
      <Box sx={{ maxWidth: 560 }}>
        {storybook.stepperSteps.map((label, i) => (
          <Accordion key={label} defaultExpanded={i === 0}>
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Typography variant="subtitle2">{label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Panel content for {label.toLowerCase()}.
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Section>
  )
}

/** One titled chart cell — keeps every chart on the same surface treatment. */
function ChartCard({ title, note, height = 260, children }: { title: string; note?: string; height?: number; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 340px', minWidth: 320 }}>
      <Typography variant="subtitle2">{title}</Typography>
      {note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {note}
        </Typography>
      )}
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  )
}

function ChartSection() {
  const { mode } = useColorScheme()
  const scheme: Scheme = mode === 'dark' ? 'dark' : 'light'
  const c = storybook.charts
  const xAxis = [{ scaleType: 'band' as const, data: c.months }]

  // Passed explicitly on every chart. x-charts resolves colours in JS from
  // theme.palette.mode, which cssVariables freezes at the default scheme — so
  // the theme default alone would keep rendering light hues in dark mode.
  const colors = [...chartSeriesColors[scheme]]

  return (
    <Section
      title="Data viz"
      blurb="@mui/x-charts. Series colours are a SEPARATE list from the UI palette — they answer a different question, so no status channel ever becomes a series. Both scheme rows are shown at once, each on the card surface it was validated against; the charts below render in whichever scheme the toolbar is toggled to."
    >
      <Row label="Series palette — both schemes, assigned in this fixed order">
        {storybook.schemeCards.map((card) => {
          const p = SCHEME_PALETTE[card.scheme]
          return (
            <SchemePlate key={card.scheme} card={card} active={card.scheme === scheme} surface="paper">
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {chartSeriesColors[card.scheme].map((hex, i) => (
                  <Stack key={hex} spacing={0.5} sx={{ alignItems: 'center', width: 76 }}>
                    <Box sx={{ width: '100%', height: 40, borderRadius: 1, bgcolor: hex }} />
                    <Typography sx={{ ...mono, color: p.text.primary }}>slot {i + 1}</Typography>
                    <Typography variant="caption" sx={{ color: p.text.secondary }}>
                      {hex}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </SchemePlate>
          )
        })}
      </Row>

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
        <ChartCard title="Procedures by month" note="Magnitude across categories — grouped bars.">
          <BarChart
            colors={colors}
            xAxis={xAxis}
            series={c.procedures.map((s) => ({ ...s }))}
            height={240}
            margin={{ left: 8, right: 8 }}
          />
        </ChartCard>

        <ChartCard title="Recall compliance" note="Change over time — 2px lines, markers on hover.">
          <LineChart colors={colors} xAxis={xAxis} series={c.recall.map((s) => ({ ...s }))} height={240} margin={{ left: 8, right: 8 }} />
        </ChartCard>

        <ChartCard title="Attendance trend" note="Same data as an area — one series, so no legend needed.">
          <LineChart
            colors={colors}
            xAxis={xAxis}
            series={[{ ...c.recall[1], area: true, showMark: false }]}
            height={240}
            margin={{ left: 8, right: 8 }}
          />
        </ChartCard>

        <ChartCard title="Treatment mix" note="Composition of a whole — labelled directly, no legend.">
          <PieChart
            colors={colors}
            series={[
              {
                data: c.treatmentMix,
                innerRadius: 42,
                paddingAngle: 2,
                cornerRadius: 4,
                arcLabel: (item) => `${item.value}%`,
              },
            ]}
            height={240}
          />
        </ChartCard>

        <ChartCard title="Plaque index vs. age band" note="Correlation. THREE series max — every pair is adjacent in a scatter.">
          <ScatterChart colors={colors} series={c.scatter.map((s) => ({ ...s }))} height={240} margin={{ left: 8, right: 8 }} />
        </ChartCard>

        <ChartCard title={c.gauge.label} note={`A single headline figure — ${c.gauge.caption}.`}>
          <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Gauge value={c.gauge.value} startAngle={-110} endAngle={110} height={200} text={({ value }) => `${value}%`} />
          </Stack>
        </ChartCard>
      </Stack>

      <Row label="Sparkline — inline trend, no axes or legend">
        <Box sx={{ width: 200, height: 60 }}>
          {/* Single series, so SparkLineChart takes `color`, not `colors`. */}
          <SparkLineChart color={colors[0]} data={c.spark} height={60} />
        </Box>
        <Box sx={{ width: 200, height: 60 }}>
          <SparkLineChart color={colors[0]} data={c.spark} plotType="bar" height={60} />
        </Box>
      </Row>

      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Rules that ride along with this palette
        </Typography>
        <Stack component="ul" spacing={0.75} sx={{ pl: 2.5, m: 0 }}>
          {c.rules.map((r) => (
            <Typography key={r} component="li" variant="body2" color="text.secondary">
              {r}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Section>
  )
}

// ─── ROOT ────────────────────────────────────────────────────────────────

/**
 * Must live inside ThemeProvider — useColorScheme reads from that context.
 *
 * Light/dark is the only control here. A comfortable/compact toggle used to sit
 * beside it; it was removed because MUI has no global density to toggle — see
 * the Component sizes section, which documents the real per-component props.
 */
function Toolbar() {
  const { mode, setMode } = useColorScheme()
  const isDark = mode === 'dark'

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', px: 3, py: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Storybook
        </Typography>

        <Button
          variant="outlined"
          startIcon={isDark ? <DarkModeOutlined /> : <LightModeOutlined />}
          onClick={() => setMode(isDark ? 'light' : 'dark')}
        >
          {isDark ? 'Dark' : 'Light'}
        </Button>
      </Stack>
    </AppBar>
  )
}

export default function Storybook() {
  // The product theme, used AS-IS. It was previously rebuilt per density
  // toggle; with that gone there is nothing to derive, so what renders here is
  // exactly what a product screen gets.
  //
  // defaultMode starts light to match the product app; the toolbar toggle
  // overrides it and useColorScheme persists the choice to localStorage.
  //
  // LocalizationProvider is not optional decoration: every @mui/x-date-pickers
  // component throws without an adapter ancestor. It wraps the whole app rather
  // than one section so a picker dropped into any future section just works.
  return (
    <ThemeProvider theme={appTheme} defaultMode="light">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Toolbar />

        <Container sx={{ py: 6 }} maxWidth="lg">
          <EditMap />
          <Divider sx={{ mb: 8 }} />
          <TypographySection />
          <ShapeSection />
          <SizeSection />
          <ColorSection />
          <IconSection />
          <Divider sx={{ mb: 8 }} />
          <ButtonSection />
          <AvatarSection />
          <SelectionSection />
          <InputSection />
          <DatePickerSection />
          <SliderSection />
          <ChipSection />
          <ToggleSection />
          <Divider sx={{ mb: 8 }} />
          <SurfaceSection />
          <ListSection />
          <TableSection />
          <DataGridSection />
          <NavigationSection />
          <FeedbackSection />
          <StepperSection />
          <AccordionSection />
          <Divider sx={{ mb: 8 }} />
          <ChartSection />
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  )
}
