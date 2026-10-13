import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { darken, lighten, type Theme } from '@mui/material/styles'

import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'

import {
  CARIES_SURFACE_ORDER,
  cariesByFdi,
  deepestSite,
  postCoreByFdi,
  defaultChartLayers,
  endoByFdi,
  hasPerioFindings,
  implantsByFdi,
  patientChart,
  perioByFdi,
  PERIO_SITE_ORDER,
  sideFromFdi,
  universalFromFdi,
  type ArchView,
  type CariesChart,
  type CariesDecision,
  type CariesGrade,
  type CariesSurface,
  type CariesSurfaceAssessment,
  type CariesToothAssessment,
  type ChartHelp,
  type ChartLayerId,
  type ChartLayers,
  type ChartLayerSwatch,
  type ChartViewOption,
  type ChartViews,
  type EndoChart,
  type EndoFinding,
  type IconName,
  type ImplantChart,
  type ImplantFixture,
  type PatientAllergies,
  type PathologyOption,
  type PatientField,
  type PatientTab,
  type PerioChart,
  type PerioCondition,
  type PerioMeasure,
  type PerioSite,
  type PerioSiteReading,
  type PerioToothReading,
  type PostCoreChart,
  type RestorationChart,
  type RestorationKind,
  type RestorationOption,
  type RestorationPaintId,
  type ToothRestoration,
  type RailItem,
  type ToothPanelTabId,
  type Tooth,
} from '../data/patientChart.ts'
import dayjs from 'dayjs'

import { Icon } from '../components/Icon.tsx'
import { Rail } from '../components/Rail.tsx'
import { ArchGlyph } from './ArchGlyph.tsx'
import { CARIES_PAINT, ENDO_PAINT, IMPLANT_PAINT, POST_PAINT } from './toothScene.ts'
import { ToothArch3D, type ChartLayerVisibility, type RestorationMark } from './ToothArch.tsx'
import type { CariesStain } from './CariesLayer.tsx'
import { PatientDetailsDialog } from './PatientDetails.tsx'
import { ImagingPanel } from './PatientImaging.tsx'
import { AddTreatmentDialog, type TreatmentPlanLine } from './AddTreatmentDialog.tsx'
import { ToothHistoryList, ToothMedicationTable, type ToothAction } from './ToothRecordTabs.tsx'

// ─── PATIENT HEADER ───────────────────────────────────────────────────────

/**
 * The selected tab in the record nav: a top-lit tile rather than a tinted
 * label, so the current section is unmistakable in a row of seventeen.
 *
 * Both stops are DERIVED from palette tokens, never typed as hexes — the light
 * stop is `primary.main` lifted halfway to white, the dark stop is
 * `text.primary` itself, so a brand change carries the tile with it.
 *
 * ⚠ The stops are contrast-picked, not eyeballed. White on the light stop
 *   (#8094AA) is 3.14:1 — the 3:1 floor for the icon, which sits in the top
 *   third; white on the dark stop (#3D4A5C) is 9.0:1, and the label sits in the
 *   bottom half. Lightening the top stop further breaks the icon.
 *
 * ⚠ `applyStyles` is not optional here. Under `cssVariables`, `theme.palette`
 *   is frozen at `defaultColorScheme` (light), so `lighten(theme.palette…)`
 *   would emit light-derived stops in BOTH schemes — near-white on near-white
 *   under dark. The dark branch reads `colorSchemes.dark` explicitly.
 */
const SELECTED_TAB_SX = (theme: Theme) => {
  const darkPrimary = theme.colorSchemes.dark?.palette.primary.main ?? theme.palette.primary.main
  const tile = (from: string, to: string) => `linear-gradient(180deg, ${from} 0%, ${to} 100%)`

  return {
    color: theme.palette.common.white,
    backgroundImage: tile(lighten(theme.palette.primary.main, 0.5), theme.palette.text.primary),
    boxShadow: theme.shadows[2],
    // Selection is state, not an affordance — the tile does not re-shade under
    // the pointer, it is already the destination.
    cursor: 'default',
    ...theme.applyStyles('dark', {
      backgroundImage: tile(darken(darkPrimary, 0.35), darken(darkPrimary, 0.72)),
    }),
  }
}

/**
 * The patient rail: where you came from, where you can go, and who this is.
 *
 * Was a horizontal band across the top. Vertical suits it better — the record
 * has seventeen sections and six header fields, and a row could hold neither
 * without scrolling sideways or squeezing the name. It also hands the chart
 * the full height of the window, which is what the 3D arch actually wants.
 *
 * Order is deliberate and is the order a clinician reads in: the way OUT
 * first, then the section they are moving to, and only then the record they
 * are looking at. Identity sits under navigation rather than over it because
 * it is the thing that does not change while they work.
 */
/**
 * Not a section of its own: the patient's full details, opened from the link
 * under the allergies as a dialog OVER whichever section is up. It still has
 * an address (`#/details`), so a reload keeps it open and Back closes it.
 */
const DETAILS_SECTION = 'details'
/** What lies under the details when they are opened by address alone. */
const DEFAULT_SECTION = 'charts'

function PatientSidebar({
  activeTabId,
  onSelectTab,
  onOpenPatients,
  onOpenDetails,
}: {
  /**
   * Which section of the record is up, and the request to change it. Owned
   * above: the section is part of the URL, and it decides what stands to the
   * right of this sidebar — which itself stays put for every section.
   */
  activeTabId: string
  onSelectTab: (id: string) => void
  onOpenPatients: () => void
  onOpenDetails: () => void
}) {
  const { patient } = patientChart

  // Every section in one list, the practice's chosen ones (`primary`) first.
  const shownTabs = patient.tabs.filter((tab) => !tab.hidden)
  const orderedTabs = [
    ...shownTabs.filter((tab) => tab.primary),
    ...shownTabs.filter((tab) => !tab.primary),
  ]
  const scroller = useRef<HTMLDivElement>(null)
  // Which ends of the list still have rows past them, so each fade shows only
  // where there is actually more to scroll to.
  const [more, setMore] = useState({ above: false, below: false })

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const above = el.scrollTop > 1
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1
      setMore((prev) => (prev.above === above && prev.below === below ? prev : { above, below }))
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    // The window's height decides how many rows fit, so a resize can turn a
    // fade on or off without any scrolling.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [])

  /*
   * The list's own ends dissolve into the card where there is more past them.
   * That is the whole affordance now: every section is in the list, it simply
   * scrolls, and the fade says so — where a "More" button used to hide the
   * rest behind a click. A mask rather than a gradient overlay, so it fades the
   * rows themselves and never sits on top of one.
   */
  const fade = 'calc(var(--mui-spacing) * 8)'
  const mask = `linear-gradient(to bottom, ${
    more.above ? `transparent, #000 ${fade}` : '#000, #000'
  }, ${more.below ? `#000 calc(100% - ${fade}), transparent` : '#000'})`

  const [primaryAction, ...iconActions] = [
    ...patient.actions.filter((action) => action.primary),
    ...patient.actions.filter((action) => !action.primary),
  ]

  const renderTab = (tab: PatientTab) => {
    const active = tab.id === activeTabId
    return (
      <Tooltip
        key={tab.id}
        title={tab.available ? '' : patient.unavailableTabHint}
        placement="right"
        disableInteractive
      >
        {/* Unbuilt sections keep their button semantics and stay in the tab
            order — a keyboard user can reach them and hear the hint — but
            carry no handler, so Enter/Space and a click both do nothing.
            `aria-disabled` rather than `disabled` is deliberate: `disabled`
            drops the element from the tab order and kills the hover the
            tooltip hangs off. */}
        <Box>
          <ListItemButton
            selected={active}
            onClick={tab.available ? () => onSelectTab(tab.id) : undefined}
            aria-current={active ? 'page' : undefined}
            aria-disabled={tab.available ? undefined : true}
            disableRipple={!tab.available}
            sx={[
              {
                borderRadius: 1.5,
                mb: 0.5,
                // Roomier than a stock list row: these are the record's
                // top-level destinations, not items in a long list.
                px: 2,
                py: 1.5,
                gap: 1.5,
                color: 'text.secondary',
                cursor: tab.available ? 'pointer' : 'default',
              },
              // The same gradient tile the horizontal band used, kept so the
              // selected section reads identically after the move. `&&`
              // out-specifies MUI's own `.Mui-selected` rule, which would
              // otherwise paint its tint over the gradient.
              active && ((theme: Theme) => ({ '&&': SELECTED_TAB_SX(theme) })),
            ]}
          >
            <Icon name={tab.icon} size={20} />
            <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </Typography>
          </ListItemButton>
        </Box>
      </Tooltip>
    )
  }

  return (
    <Paper
      component="aside"
      elevation={0}
      sx={{
        width: 300,
        flexShrink: 0,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        // The sidebar itself never scrolls: the patient block is fixed and
        // only the tab region below it does.
        overflow: 'hidden',
      }}
    >
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 3, flexShrink: 0 }}>
        <Breadcrumbs
          aria-label="Breadcrumb"
          separator="/"
          sx={{
            '& .MuiBreadcrumbs-separator': { mx: 0.75, color: 'text.disabled' },
          }}
        >
          {/* The way back to the list this record was opened from. */}
          <ButtonBase
            onClick={onOpenPatients}
            sx={{
              gap: 0.5,
              borderRadius: 0.5,
              color: 'text.secondary',
              '&:hover, &.Mui-focusVisible': { color: 'primary.main' },
            }}
          >
            <Icon name="back" size={18} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {patient.breadcrumb.parent}
            </Typography>
          </ButtonBase>

          {/* The leaf is the patient's own name, read off the record rather
              than repeated in the dataset, so the two cannot drift apart. */}
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {patient.name}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* ── The patient ────────────────────────────────────────────────── */}
      {/* Who, then what you can do for them, then where to go in the record:
          the actions sit straight under the identity they act on, and the
          section navigation follows them. */}
      <Stack spacing={2} sx={{ px: 2.5, pb: 2, flexShrink: 0 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <PatientPhoto photo={patient.photo} initials={patient.initials} name={patient.name} />
          <Stack spacing={0.75} sx={{ minWidth: 0, alignItems: 'flex-start' }}>
            {/* `h5`, not the `h1` the band used: the name is still the heading
                of the record, but a 64px display size in a 300px column would
                wrap "Julia Smith" onto three lines. */}
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {patient.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {patient.idLabel} {patient.id}
              </Typography>
              <Chip label={patient.status} size="small" color="success" variant="outlined" />
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ alignItems: 'center' }}
            >
              {/* Word first, glyph after it — the word carries the meaning, so
                  the icon is decorative and hidden from screen readers. */}
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Typography variant="body2">{patient.sex.label}</Typography>
                <Box aria-hidden sx={{ display: 'flex', color: 'text.secondary' }}>
                  <Icon name={patient.sex.icon} size={16} />
                </Box>
              </Stack>
              {/* A bare date is not self-explanatory; it names itself on hover. */}
              <Tooltip title={patient.dateOfBirthLabel}>
                <Typography variant="body2">{patient.dateOfBirth}</Typography>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          {iconActions.map((action) => (
            <Tooltip key={action.id} title={action.label}>
              <IconButton
                aria-label={action.label}
                sx={{
                  width: 44,
                  height: 44,
                  color: 'primary.main',
                  border: (theme) => `1px solid ${theme.palette.primary.main}`,
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <Icon name={action.icon} size={20} />
              </IconButton>
            </Tooltip>
          ))}
          <Button
            variant="contained"
            aria-label={primaryAction.label}
            startIcon={<Icon name={primaryAction.icon} size={20} />}
            sx={{ flexGrow: 1, height: 44, '& .MuiButton-startIcon': { m: 0 } }}
          />
        </Stack>

        {/* Four fields in a two-column grid, read across in the record's own
            pairs: provider/phone, last/next visit — then the allergies across
            the full width. A column is 120px wide, so values may wrap rather
            than truncate — a clipped provider name is worse than a second
            line. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 2,
            rowGap: 2,
            pt: 0.5,
          }}
        >
          {patient.fields.map((field) => (
            <Field key={field.id} field={field} />
          ))}
          <Allergies allergies={patient.allergies} />
          {/* The sidebar is a digest; this leads to everything on file — the
              details open in a dialog over the record, and the section that
              was up stays as it is underneath. The arrow is the breadcrumb's
              own, turned to point onward. */}
          <Link
            component="button"
            variant="body2"
            underline="hover"
            onClick={onOpenDetails}
            aria-haspopup="dialog"
            sx={{
              gridColumn: '1 / -1',
              justifySelf: 'start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 500,
              textAlign: 'left',
            }}
          >
            {patient.fullDetails}
            <Box component="span" sx={{ display: 'flex', transform: 'rotate(180deg)' }}>
              <Icon name="back" size={18} />
            </Box>
          </Link>
        </Box>
      </Stack>

      <Divider />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      {/* The only scrolling region: every section, in one list. The patient
          block above stays put while it scrolls. */}
      <Box
        ref={scroller}
        sx={{
          flex: 1,
          minHeight: 0,
          px: 1.5,
          py: 2,
          overflowY: 'auto',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <List component="nav" aria-label="Patient record sections" disablePadding>
          {orderedTabs.map(renderTab)}
        </List>
      </Box>
    </Paper>
  )
}

function PatientPhoto({
  photo,
  initials,
  name,
}: {
  photo?: string
  initials: string
  name: string
}) {
  // One tile size for both states, so the header never reflows when a photo
  // lands on a record that had none.
  const tile = { width: 92, height: 92, borderRadius: 3 } as const

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      {photo ? (
        <Box
          component="img"
          src={photo}
          alt={`${name} — patient photo`}
          sx={{ ...tile, display: 'block', objectFit: 'cover' }}
        />
      ) : (
        <Box
          role="img"
          aria-label={`${name} — no photo on file`}
          sx={{
            ...tile,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            bgcolor: 'action.selected',
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          {initials}
        </Box>
      )}
      <IconButton
        aria-label="Upload photo"
        size="small"
        sx={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          color: 'common.white',
          bgcolor: 'rgba(61, 74, 92, 0.55)',
          '&:hover': { bgcolor: 'rgba(61, 74, 92, 0.75)' },
        }}
      >
        <PhotoCameraOutlined sx={{ fontSize: 15 }} />
      </IconButton>
    </Box>
  )
}

function Field({ field }: { field: PatientField }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" component="p" color="text.secondary" noWrap>
        {field.label}
      </Typography>
      {/* An `accent` value is a call to action ("Set date"), so it is a link
          — a real button underneath, since it opens something rather than
          navigating anywhere. */}
      {field.tone === 'accent' ? (
        <Link
          component="button"
          variant="body2"
          underline="hover"
          sx={{
            fontWeight: 500,
            textAlign: 'left',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {field.icon && <Icon name={field.icon} size={18} />}
          {field.value}
        </Link>
      ) : (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {field.value}
        </Typography>
      )}
    </Box>
  )
}

/**
 * The allergy flags, across both columns of the field grid, and their editor.
 *
 * Each allergen is its own chip carrying the alert glyph AND its name, in the
 * error colour: three signals, so the flag survives being seen in greyscale or
 * read aloud. The chip is the same small outlined one the status above uses.
 *
 * An empty list is written out rather than left blank — "none known" is a
 * recorded answer, and a blank would read as "nobody asked".
 *
 * The list is SEEDED from the dataset and then owned here, like the perio
 * readings: Edit opens a dialog over a draft copy, and nothing on the record
 * changes until Save. Dropping an allergy is the kind of edit that must never
 * happen by a stray click, which is why the checkboxes do not write straight
 * through — Cancel, Escape and a click outside all throw the draft away.
 */
function Allergies({ allergies }: { allergies: PatientAllergies }) {
  const [items, setItems] = useState(allergies.items)
  // The editor's working copy; `null` while it is closed.
  const [draft, setDraft] = useState<string[] | null>(null)
  const titleId = useId()

  // What the editor lists: the dataset's pick-list, plus anything already on
  // the record that the pick-list does not name — an allergy must not vanish
  // from the record just because the list never offered it.
  const options = [
    ...allergies.options,
    ...items.filter((item) => !allergies.options.includes(item)),
  ]
  // Held on the last saved list while the dialog fades out, so the boxes do
  // not all untick on the way.
  const checked = draft ?? items

  const toggle = (option: string) =>
    setDraft((current) => {
      const picked = current ?? items
      return picked.includes(option)
        ? picked.filter((item) => item !== option)
        : [...picked, option]
    })

  const close = () => setDraft(null)
  const save = () => {
    // Saved in the pick-list's order, not the order the boxes were ticked in.
    setItems(options.filter((option) => checked.includes(option)))
    close()
  }

  return (
    <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
      {/* The pencil stands right beside the word it edits, not across the
          row from it — at the far edge it read as belonging to the whole
          block of fields above. */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" component="p" color="text.secondary" noWrap>
          {allergies.label}
        </Typography>
        <Tooltip title={allergies.edit.title}>
          <IconButton
            size="small"
            aria-label={allergies.edit.title}
            onClick={() => setDraft(items)}
            // Pulled up into the label's line so the button does not push the
            // chips down by its own height.
            sx={{ my: -0.75, color: 'primary.main' }}
          >
            <Icon name={allergies.edit.icon} size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {items.length > 0 ? (
        <Stack
          component="ul"
          direction="row"
          sx={{ flexWrap: 'wrap', gap: 0.75, m: 0, mt: 0.75, p: 0, listStyle: 'none' }}
        >
          {items.map((allergen) => (
            <Box component="li" key={allergen} sx={{ display: 'flex' }}>
              <Chip
                label={allergen}
                size="small"
                color="error"
                variant="outlined"
                icon={<Icon name={allergies.icon} size={16} />}
                // Roomier than a stock small chip on both sides: the glyph and
                // the name were sitting tight against the outline.
                sx={{ px: 0.75 }}
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.75 }}>
          {allergies.none}
        </Typography>
      )}

      <Dialog
        open={draft !== null}
        onClose={close}
        aria-labelledby={titleId}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id={titleId}>{allergies.edit.title}</DialogTitle>
        {/* `dividers` because the list is longer than the dialog on a short
            window: the rules show where it scrolls under the title and the
            actions, which stay put. */}
        <DialogContent dividers>
          <Stack role="group" aria-labelledby={titleId}>
            {options.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox checked={checked.includes(option)} onChange={() => toggle(option)} />
                }
                label={option}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{allergies.edit.cancel}</Button>
          <Button variant="contained" onClick={save}>
            {allergies.edit.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ─── ODONTOGRAM ───────────────────────────────────────────────────────────

/**
 * The odontogram is the dentition in 3D and nothing else.
 *
 * The numbered grid of flat tooth rows this panel used to carry was removed:
 * both views drew the same 32 meshes out of `teeth.glb`, and the arch is the
 * one that shows where a tooth actually sits. What remains of the chart around
 * it is the mode row, the arch selector and the corner actions.
 */
/** A tooth with nothing recorded about its caries yet. */
const blankCaries = (fdi: number): CariesToothAssessment => ({
  fdi,
  surfaces: {},
  decision: null,
})

function ChartPanel() {
  const { title, odontogram } = patientChart
  // Which marks are drawn, and from where. Seeded from the dataset's own
  // `on` flags so the menu and the opening chart can never disagree.
  const [layers, setLayers] = useState(() => defaultChartLayers(odontogram.layers))
  const [viewId, setViewId] = useState(odontogram.views.activeId)

  const view =
    odontogram.views.options.find((option) => option.id === viewId) ??
    odontogram.views.options[0]

  /*
   * The menu's rule resolved into plain booleans for the scene.
   *
   * A parent overrules its children: `findings` off hides caries whatever the
   * caries row says. Settled here, where the menu's shape is known, so nothing
   * in the 3D has to carry a copy of that rule — it only gets told what to
   * draw. Memoised because it crosses into the canvas, where a fresh object
   * every render would churn the layers' own memos.
   */
  const show = useMemo(
    () => ({
      caries: layers.findings && layers.caries,
      implants: layers.treatments && layers.implants,
      rootCanals: layers.treatments && layers.rootCanals,
      postCore: layers.treatments && layers.postCore,
      measurements: layers.measurements,
      labels: layers.labels,
    }),
    [layers],
  )
  const [chartId, setChartId] = useState(odontogram.activeChartId)
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null)
  // The first-visit tip shows until dismissed once, on this browser.
  const [tipOpen, setTipOpen] = useState(() => !readTipSeen())
  const dismissTip = () => {
    setTipOpen(false)
    writeTipSeen()
  }
  const [archView, setArchView] = useState<ArchView>(odontogram.activeArchView)
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null)

  const showUpper = archView !== 'lower'
  const showLower = archView !== 'upper'

  // The perio tab does not swap the odontogram for a different chart — it
  // lays a second reading over the one already on screen. So the panel keeps
  // rendering the same dentition and just hands the arch its perio data.
  const perio = chartId === 'perio' ? odontogram.perio : null

  // The endo tab works exactly the same way: same dentition, same camera, with
  // the pulp turned on over it. "Similar view to Dental, plus the canals."
  const endo = chartId === 'endo' ? odontogram.endo : null
  // What a tooth click does on this tab — the last row of the chart help.
  const selectHint = perio?.hint ?? endo?.hint ?? null

  // Caries, by contrast, is NOT read off `chartId`. A lesion belongs to the
  // tooth rather than to one chart, so it is handed over unconditionally and
  // shows in every chart type.
  // Implants likewise: a fixture is hardware in the jaw, not a reading taken
  // for one chart, so it is drawn on every tab.
  const { implants, restorations } = odontogram

  /*
   * The teeth Reset has cleared of their charted lesion. The stain on the
   * model, the "Caries" badge, the card and the dot in the tooth list are all
   * read off the dataset's findings — so Reset, which empties the form, has to
   * take the finding off too, or the model goes on showing a lesion the record
   * no longer has. Everything below reads `caries`, never the dataset's own
   * list, so the model and the panel still answer from one lookup.
   *
   * What is entered for the tooth afterwards is a fresh assessment; the
   * cleared finding does not come back with it.
   */
  const [clearedCaries, setClearedCaries] = useState<number[]>([])
  const caries = useMemo(
    () =>
      clearedCaries.length === 0
        ? odontogram.caries
        : {
            ...odontogram.caries,
            findings: odontogram.caries.findings.filter(
              (finding) => !clearedCaries.includes(finding.fdi),
            ),
          },
    [odontogram.caries, clearedCaries],
  )

  const teeth = useMemo(
    () => [...(showUpper ? odontogram.upper : []), ...(showLower ? odontogram.lower : [])],
    [odontogram, showUpper, showLower],
  )

  // Derived here rather than inside the arch so the detail panel and the
  // stain on the model are answering from one lookup — a lesion described
  // against a tooth it was not drawn on is exactly the class of error the
  // dataset's single projection exists to prevent.
  const selectedTooth = teeth.find((tooth) => tooth.fdi === selectedFdi) ?? null
  const lesions = useMemo(() => cariesByFdi(caries), [caries])
  const fixtures = useMemo(() => implantsByFdi(implants), [implants])
  const selectedFixture = selectedTooth ? (fixtures.get(selectedTooth.fdi) ?? null) : null
  const canals = useMemo(() => (endo ? endoByFdi(endo) : null), [endo])
  const selectedCanals = selectedTooth ? (canals?.get(selectedTooth.fdi) ?? null) : null

  /**
   * The perio readings as they stand, SEEDED from the dataset and edited by
   * the panel. This is the one mutable clinical state on the screen: the arch
   * marks, the badges, the caption and the panel all read it, so an entry
   * shows up everywhere at once and none of them can drift.
   */
  const [perioReadings, setPerioReadings] = useState<PerioToothReading[]>(
    () => odontogram.perio.readings,
  )

  const perioReadingByFdi = useMemo(() => perioByFdi(perioReadings), [perioReadings])

  // The panel belongs to the perio chart alone: on the dental tab a tooth
  // selection means something else, and opening a probing form there would
  // invite readings to be entered against the wrong chart.
  const panelTooth = perio && selectedTooth ? selectedTooth : null

  /*
   * The caries assessments as they stand, SEEDED from the dataset and edited
   * by the dental panel — per surface, kept as each entry is made.
   */
  const [cariesAssessments, setCariesAssessments] = useState<CariesToothAssessment[]>(
    () => caries.assessments,
  )
  /*
   * The dental panel opens for ANY tooth picked on the Dental tab — the plain
   * chart, with neither overlay up. It used to open only for a tooth already
   * carrying a caries finding, but the panel now has the tooth rail, and a
   * rail that closed the panel on thirty of its thirty-two rows would be a
   * trap. A tooth with nothing recorded opens blank, ready to be charted.
   * Perio and endo have their own readings of a tooth; a tooth picked there
   * opens theirs, not this.
   */
  const cariesPanelTooth = !perio && !endo && selectedTooth ? selectedTooth : null
  const cariesPanelAssessment: CariesToothAssessment | null = cariesPanelTooth
    ? (cariesAssessments.find((entry) => entry.fdi === cariesPanelTooth.fdi) ??
      blankCaries(cariesPanelTooth.fdi))
    : null
  /** The tooth panel is open — on any chart type, for whichever tooth is picked. */
  const sidePanelOpen = Boolean(selectedTooth)
  /*
   * Which section of the tooth's record is up. Held here, above the panels,
   * because they remount on every tooth: someone stepping down the rail on
   * Medication should stay on Medication, not be put back on Overview each time.
   */
  const [toothTab, setToothTab] = useState<ToothPanelTabId>('general')

  /*
   * Which record is open inside the tooth panel — the level under the tooth's
   * overview. Held here because the arch follows it: a caries record outlines
   * its surface on the tooth, a perio record marks its probing site, and the
   * overview does neither. Keyed to the tooth AND the chart, so stepping to
   * another tooth, or switching chart, lands on that one's overview rather
   * than inside a record nobody opened.
   */
  const [openRecord, setOpenRecord] = useState<{
    fdi: number
    chartId: string
    kind: RecordKind
    /** Which record of that kind, where the tooth has several. */
    recordId?: string
  } | null>(null)

  /*
   * The restorations as they stand: SEEDED from the dataset, and added to by
   * the panel's own form. And the one being charted in that form right now —
   * a draft, kept apart from the list until it is saved.
   */
  const [restorationRecords, setRestorationRecords] = useState<ToothRestoration[]>(
    () => restorations.records,
  )
  const [restorationDraft, setRestorationDraft] = useState<RestorationDraft | null>(null)
  /*
   * Reset's part on the model: every surface painted on the tooth goes. The
   * arch is drawn from the record, so that means taking the tooth's
   * restorations off the record — the ones the dataset came with as much as
   * the ones charted here. Reset asks first wherever this removes anything.
   */
  const clearToothSurfaces = (fdi: number) =>
    setRestorationRecords((current) => current.filter((record) => record.fdi !== fdi))

  /*
   * What has been typed onto teeth through the panel's free-text line. A note
   * belongs to its tooth, not to a chart type, so it shows on that tooth's
   * overview whichever chart is up. Only ever appended to.
   */
  const [toothNotes, setToothNotes] = useState<{ fdi: number; text: string }[]>([])

  /*
   * What the MODEL draws — with a tooth in hand, that tooth and NOTHING else.
   * Every other tooth is taken off the model outright, not dimmed: no
   * neighbours in front of its mesial and distal surfaces, no opposing arch in
   * front of its biting surface, and the marks and number badges of the other
   * teeth go with them, since every layer draws only the teeth it is handed.
   *
   * `teeth` itself is left whole, because the rail in the panel still lists
   * every tooth and the cards beside the chart still name them — with the
   * others off the model, those are how another tooth is picked.
   */
  const sceneTeeth = useMemo(
    () => (selectedTooth ? [selectedTooth] : teeth),
    [teeth, selectedTooth],
  )

  /*
   * The crown surface in hand, held here rather than in the panel because the
   * arch shows it too — outlined on the tooth, with the camera turned to face
   * it. Keyed to its tooth, like the perio site: a newly opened tooth starts on
   * its own first recorded surface, not on the last one looked at elsewhere.
   */
  const [surfaceInHand, setSurfaceInHand] = useState<{
    fdi: number
    surface: CariesSurface
  } | null>(null)
  const activeSurface: CariesSurface | null =
    cariesPanelTooth && cariesPanelAssessment
      ? surfaceInHand?.fdi === cariesPanelTooth.fdi
        ? surfaceInHand.surface
        : (CARIES_SURFACE_ORDER.find((surface) => cariesPanelAssessment.surfaces[surface]) ??
          'occlusal')
      : null

  /** Change one tooth's assessment, creating its entry on the first edit. */
  const updateCaries = (
    fdi: number,
    change: (entry: CariesToothAssessment) => CariesToothAssessment,
  ) => {
    setCariesAssessments((current) =>
      current.some((entry) => entry.fdi === fdi)
        ? current.map((entry) => (entry.fdi === fdi ? change(entry) : entry))
        : [...current, change(blankCaries(fdi))],
    )
  }
  const editCariesSurface = (
    fdi: number,
    surface: CariesSurface,
    change: Partial<CariesSurfaceAssessment>,
  ) =>
    updateCaries(fdi, (entry) => ({
      ...entry,
      surfaces: {
        ...entry.surfaces,
        [surface]: {
          tissue: null,
          cavitation: null,
          grade: null,
          ...entry.surfaces[surface],
          ...change,
        },
      },
    }))
  /*
   * The notice raised when a decision is made — "Tooth 3R needs treatment".
   * `id` changes on every decision, which is what restarts the notice's timer
   * when a second one lands while the first is still up.
   */
  const [decisionNotice, setDecisionNotice] = useState<{
    id: number
    fdi: number
    decision: CariesDecision
  } | null>(null)
  const decideCaries = (fdi: number, decision: CariesDecision | null) => {
    updateCaries(fdi, (entry) => ({ ...entry, decision }))
    // Clearing a decision announces nothing — and takes down a notice that
    // would now be stating something no longer true.
    setDecisionNotice((current) =>
      decision ? { id: (current?.id ?? 0) + 1, fdi, decision } : null,
    )
  }
  const noticeOption = decisionNotice
    ? caries.panel.decisions.find((option) => option.id === decisionNotice.decision)
    : undefined

  /*
   * The grades each carious tooth carries, for its badge on the arch — read
   * from the same state the panel edits, so the two cannot disagree. Each
   * grade once, lowest first: the badge says how far the tooth's lesions have
   * got, not how many surfaces share a grade.
   */
  const cariesGrades = useMemo(
    () =>
      new Map(
        cariesAssessments.flatMap((entry) => {
          const grades = [
            ...new Set(
              Object.values(entry.surfaces).flatMap((surface) =>
                surface.grade ? [surface.grade] : [],
              ),
            ),
          ].sort()
          return grades.length > 0 ? [[entry.fdi, grades] as const] : []
        }),
      ),
    [cariesAssessments],
  )

  /*
   * What the model stains, surface by surface — the same state again, so the
   * picture is the form: a surface with anything entered for it is stained,
   * and the higher its grade the stronger the stain. The level runs from just
   * above 0 (something entered, no grade yet) to 1 (the last grade in the
   * panel's list), in equal steps — a drawing convention for "more severe",
   * not a measure of the lesion.
   */
  const cariesStains = useMemo(() => {
    const grades = caries.panel.grades.map((option) => option.id)
    return new Map(
      cariesAssessments.flatMap((entry) => {
        const stain: CariesStain = {}
        for (const surface of CARIES_SURFACE_ORDER) {
          const recorded = entry.surfaces[surface]
          if (!recorded || !(recorded.tissue || recorded.cavitation || recorded.grade)) continue
          stain[surface] =
            (recorded.grade ? grades.indexOf(recorded.grade) + 2 : 1) / (grades.length + 1)
        }
        return Object.keys(stain).length > 0 ? [[entry.fdi, stain] as const] : []
      }),
    )
  }, [cariesAssessments, caries.panel.grades])

  /*
   * Everything charted on the chart in view, one entry per record. Read from
   * the same projections the arch and the forms use, so a card can never name
   * a tooth the model does not mark. Only teeth on the arches currently shown,
   * in the order the tooth rail lists them.
   *
   * Two things are drawn from it: a tooth's own overview (every record on that
   * tooth) and the list down the chart's left edge (the `notable` ones).
   */
  /** What a restoration over the whole crown is said to cover, in place of surfaces. */
  const wholeCrownLabel = odontogram.toothPanel.history.wholeCrown
  const records = useMemo<ChartFinding[]>(() => {
    const onArch = new Map(teeth.map((tooth) => [tooth.fdi, tooth]))
    const list: ChartFinding[] = []

    if (perio) {
      for (const reading of perioReadings) {
        const tooth = onArch.get(reading.fdi)
        if (!tooth) continue
        const deepest = deepestSite(reading)
        list.push({
          key: `perio-${reading.fdi}`,
          fdi: reading.fdi,
          kind: 'perio',
          notable: deepest.reading.pocketDepth >= perio.flagDepth,
          swatch: 'pocket',
          title: `${perio.labels.pocket} ${deepest.reading.pocketDepth} ${perio.unit}`,
          detail: [
            perio.siteLabels[tooth.arch][deepest.site],
            deepest.reading.conditions.includes('bleeding') ? perio.labels.bleeding : null,
          ]
            .filter(Boolean)
            .join(' · '),
        })
      }
    } else if (endo) {
      for (const finding of endo.findings) {
        list.push({
          key: `endo-${finding.fdi}`,
          fdi: finding.fdi,
          kind: 'endo',
          notable: true,
          swatch: finding.status === 'needed' ? 'endo-needed' : 'endo-canal',
          title: endo.title,
          detail: `${finding.canals.length} ${endo.labels.canals.toLowerCase()} · ${
            endo.statusLabels[finding.status]
          }`,
        })
      }
    } else {
      // A tooth carries a caries record if the dataset charted a lesion on it
      // OR something has been entered for it in the form since.
      const assessed = new Map(
        cariesAssessments
          .filter((entry) => Object.keys(entry.surfaces).length > 0)
          .map((entry) => [entry.fdi, entry]),
      )
      for (const fdi of new Set([...lesions.keys(), ...assessed.keys()])) {
        const surfaces = new Set<CariesSurface>([
          ...(lesions.get(fdi) ?? []).flatMap((lesion) => lesion.surfaces),
          ...(Object.keys(assessed.get(fdi)?.surfaces ?? {}) as CariesSurface[]),
        ])
        list.push({
          key: `caries-${fdi}`,
          fdi,
          kind: 'caries',
          notable: true,
          swatch: 'caries',
          title: caries.legend.label,
          detail: [
            ...[...surfaces].map((surface) => caries.surfaceLabels[surface]),
            ...(cariesGrades.get(fdi) ?? []),
          ].join(' · '),
        })
      }
      // Existing work. A record of the tooth, not something needing attention:
      // on the tooth's own overview, not in the chart's list of findings.
      for (const restoration of restorationRecords) {
        list.push({
          key: `restoration-${restoration.id}`,
          fdi: restoration.fdi,
          kind: 'restoration',
          recordId: restoration.id,
          notable: false,
          swatch: restorations.swatch,
          title: restoration.name,
          // Where it is, then when it was placed — or, for one charted here
          // with no date, what it is made of.
          detail: [
            restoration.coverage === 'crown'
              ? wholeCrownLabel
              : restoration.surfaces
                  .map((surface) => {
                    const tooth = teeth.find((item) => item.fdi === restoration.fdi)
                    return tooth
                      ? cariesSurfaceLabel(caries, tooth, surface)
                      : caries.surfaceLabels[surface]
                  })
                  .join(', '),
            restoration.placedOn
              ? dayjs(restoration.placedOn).format(restorations.dateFormat)
              : restoration.material,
          ]
            .filter(Boolean)
            .join(' · '),
        })
      }
      for (const fixture of implants.fixtures) {
        list.push({
          key: `implant-${fixture.fdi}`,
          fdi: fixture.fdi,
          kind: 'implant',
          notable: true,
          swatch: 'implant',
          title: implants.legend.label,
          detail: `${fixture.diameter} × ${fixture.length} ${implants.unit}`,
        })
      }
    }

    return list
      .filter((record) => onArch.has(record.fdi))
      .sort((a, b) => universalFromFdi(a.fdi) - universalFromFdi(b.fdi))
  }, [
    teeth,
    perio,
    perioReadings,
    endo,
    lesions,
    caries,
    cariesAssessments,
    cariesGrades,
    restorations,
    restorationRecords,
    implants,
    wholeCrownLabel,
  ])
  /** The list down the chart's left edge. */
  const findings = useMemo(() => records.filter((record) => record.notable), [records])

  /*
   * The probing site in hand, held here rather than in the panel because the
   * arch shows it too — a dot on the gum line, with the camera turned to face
   * it. Keyed to its tooth: a new tooth starts back on the first site, since
   * carrying "disto-buccal" across would put the next keypress on a site
   * nobody chose.
   */
  const [siteInHand, setSiteInHand] = useState<{ fdi: number; site: PerioSite } | null>(null)
  const activeSite: PerioSite =
    panelTooth && siteInHand?.fdi === panelTooth.fdi ? siteInHand.site : PERIO_SITE_ORDER[0]
  const panelReading = panelTooth ? perioReadingByFdi.get(panelTooth.fdi) : undefined

  /**
   * Record one site — straight into the chart, as it was before the draft:
   * there is no Save step, every entry is kept as it is made, and the arch,
   * the badges and the pocket shading redraw from it at once.
   *
   * Only ever touches the tooth and site named — a probing sequence edits one
   * site at a time, and rewriting a whole tooth from the panel would silently
   * carry stale values for the five sites not in hand.
   */
  const editPerioSite = (fdi: number, site: PerioSite, change: Partial<PerioSiteReading>) => {
    setPerioReadings((current) =>
      current.map((reading) =>
        reading.fdi === fdi
          ? { ...reading, sites: { ...reading.sites, [site]: { ...reading.sites[site], ...change } } }
          : reading,
      ),
    )
  }

  // ── The tooth panel: its overview, and whichever record is open in it ──
  const openKind: RecordKind | null =
    selectedTooth && openRecord?.fdi === selectedTooth.fdi && openRecord.chartId === chartId
      ? openRecord.kind
      : null
  const openToothRecord = (kind: RecordKind | null, recordId?: string) =>
    setOpenRecord(
      kind && selectedTooth ? { fdi: selectedTooth.fdi, chartId, kind, recordId } : null,
    )

  /*
   * What the model marks for a restoration: the surfaces of the one being
   * charted, as they are ticked, or of the one that is open. Each is washed
   * grey the moment it is picked, and painted in the restoration's own colour
   * once there is one — the sealant's teal, or the composite's blue as soon as
   * that material is chosen. A crown asks for no surfaces, so it marks none.
   */
  const openRestoration =
    openKind === 'restoration'
      ? restorationRecords.find((record) => record.id === openRecord?.recordId)
      : undefined
  const draftInHand =
    openKind === 'newRestoration' && restorationDraft?.fdi === selectedTooth?.fdi
      ? restorationDraft
      : null
  const restorationMarks = useMemo(() => {
    if (draftInHand) {
      const kind = restorations.form.types.find((option) => option.id === draftInHand.typeId)
      const coverage = kind?.coverage ?? 'surfaces'
      const paint = restorationPaint(restorations, draftInHand)
      return {
        coverage,
        surfaces: draftInHand.surfaces,
        paint,
        active: draftInHand.focus,
        // Ticked surfaces show the moment they are ticked. A whole crown has
        // nothing to tick, so it shows once there is a material to show it
        // as — which is also what lets Reset take the tooth back to bare:
        // with no surface ticked and no material chosen, nothing is drawn.
        draw: coverage === 'surfaces' || paint !== null,
      }
    }
    // One already on the record is drawn by the layer below; here it only
    // turns the view to its first surface.
    if (openRestoration) {
      return {
        coverage: openRestoration.coverage ?? 'surfaces',
        surfaces: openRestoration.surfaces,
        paint: openRestoration.paint ?? null,
        active: openRestoration.surfaces[0] ?? null,
        draw: false,
      }
    }
    return null
  }, [draftInHand, openRestoration, restorations])

  /*
   * Every restoration on the record, for the model to draw on its tooth. This
   * is what makes Save show: the record gains an entry, and the arch is drawn
   * from the record. On the Dental chart only — where restorations are
   * charted — and under the Treatments layer with the other things placed in
   * the mouth.
   */
  const restorationLayer = useMemo<RestorationMark[]>(
    () =>
      perio || endo || !layers.treatments
        ? []
        : restorationRecords.map((record) => ({
            key: record.id,
            fdi: record.fdi,
            coverage: record.coverage ?? 'surfaces',
            surfaces: record.surfaces,
            paint: record.paint ?? null,
          })),
    [restorationRecords, perio, endo, layers.treatments],
  )

  const toothRecords = selectedTooth
    ? records.filter((record) => record.fdi === selectedTooth.fdi)
    : []

  /*
   * Which teeth the panel's tooth list dots. First, per chart, the ones that
   * already carry what that chart records — blue on Perio, the colour the
   * probing marks have on the arch, for every tooth that has readings. Then,
   * on every chart, a grey dot for the implant sites: hardware in the jaw is
   * true of the tooth whichever chart is up.
   */
  const railFlags: RailFlag[] = [
    perio
      ? {
          id: 'perio',
          teeth: new Set(perioReadings.map((reading) => reading.fdi)),
          label: odontogram.toothPanel.railFlags.perio,
          tone: 'info',
        }
      : endo
        ? {
            id: 'endo',
            teeth: new Set(endo.findings.map((finding) => finding.fdi)),
            label: odontogram.toothPanel.railFlags.endo,
            tone: 'error',
          }
        : {
            id: 'dental',
            teeth: new Set(
              records.filter((record) => record.kind === 'caries').map((record) => record.fdi),
            ),
            label: odontogram.toothPanel.railFlags.dental,
            tone: 'warning',
          },
    {
      id: 'implant',
      teeth: new Set(implants.fixtures.map((fixture) => fixture.fdi)),
      label: odontogram.toothPanel.railFlags.implant,
      tone: 'neutral',
    },
  ]

  /** "Save" on a record: entries are already kept, so it is the way back. */
  const saveButton = (
    <Button
      variant="contained"
      startIcon={<Icon name="check" size={18} />}
      onClick={() => openToothRecord(null)}
      sx={{ flex: '1 1 0', py: 1.25 }}
    >
      {odontogram.toothPanel.actions.save}
    </Button>
  )

  /*
   * The History tab: the actions marked on the tooth in hand.
   *
   * Not a second record kept beside the chart — it is READ off it. A tooth
   * marked for treatment has one open action, described from its assessment as
   * that stands now, so the card can never disagree with the form it came
   * from. Ticking it Done is the one thing that needs remembering: the
   * description is frozen as it was, kept in `completedActions`, and the mark
   * comes off the tooth — the treatment is no longer something to be done.
   *
   * Unticking puts the mark back, unless the tooth has been marked afresh in
   * the meantime; then the newer mark stands and the old entry simply goes.
   */
  const [completedActions, setCompletedActions] = useState<
    { id: string; fdi: number; decision: CariesDecision; label: string; summary: string }[]
  >([])
  const decisionLabel = (decision: CariesDecision) =>
    caries.panel.decisions.find((option) => option.id === decision)?.label ?? decision

  /*
   * "Add treatment" on a carious lesion: a dialog over the chart, in which the
   * procedure is chosen. Saving it is what marks the tooth for treatment — the
   * mark, the notice and the History entry all follow from that one decision,
   * as they did when the button set the mark directly.
   *
   * `key` goes up by one per opening, so each opening starts with empty fields;
   * `open` alone goes false on closing, so the dialog keeps its words while it
   * fades. The tooth and surface are fixed at opening for the same reason.
   */
  const [treatmentDialog, setTreatmentDialog] = useState<{
    key: number
    open: boolean
    fdi: number
    toothLine: string
    surface: string
  } | null>(null)
  const closeTreatmentDialog = () =>
    setTreatmentDialog((current) => (current ? { ...current, open: false } : current))
  // The plan line last saved for each tooth: what its History entry is named by.
  const [treatmentPlans, setTreatmentPlans] = useState<
    { fdi: number; line: TreatmentPlanLine }[]
  >([])
  const actionLabel = (fdi: number, decision: CariesDecision) => {
    const procedure = treatmentPlans.find((plan) => plan.fdi === fdi)?.line.procedure
    return decision === 'treat' && procedure
      ? `${decisionLabel(decision)} · ${procedure.code} ${procedure.name}`
      : decisionLabel(decision)
  }
  const selectedAssessment = selectedTooth
    ? cariesAssessments.find((entry) => entry.fdi === selectedTooth.fdi)
    : undefined
  /*
   * A restoration charted through the panel is an action on the tooth too, so
   * it goes on the tooth's History the moment it is saved — named for its
   * kind, with what it covers and what it is made of. Only the ones charted
   * here: a restoration that came with the record carries the date it was
   * placed and is already in the dated updates below the actions.
   */
  const [doneRestorations, setDoneRestorations] = useState<string[]>([])
  const restorationActions: ToothAction[] = selectedTooth
    ? restorationRecords
        .filter((record) => record.fdi === selectedTooth.fdi && !record.placedOn)
        .map((record) => ({
          id: `restoration-${record.id}`,
          label: record.name,
          summary: [
            `${universalFromFdi(record.fdi)}${sideFromFdi(record.fdi)}`,
            record.coverage === 'crown'
              ? odontogram.toothPanel.history.wholeCrown
              : record.surfaces.length > 0
                ? record.surfaces
                    .map((surface) => cariesSurfaceLabel(caries, selectedTooth, surface))
                    .join(', ')
                : odontogram.toothPanel.history.noSurfaces,
            record.material,
            record.quality,
            record.detail,
          ]
            .filter(Boolean)
            .join(' · '),
          done: doneRestorations.includes(record.id),
        }))
        // Newest first.
        .reverse()
    : []

  const toothActions: ToothAction[] = selectedTooth
    ? [
        ...restorationActions,
        ...(selectedAssessment?.decision
          ? [
              {
                id: `open-${selectedTooth.fdi}`,
                label: actionLabel(selectedTooth.fdi, selectedAssessment.decision),
                summary: cariesActionSummary(
                  caries,
                  selectedTooth,
                  selectedAssessment,
                  odontogram.toothPanel.history.noSurfaces,
                ),
                done: false,
              },
            ]
          : []),
        // Newest first, under the open one.
        ...completedActions
          .filter((action) => action.fdi === selectedTooth.fdi)
          .map((action) => ({
            id: action.id,
            label: action.label,
            summary: action.summary,
            done: true,
          }))
          .reverse(),
      ]
    : []
  const toggleActionDone = (id: string) => {
    // A restoration's Done is only a tick on its card: it is already on the
    // record and on the model, so there is nothing else to change.
    if (id.startsWith('restoration-')) {
      const recordId = id.slice('restoration-'.length)
      setDoneRestorations((current) =>
        current.includes(recordId)
          ? current.filter((item) => item !== recordId)
          : [...current, recordId],
      )
      return
    }
    const completed = completedActions.find((action) => action.id === id)
    if (completed) {
      setCompletedActions((current) => current.filter((action) => action.id !== id))
      const standing = cariesAssessments.find((entry) => entry.fdi === completed.fdi)?.decision
      if (!standing) decideCaries(completed.fdi, completed.decision)
      return
    }
    if (!selectedTooth || !selectedAssessment?.decision) return
    const { decision } = selectedAssessment
    setCompletedActions((current) => [
      ...current,
      {
        // Only ever appended, so the count is a stable, unique suffix.
        id: `done-${selectedTooth.fdi}-${current.length}`,
        fdi: selectedTooth.fdi,
        decision,
        // Frozen with the summary: a later plan for the tooth must not rename it.
        label: actionLabel(selectedTooth.fdi, decision),
        summary: cariesActionSummary(
          caries,
          selectedTooth,
          selectedAssessment,
          odontogram.toothPanel.history.noSurfaces,
        ),
      },
    ])
    decideCaries(selectedTooth.fdi, null)
  }

  /** The open record: its name, its form or detail, and its actions. */
  const toothRecord = ((): OpenToothRecord | null => {
    if (!selectedTooth || !openKind) return null
    if (openKind === 'caries' && cariesPanelAssessment && activeSurface) {
      return {
        title: caries.legend.label,
        body: (
          <CariesForm
            tooth={selectedTooth}
            caries={caries}
            assessment={cariesPanelAssessment}
            activeSurface={activeSurface}
            onSurfaceChange={(surface) => setSurfaceInHand({ fdi: selectedTooth.fdi, surface })}
            onEditSurface={editCariesSurface}
          />
        ),
        footer: (
          <>
            {/* Opens the treatment dialog; saving THAT marks the tooth for
                treatment and says so in a notice. A plain action, not a
                toggle: it shows no pressed state, and the mark is taken off
                again from the History tab, by ticking it Done. */}
            <Button
              variant="outlined"
              onClick={() =>
                setTreatmentDialog((current) => ({
                  key: (current?.key ?? 0) + 1,
                  open: true,
                  fdi: selectedTooth.fdi,
                  // Both notations and the type, as the panel's own heading.
                  toothLine: [
                    `${odontogram.toothPanel.titlePrefix} ${universalFromFdi(selectedTooth.fdi)}${sideFromFdi(selectedTooth.fdi)}`,
                    `FDI ${selectedTooth.fdi}`,
                    odontogram.model.typeLabels[selectedTooth.type],
                  ].join(' · '),
                  surface: cariesSurfaceLabel(caries, selectedTooth, activeSurface),
                }))
              }
              sx={{ flex: '1 1 0', py: 1.25 }}
            >
              {odontogram.toothPanel.actions.addTreatment}
            </Button>
            {saveButton}
          </>
        ),
        // Back to nothing recorded for the tooth: every surface and the mark
        // for treatment, and the notice that would now be stating it — and a
        // bare tooth on the model: no stain, no badge, no painted surfaces.
        onReset: () => {
          updateCaries(selectedTooth.fdi, () => blankCaries(selectedTooth.fdi))
          setClearedCaries((current) =>
            current.includes(selectedTooth.fdi) ? current : [...current, selectedTooth.fdi],
          )
          clearToothSurfaces(selectedTooth.fdi)
          setDecisionNotice(null)
          setTreatmentPlans((current) =>
            current.filter((plan) => plan.fdi !== selectedTooth.fdi),
          )
        },
      }
    }
    if (openKind === 'perio' && perio) {
      return {
        title: perio.labels.pocket,
        body: (
          <PerioForm
            tooth={selectedTooth}
            perio={perio}
            reading={panelReading}
            activeSite={activeSite}
            onSiteChange={(site) => setSiteInHand({ fdi: selectedTooth.fdi, site })}
            onEdit={editPerioSite}
          />
        ),
        footer: saveButton,
        // Back to the readings the record came with. Not to zeros, and not to
        // "never probed": either would state something about the tooth that
        // nobody recorded.
        onReset: panelReading
          ? () => {
              const original = odontogram.perio.readings.find(
                (reading) => reading.fdi === selectedTooth.fdi,
              )
              if (!original) return
              setPerioReadings((current) =>
                current.map((reading) => (reading.fdi === original.fdi ? original : reading)),
              )
            }
          : undefined,
      }
    }
    if (openKind === 'implant' && selectedFixture) {
      return {
        title: implants.legend.label,
        body: <ImplantDetail tooth={selectedTooth} fixture={selectedFixture} implants={implants} />,
      }
    }
    if (openKind === 'restoration') {
      const restoration = restorationRecords.find(
        (record) => record.id === openRecord?.recordId && record.fdi === selectedTooth.fdi,
      )
      if (!restoration) return null
      // Read-only: what it is, where, and whatever else is on record for it.
      // A row is shown only when there is something to put in it.
      const rows: [string, string | undefined][] = [
        [
          restorations.labels.surfaces,
          restoration.surfaces
            .map((surface) => cariesSurfaceLabel(caries, selectedTooth, surface))
            .join(', ') || undefined,
        ],
        [restorations.labels.material, restoration.material],
        [restorations.labels.quality, restoration.quality],
        [restorations.labels.detail, restoration.detail],
        [restorations.labels.crownType, restoration.crownType],
        [restorations.labels.crownBase, restoration.crownBase],
        [
          restorations.labels.placed,
          restoration.placedOn && dayjs(restoration.placedOn).format(restorations.dateFormat),
        ],
        [restorations.labels.provider, restoration.provider],
      ]
      return {
        title: restoration.name,
        body: (
          <Stack spacing={0.75}>
            {rows.map(([label, value]) =>
              value ? <DetailRow key={label} label={label} value={value} /> : null,
            )}
          </Stack>
        ),
      }
    }
    if (openKind === 'newRestoration' && restorationDraft?.fdi === selectedTooth.fdi) {
      const { form } = restorations
      const kind = form.types.find((option) => option.id === restorationDraft.typeId)
      if (!kind) return null
      const labelOf = (options: RestorationOption[], id: string | null) =>
        options.find((option) => option.id === id)?.label
      return {
        // The kind picked from the menu heads the form.
        title: kind.label,
        body: (
          <RestorationForm
            tooth={selectedTooth}
            caries={caries}
            restorations={restorations}
            kind={kind}
            draft={restorationDraft}
            onChange={(change) =>
              setRestorationDraft((current) => (current ? { ...current, ...change } : current))
            }
          />
        ),
        footer: (
          // Here Save does save: it is what turns the draft into a record on
          // the tooth. Leaving by Back instead drops the draft.
          <Button
            variant="contained"
            startIcon={<Icon name="check" size={18} />}
            onClick={() => {
              setRestorationRecords((current) => [
                ...current,
                {
                  // Only ever appended, so the count is a stable, unique suffix.
                  id: `charted-${current.length}`,
                  fdi: restorationDraft.fdi,
                  name: kind.label,
                  surfaces: restorationDraft.surfaces,
                  paint: restorationPaint(restorations, restorationDraft) ?? undefined,
                  coverage: kind.coverage,
                  material: labelOf(form.materials, restorationDraft.material),
                  quality: labelOf(form.qualities, restorationDraft.quality),
                  detail: labelOf(form.details, restorationDraft.detail),
                  crownType: labelOf(form.crownTypes, restorationDraft.crownType),
                  crownBase: labelOf(form.crownBases, restorationDraft.crownBase),
                },
              ])
              setRestorationDraft(null)
              openToothRecord(null)
            }}
            sx={{ flex: '1 1 0', py: 1.25 }}
          >
            {odontogram.toothPanel.actions.save}
          </Button>
        ),
        // Empties the form, and clears the model with it: the surfaces ticked
        // here and those painted by restorations already on the tooth.
        onReset: () => {
          clearToothSurfaces(restorationDraft.fdi)
          setRestorationDraft((current) =>
            current
              ? {
                  ...current,
                  // Back to what the kind opens with, not to nothing.
                  surfaces: kind.defaultSurfaces,
                  focus: kind.defaultSurfaces[0] ?? null,
                  material: null,
                  quality: null,
                  detail: null,
                  crownType: null,
                  crownBase: null,
                }
              : current,
          )
        },
        // The form itself has kept nothing, so emptying it needs no question —
        // unless the tooth carries restorations that Reset would take off too.
        confirmReset: restorationRecords.some((record) => record.fdi === restorationDraft.fdi),
      }
    }
    if (openKind === 'endo' && endo && selectedCanals) {
      return {
        title: endo.title,
        body: <EndoDetail tooth={selectedTooth} finding={selectedCanals} endo={endo} />,
      }
    }
    return null
  })()

  return (
      <Paper
        component="section"
        // The visible title gave way to the chart tabs; the section keeps it
        // as its accessible name.
        aria-label={title}
        elevation={0}
        sx={{
          // 20px to the card's edge above and below, 32px at the sides — the
          // control strip and the legend stand in the bottom corners, and 20px
          // there read as flush against the edge.
          py: 2.5,
          px: 4,
          position: 'relative',
          // The model layer bleeds out past the padding to the card's edges;
          // this is what trims it back to the rounded corner. `clip` rather
          // than `hidden` so the card can never be scrolled sideways by focus
          // landing on an aside that runs past its edge.
          overflow: 'clip',
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
        }}
      >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          position: 'relative',
          zIndex: 1,
          alignItems: 'center',
          // The header's one in-flow child is the group on the right; the
          // finding cards are hung from the row's top-left corner.
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          // While the cards are up, the group keeps clear of their column and
          // wraps onto a second line in a narrow window rather than running
          // under them.
          // A tooth panel now runs the full height of the card, so the same
          // goes for it: the group stays clear of the panel's width too.
          pl: sidePanelOpen
            ? PAST_TOOTH_PANEL
            : findings.length > 0
              ? (theme) => `calc(${FINDING_CARD_WIDTH}px + ${theme.spacing(2)})`
              : 0,
        }}
      >
        {/*
          The finding cards: one compact card per finding on the chart in
          view, each opening its tooth. They stand where the chart tabs used
          to — hung from the top-left of this header row and running down over
          the model, which is why they live here rather than on the layer
          below, which only starts under the row.

          Out of the way while a tooth panel is open: the panel takes that
          corner, and it has the tooth list for moving between teeth.
        */}
        {!sidePanelOpen && findings.length > 0 && (
          <Box
            component="ul"
            aria-label={odontogram.findingCards.label}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: FINDING_CARD_WIDTH,
              // Stops short of the control strip in the bottom-left corner,
              // and scrolls inside itself past that.
              maxHeight: (theme) => `calc(100vh - ${theme.spacing(FINDING_CARDS_CLEARANCE_UNITS)})`,
              overflowY: 'auto',
              // Room for the cards' shadows inside the scroller.
              m: -0.5,
              p: 0.5,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {findings.map((finding) => (
              <FindingCard
                key={finding.key}
                finding={finding}
                toothPrefix={odontogram.findingCards.toothPrefix}
                selected={finding.fdi === selectedFdi}
                onOpen={() => setSelectedFdi(finding.fdi)}
              />
            ))}
          </Box>
        )}

        {/*
          Everything in the header sits on the right: the two menus, then —
          outermost — which reading of the arch is on screen. The left is left to the finding
          cards below, which start level with this row.

          `stretch`, so the chart switch is exactly as tall as the menus.
        */}
        <Stack
          direction="row"
          sx={{ ml: 'auto', gap: 1.5, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <ChartLayersMenu layers={odontogram.layers} state={layers} onChange={setLayers} />
          <ViewMenu
            views={odontogram.views}
            active={view}
            onChange={(id) => {
              setViewId(id)
              /*
               * Picking a standing view is a step BACK to the whole arch, so
               * it lets go of any tooth. That also does the camera work: the
               * flight home is already what a deselect orders, and it aims
               * along whichever direction is current — so the view change and
               * the return are one glide rather than two fighting each other.
               */
              setSelectedFdi(null)
            }}
          />

          {/*
            The chart type, as one segmented control — three readings of the
            SAME dentition, of which exactly one is up.

            The selection deliberately SURVIVES the change. Changing chart type
            must leave the 3D exactly where it was, and the camera flies home
            whenever the selection is dropped — so clearing here would read as
            a deselect and throw the view away on every switch. Each chart is a
            different reading of the same tooth: the tooth panel simply changes
            around a tooth that stays picked.
          */}
          <ToggleButtonGroup
            exclusive
            value={chartId}
            // `null` is the pressed segment being pressed again; one chart is
            // always up, so that is ignored rather than leaving none.
            onChange={(_, id: string | null) => {
              if (id) setChartId(id)
            }}
            aria-label="Chart type"
            sx={{ bgcolor: 'background.paper' }}
          >
            {odontogram.charts.map((chart) => (
              <ToggleButton
                key={chart.id}
                value={chart.id}
                disabled={!chart.enabled}
                sx={{
                  px: 1.5,
                  // The menus' own vertical padding, so the switch keeps their
                  // height when the group wraps and nothing stretches it.
                  py: 1.25,
                  gap: 0.5,
                  textTransform: 'none',
                  color: 'text.secondary',
                  // The chart in view: darker and bold as well as tinted, so the
                  // choice does not rest on the grey fill alone.
                  '&.Mui-selected': { color: 'text.primary', fontWeight: 700 },
                }}
              >
                {chart.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

      </Stack>

      {/*
        The model gets the WHOLE card, behind everything else.

        It used to be a row in the column, which left it only what the header
        and the footer did not want — 526px of a 738px card, with the arch cut
        off top and bottom. Taking it out of the column hands the camera the
        whole card instead.

        `inset: 0` really is the full white background: an absolutely
        positioned box lays out against its ancestor's PADDING box, and the
        Paper has no border, so that box IS the card — the padding insets
        children in the flow, not this one. Cancelling the padding with a
        negative inset overshoots and quietly throws the model off
        centre inside a canvas the card then has to clip.

        Everything else — the header and the asides — floats over it on
        `zIndex: 1`.
      */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          display: 'flex',
        }}
      >
        <ArchModel
          teeth={sceneTeeth}
          selectedFdi={selectedFdi}
          perio={perio}
          perioReadings={perioReadings}
          caries={caries}
          cariesGrades={cariesGrades}
          cariesStains={cariesStains}
          implants={implants}
          endo={endo}
          postCore={odontogram.postCore}
          /*
           * Keyed off the SELECTION, not off the perio panel. Centring on the
           * tooth you just picked is how the model behaves on every chart —
           * only the panel that opens beside it is perio's. The selection
           * survives a tab change, so switching charts orders no flight and
           * the view survives intact.
           */
          focusFdi={selectedTooth?.fdi ?? null}
          // The arch follows the record that is open, not the tooth alone: a
          // tooth's overview marks no site and outlines no surface.
          focusSite={panelTooth && openKind === 'perio' ? activeSite : null}
          focusSurface={openKind === 'caries' ? activeSurface : null}
          surfaceMarks={restorationMarks}
          restorations={restorationLayer}
          // Relative to the framed distance. Half of it: a picked tooth is the
          // subject of the screen, so the camera goes right up to it — the
          // tooth and its badge fill the height, with a neighbour or two either
          // side for bearings. It was 0.85, a small step in that still showed
          // most of the arch.
          zoom={selectedTooth ? 0.5 : 1}
          // The panel covers the canvas's left edge; the model slides over so
          // the tooth is centred in what can still be seen.
          coveredLeft={sidePanelOpen ? TOOTH_PANEL_WIDTH : 0}
          viewDirection={view.direction}
          show={show}
          onSelect={setSelectedFdi}
        />
      </Box>

      {/*
        Floated OVER the arch, not beside it, and the full height of the card
        — the same box the canvas has. As a column in a row it stole width
        from the model and squeezed the chart into whatever was left;
        overlaying keeps the canvas at full size underneath, and the model
        slides itself clear (`coveredLeft` above). `elevation` rather than a
        border, because the thing it has to say is that it is above the
        model, not part of it.

        A child of the CARD, not of the aside layer below: that layer starts
        under the header and inside the card's padding, and the panel has to
        reach all four of the card's edges on its side.
      */}
      {selectedTooth && (
        <Box sx={TOOTH_PANEL_SLOT_SX}>
          <ToothPanel
            // Remounting on the tooth and the chart resets what a form keeps
            // to itself — which perio measurement is in hand, say. Carrying
            // "recession" across to the next tooth would put the next keypress
            // on a measure nobody chose.
            key={`${chartId}-${selectedTooth.fdi}`}
            tooth={selectedTooth}
            teeth={teeth}
            tab={toothTab}
            onTabChange={setToothTab}
            flags={railFlags}
            records={toothRecords}
            onOpenRecord={openToothRecord}
            overviewNote={
              // "Not yet probed" is a fact about the tooth, said on its
              // overview — never left to be read off an empty list.
              perio && !panelReading ? (
                <Alert severity="info" variant="outlined">
                  <AlertTitle sx={{ fontWeight: 700 }}>{perio.panel.unprobedTitle}</AlertTitle>
                  {perio.panel.unprobedBody}
                </Alert>
              ) : undefined
            }
            record={toothRecord}
            notes={toothNotes.filter((note) => note.fdi === selectedTooth.fdi).map((note) => note.text)}
            onAddNote={(text) =>
              setToothNotes((current) => [...current, { fdi: selectedTooth.fdi, text }])
            }
            // The one pathology there is a form to start from scratch: caries,
            // on the Dental chart. Probing cannot be started on a tooth with
            // no readings yet, and endo has no form at all.
            sections={{
              medication: <ToothMedicationTable fdi={selectedTooth.fdi} />,
              history: (
                <ToothHistoryList
                  fdi={selectedTooth.fdi}
                  actions={toothActions}
                  onToggleDone={toggleActionDone}
                />
              ),
            }}
            restorationKinds={{
              label: restorations.form.typesLabel,
              options: restorations.form.types,
            }}
            // Restorations are charted on the Dental chart, where they show.
            onAddRestoration={
              cariesPanelTooth
                ? (kind) => {
                    setRestorationDraft({
                      fdi: cariesPanelTooth.fdi,
                      typeId: kind.id,
                      // What this kind opens with — a veneer's buccal face;
                      // nothing for the others.
                      surfaces: kind.defaultSurfaces,
                      focus: kind.defaultSurfaces[0] ?? null,
                      material: null,
                      quality: null,
                      detail: null,
                      crownType: null,
                      crownBase: null,
                    })
                    openToothRecord('newRestoration', kind.id)
                  }
                : undefined
            }
            // On the Dental chart the button offers the kinds of pathology;
            // caries is the one with a form. On Perio there is one thing to
            // record, so it opens straight away.
            pathologyKinds={odontogram.toothPanel.pathologies}
            onPickPathology={
              cariesPanelTooth
                ? (kind) => {
                    if (kind.id === 'caries') openToothRecord('caries')
                  }
                : undefined
            }
            onAddPathology={perio && panelReading ? () => openToothRecord('perio') : undefined}
            onClose={() => setSelectedFdi(null)}
            onSelectTooth={setSelectedFdi}
          />
        </Box>
      )}

      {/*
        The layer the asides sit on. Fills the card under the header — there
        is no footer row any more, so the model's controls and the legend sit
        in its bottom corners — but it is TRANSPARENT TO THE POINTER, or it would swallow every drag meant
        for the model now underneath it. Each child that is actually
        interactive turns pointer events back on for itself.
      */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/*
          The RIGHT edge, top to bottom: the finding for whichever tooth is in
          hand, then — pinned to the bottom corner — the legend that explains
          the marks. Stacked rather than overlaid, so a finding can never cover
          the legend; the findings scroll inside whatever height it leaves.
        */}
        <Stack
          spacing={2}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            maxWidth: 300,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              minHeight: 0,
              overflowY: 'auto',
              alignItems: 'flex-end',
              pointerEvents: 'auto',
              // A step of air under the menus, so the first card does not
              // butt against them.
              pt: 1,
            }}
          >
            {/*
              The decision notice, first in the column: directly under the
              Chart Layers and View menus. A Snackbar for what it does —
              times out, pauses while hovered or focused, closes on Escape —
              but taken out of its fixed viewport corner (`position: static`)
              so it sits in this column and pushes the cards below it down
              rather than covering them.
            */}
            {decisionNotice && noticeOption && (
              <Snackbar
                key={decisionNotice.id}
                open
                autoHideDuration={6000}
                // Only the timer, Escape or the close button dismiss it — a
                // click elsewhere is someone carrying on charting.
                onClose={(_, reason) => {
                  if (reason !== 'clickaway') setDecisionNotice(null)
                }}
                sx={{ position: 'static', transform: 'none', width: '100%' }}
              >
                <Alert
                  // `status`, not the stock `alert`: it confirms something the
                  // user just did, so it should be read out politely.
                  role="status"
                  severity={decisionNotice.decision === 'treat' ? 'warning' : 'info'}
                  variant="outlined"
                  onClose={() => setDecisionNotice(null)}
                  slotProps={{ closeButton: { 'aria-label': caries.panel.dismissNotice } }}
                  sx={{ width: '100%', bgcolor: 'background.paper' }}
                >
                  {noticeOption.notice.replace(
                    '{tooth}',
                    `${caries.panel.titlePrefix} ${universalFromFdi(decisionNotice.fdi)}${sideFromFdi(decisionNotice.fdi)}`,
                  )}
                </Alert>
              </Snackbar>
            )}
          </Stack>

          <Box sx={{ flexShrink: 0, pointerEvents: 'auto', maxWidth: '100%' }}>
            <ChartLegend
              perio={perio}
              caries={caries}
              implants={implants}
              endo={endo}
              postCore={odontogram.postCore}
            />
          </Box>
        </Stack>

        {/*
          The BOTTOM-LEFT corner: the controls for the model itself in one
          vertical strip — which arches show, then history and help — and,
          beside it on the bottom edge, what is selected (or, on a first visit
          with nothing selected, the one-time tip).

          While a tooth panel is open it holds the left of the card, so this
          group starts just past it instead of underneath it — and the caption
          is dropped, because the panel states the readings itself.
        */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            position: 'absolute',
            left: sidePanelOpen ? PAST_TOOTH_PANEL : 0,
            bottom: 0,
            // Stops short of the legend column on the right.
            maxWidth: (theme) =>
              sidePanelOpen
                ? `calc(100% - ${PAST_TOOTH_PANEL(theme)} - 300px - ${theme.spacing(2)})`
                : `calc(100% - 300px - ${theme.spacing(2)})`,
            alignItems: 'flex-end',
          }}
        >
          <Stack
            spacing={1.5}
            sx={{ flexShrink: 0, alignItems: 'center', pointerEvents: 'auto' }}
          >
            <ArchSelector
              views={odontogram.archViews}
              active={archView}
              onChange={setArchView}
              upperVisible={showUpper}
              lowerVisible={showLower}
            />
            <CornerAction item={odontogram.footerActions.start} />
            <CornerAction
              item={odontogram.footerActions.end}
              expanded={Boolean(helpAnchor)}
              onClick={(event) => {
                setHelpAnchor(event.currentTarget)
                // Opening the full help counts as having seen the tip.
                dismissTip()
              }}
            />
          </Stack>

          {!sidePanelOpen && (
            <ArchCaption
              teeth={teeth}
              selectedFdi={selectedFdi}
              perio={perio}
              perioReadings={perioReadings}
              caries={caries}
              implants={implants}
              endo={endo}
            />
          )}
          {tipOpen && selectedFdi === null && (
            <Box sx={{ pointerEvents: 'auto', minWidth: 0 }}>
              <ChartTip help={odontogram.model.help} selectHint={selectHint} onClose={dismissTip} />
            </Box>
          )}
        </Stack>
      </Box>

      <ChartHelpPopover
        help={odontogram.model.help}
        selectHint={selectHint}
        anchor={helpAnchor}
        onClose={() => setHelpAnchor(null)}
      />

      {treatmentDialog && (
        <AddTreatmentDialog
          key={treatmentDialog.key}
          open={treatmentDialog.open}
          toothLine={treatmentDialog.toothLine}
          surface={treatmentDialog.surface}
          category={caries.legend.label}
          onClose={closeTreatmentDialog}
          onSave={(line) => {
            const { fdi } = treatmentDialog
            setTreatmentPlans((current) => [
              ...current.filter((plan) => plan.fdi !== fdi),
              { fdi, line },
            ])
            decideCaries(fdi, 'treat')
            closeTreatmentDialog()
          }}
        />
      )}
      </Paper>
  )
}

/**
 * The dentition in its real arch.
 *
 * No number rows and no columns: the teeth carry their own identity here, so
 * `ArchCaption` in the bottom-left corner, beside the control strip, names whichever one is selected instead.
 */
function ArchModel({
  teeth,
  selectedFdi,
  perio,
  perioReadings,
  caries,
  cariesGrades,
  cariesStains,
  implants,
  endo,
  postCore,
  zoom,
  coveredLeft,
  focusFdi,
  focusSite,
  focusSurface,
  surfaceMarks,
  restorations,
  viewDirection,
  show,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  perio: PerioChart | null
  perioReadings: PerioToothReading[]
  caries: CariesChart
  cariesGrades: ReadonlyMap<number, readonly CariesGrade[]>
  cariesStains: ReadonlyMap<number, CariesStain>
  implants: ImplantChart
  endo: EndoChart | null
  postCore: PostCoreChart
  zoom: number
  coveredLeft: number
  focusFdi: number | null
  focusSite: PerioSite | null
  focusSurface: CariesSurface | null
  surfaceMarks: {
    coverage: 'surfaces' | 'crown' | 'facial'
    surfaces: readonly CariesSurface[]
    paint: RestorationPaintId | null
    active: CariesSurface | null
    draw: boolean
  } | null
  restorations: readonly RestorationMark[]
  viewDirection: readonly [number, number, number]
  show: ChartLayerVisibility
  onSelect: (fdi: number | null) => void
}) {
  return (
    <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 0, height: '100%' }}>
      <ToothArch3D
        teeth={teeth}
        selectedFdi={selectedFdi}
        perio={perio}
        perioReadings={perioReadings}
        caries={caries}
        cariesGrades={cariesGrades}
        cariesStains={cariesStains}
        implants={implants}
        endo={endo}
        postCore={postCore}
        zoom={zoom}
        coveredLeft={coveredLeft}
        focusFdi={focusFdi}
        focusSite={focusSite}
        focusSurface={focusSurface}
        surfaceMarks={surfaceMarks}
        restorations={restorations}
        viewDirection={viewDirection}
        show={show}
        onSelect={onSelect}
      />
    </Box>
  )
}

/**
 * What is selected, in words — and the interaction hint when nothing is.
 *
 * Lives in the panel footer rather than floating over the canvas. Overlaid, it
 * sat on top of the model at whatever zoom the camera happened to be at, and
 * grew upward INTO the teeth as findings stacked up on the selected tooth. On
 * the footer line it has a row of its own and can run to four lines without
 * covering anything.
 *
 * ⚠ This is the chart's ONLY `aria-live` region, and the canvas puts no teeth
 *   in the accessibility tree — so every finding on the selected tooth has to
 *   be stated here in words, not left to a colour on the model. That is why the
 *   perio, caries, implant and endo lines below repeat what the side panels
 *   already show. Don't thin them out.
 */
/**
 * The tooth's readings in one line of words: the deepest site, its depth and
 * recession, and whether it bled. With no readings it says so — "not probed"
 * is never rendered as "nothing found".
 */
function perioSummary(
  perio: PerioChart,
  tooth: Tooth,
  reading: PerioToothReading | undefined,
  unprobed: string,
) {
  if (!reading) return unprobed
  const deepest = deepestSite(reading)
  return [
    // The site is NAMED, not just its numbers given. Six sites are probed per
    // tooth and only the worst is quoted, so a depth with no site against it
    // would read as the whole tooth's finding.
    `${perio.labels.site} ${perio.siteLabels[tooth.arch][deepest.site]}`,
    `${perio.labels.pocket} ${deepest.reading.pocketDepth} ${perio.unit}`,
    `${perio.labels.recession} ${deepest.reading.recession} ${perio.unit}`,
    deepest.reading.conditions.includes('bleeding') ? perio.labels.bleeding : perio.labels.noBleeding,
  ].join(' · ')
}

function ArchCaption({
  teeth,
  selectedFdi,
  perio,
  perioReadings,
  caries,
  implants,
  endo,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  perio: PerioChart | null
  perioReadings: PerioToothReading[]
  caries: CariesChart
  implants: ImplantChart
  endo: EndoChart | null
}) {
  const { model } = patientChart.odontogram
  const selected = teeth.find((tooth) => tooth.fdi === selectedFdi)
  const reading =
    selected && perio ? perioByFdi(perioReadings).get(selected.fdi) : undefined
  const lesions = selected ? (cariesByFdi(caries).get(selected.fdi) ?? []) : []
  const fixture = selected ? implantsByFdi(implants).get(selected.fdi) : undefined
  const canal = selected && endo ? endoByFdi(endo).get(selected.fdi) : undefined

  return (
    <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
      <Typography
        variant="body2"
        aria-live="polite"
        // A short description of what is picked, not a headline: the tooth
        // reads in the primary colour, the readings after it recede.
        sx={{ color: 'text.secondary' }}
      >
        {selected ? (
          // Both notations, both named. The badges number 1–32 (Universal)
          // while the dataset and every tooth node are FDI, and a bare number
          // that could be either is exactly how the wrong tooth gets treated —
          // Universal 11 and FDI 11 are different teeth. The identity leads in
          // bold; the descriptors that follow stay at the caption weight.
          <>
            <Box component="strong" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {`${model.toothLabel} ${universalFromFdi(selected.fdi)}${sideFromFdi(selected.fdi)}`}
            </Box>
            {` · ${model.typeLabels[selected.type]} · FDI ${selected.fdi}`}
            {(perio || lesions.length > 0) && (
              /*
               * The perio reading and the caries finding share ONE line. They
               * were stacked, and on the footer row the caption competes with
               * the two corner buttons for width — four stacked lines pushed
               * the arch up. Side by side they fit, and `flexWrap` puts caries
               * back on its own line rather than truncating it when the panel
               * is narrow.
               */
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: 1,
                  rowGap: 0.25,
                  mt: 0.5,
                                  }}
              >
                {perio && (
                  /*
                   * The readings in words, for the tooth in hand. This is the
                   * only place a probing depth is stated in full — the badge
                   * abbreviates it and the patch on the tooth cannot state a
                   * number at all — so it names the surface, the recession and
                   * whether the site bled rather than leaving any of the three
                   * to be inferred from a colour.
                   */
                  <Box component="span" sx={{ fontWeight: 400 }}>
                    {perioSummary(perio, selected, reading, perio.labels.unprobed)}
                  </Box>
                )}

                {perio && lesions.length > 0 && (
                  /*
                   * Decorative, so `aria-hidden`: this row sits inside the
                   * chart's one aria-live region and a separator announced on
                   * every selection is noise. `component="span"` because the
                   * stock <hr> would be invalid inside the caption's heading
                   * element.
                   */
                  <Divider
                    component="span"
                    orientation="vertical"
                    flexItem
                    aria-hidden
                    sx={{ my: 0.25 }}
                  />
                )}

                {lesions.length > 0 && (
                  /*
                   * Repeated here, briefly, even though the panel beside the
                   * arch states it in full. This caption is the one aria-live
                   * region on the chart, and the canvas puts no teeth in the
                   * accessibility tree — so without this the finding is
                   * announced to nobody when the selection changes.
                   *
                   * The colour is not what says "caries" — `caries.title`
                   * leads the string in words, and the divider separates it
                   * from the perio reading beside it.
                   */
                  <Box component="span" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                    {`${caries.title} · ${lesions
                      .flatMap((finding) => finding.surfaces)
                      .map((surface) => caries.surfaceLabels[surface])
                      .join(', ')}`}
                  </Box>
                )}
              </Box>
            )}
            {fixture && (
              /*
               * Same reason as the lesion line above: this caption is the only
               * aria-live region on the chart, so without it the fact that the
               * selected site is implanted reaches nobody who is not looking at
               * the model. Stated with the fixture's dimensions because those
               * are what the drawn screw was generated from.
               */
              <Box
                component="span"
                sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
              >
                {`${implants.title} · ${fixture.diameter} × ${fixture.length} ${implants.unit}`}
              </Box>
            )}
            {canal && endo && (
              /*
               * Same reason again: the aria-live caption is the only thing that
               * announces the selection, so the endo finding has to be stated
               * here in words. The canal COUNT leads, because it is the one
               * number the drawing cannot say for itself.
               */
              <Box
                component="span"
                sx={{
                  display: 'block',
                  mt: 0.5,
                                    fontWeight: 600,
                  color: 'error.dark',
                }}
              >
                {`${endo.title} · ${canal.canals.length} ${endo.labels.canals.toLowerCase()} · ${
                  endo.statusLabels[canal.status]
                }`}
              </Box>
            )}
          </>
        ) : // Nothing until a tooth is picked: how to drive the arch lives
        // behind the "?" button now, not on a permanent line under the model.
        null}
      </Typography>
    </Box>
  )
}

// ─── FINDING CARDS ────────────────────────────────────────────────────────

/** A record open in the tooth panel: its name, its form or detail, and its actions. */
interface OpenToothRecord {
  title: string
  body: ReactNode
  /** The buttons on the panel's bottom edge. Absent on a read-only record. */
  footer?: ReactNode
  /**
   * Takes back what was entered. With it, an icon-only Reset stands first on
   * the bottom edge; it asks before acting unless `confirmReset` is false —
   * which is for a form whose entries have not been kept anywhere yet.
   */
  onReset?: () => void
  confirmReset?: boolean
}

/** Which record a card stands for — and so what opening it shows. */
type RecordKind = 'caries' | 'implant' | 'perio' | 'endo' | 'restoration' | 'newRestoration'

/**
 * The colour a dot in the tooth rail takes: a theme channel per chart type,
 * or `neutral` grey for the implant sites, which are a fact about the tooth
 * rather than a finding of any one chart.
 */
type RailFlagTone = 'warning' | 'info' | 'error' | 'neutral'

/** One set of teeth the rail dots, what the dot means in words, and its colour. */
interface RailFlag {
  id: string
  teeth: ReadonlySet<number>
  label: string
  tone: RailFlagTone
}

/** The dot's fill, as a theme path. */
const RAIL_FLAG_COLOUR: Record<RailFlagTone, string> = {
  warning: 'warning.main',
  info: 'info.main',
  error: 'error.main',
  // Dark enough to read on the rail's own grey.
  neutral: 'grey.600',
}

/** One thing charted on a tooth in the chart in view, as its card states it. */
interface ChartFinding {
  key: string
  fdi: number
  kind: RecordKind
  /** Which one, where a tooth can carry several of the kind — two fillings, say. */
  recordId?: string
  /**
   * Whether it earns a card in the chart's own left-hand list. Everything
   * charted shows on its tooth's overview; only what needs attention is
   * listed for the whole mouth — a 2 mm probing is a record, not a finding.
   */
  notable: boolean
  /** Which legend swatch stands for it — the same mark the arch draws. */
  swatch: string
  /** What it is: "Caries", "Implant", "Probing depth 6 mm". */
  title: string
  /** The one line of detail worth a glance; everything else is in the tooth panel. */
  detail: string
}

/** Width of the finding-card column, px. */
const FINDING_CARD_WIDTH = 232

/**
 * What the finding cards must leave free of the viewport's height, in spacing
 * units: the page gutter and the card's padding above and below, plus the
 * control strip that stands in the bottom-left corner under them.
 */
const FINDING_CARDS_CLEARANCE_UNITS = 43

/**
 * One finding as a compact card: its mark, what it is, which tooth, and the
 * single detail worth a glance. Deliberately NOT the full record — that is in
 * the tooth panel, which this card opens.
 *
 * A button, so it is reachable and activatable from the keyboard; the tooth
 * and the finding are both in its text, never carried by the swatch alone.
 */
function FindingCard({
  finding,
  toothPrefix,
  selected,
  onOpen,
}: {
  finding: ChartFinding
  /**
   * Names the tooth on the card. Left off inside a tooth's own panel, where
   * the tooth is the heading and repeating it on every card is noise.
   */
  toothPrefix?: string
  selected: boolean
  onOpen: () => void
}) {
  const tooth = toothPrefix
    ? `${toothPrefix} ${universalFromFdi(finding.fdi)}${sideFromFdi(finding.fdi)}`
    : null
  return (
    <ButtonBase
      component="li"
      onClick={onOpen}
      aria-current={selected ? 'true' : undefined}
      sx={{
        width: '100%',
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderRadius: 1.5,
        // Solid, with a soft lift: these float over the model, and a
        // see-through card would let the teeth run through the text.
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        boxShadow: 1,
        transition: (theme) => theme.transitions.create(['box-shadow', 'border-color']),
        '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main', boxShadow: 3 },
      }}
    >
      <Box
        aria-hidden
        sx={{ width: 16, display: 'flex', justifyContent: 'center', flexShrink: 0 }}
      >
        <LegendSwatch id={finding.swatch} />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {finding.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {[tooth, finding.detail].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
      {/* The record's own caret, turned to point onward: this opens something. */}
      <Box
        aria-hidden
        sx={{ display: 'flex', flexShrink: 0, color: 'text.disabled', transform: 'rotate(-90deg)' }}
      >
        <Icon name="dropdown" size={18} />
      </Box>
    </ButtonBase>
  )
}

/**
 * What the marks on the arch mean — symbol, name and a line of explanation.
 *
 * Carries no sample-data warning: those were taken out of the legend on
 * request. The finding cards for a selected tooth still state theirs.
 *
 * Sits over the canvas rather than in the panel header because it explains
 * what is visible on the model right now. Each row pairs its swatch with a
 * written label — the swatch alone would put a clinical finding behind colour
 * vision.
 *
 * The rows are not all tab-scoped. The two perio marks come and go with their
 * tab; the caries row stays as long as any lesion is charted, because the
 * stain it explains is on the arch in every chart type.
 */
function ChartLegend({
  perio,
  caries,
  implants,
  endo,
  postCore,
}: {
  perio: PerioChart | null
  caries: CariesChart
  implants: ImplantChart
  endo: EndoChart | null
  postCore: PostCoreChart
}) {
  // The post row rides with the endo chart, and only when a post survives the
  // root-filling check — a legend entry for a mark the model declined to draw
  // would explain something that is not there.
  const posts = endo ? postCoreByFdi(postCore) : null

  const rows = [
    ...(perio ? perio.legend : []),
    ...(endo && endo.findings.length > 0 ? endo.legend : []),
    ...(posts && posts.size > 0 ? [postCore.legend] : []),
    ...(caries.findings.length > 0 ? [caries.legend] : []),
    ...(implants.fixtures.length > 0 ? [implants.legend] : []),
  ]
  const { legend } = patientChart.odontogram
  const [open, setOpen] = useState(readLegendOpen)
  const listId = useId()
  if (rows.length === 0) return null

  const toggle = () => {
    setOpen(!open)
    writeLegendOpen(!open)
  }

  return (
    <Box
      sx={{
        width: 300,
        maxWidth: '100%',
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
      }}
    >
      {/* The whole heading is the toggle: a bigger target than the chevron
          alone, and it names what it hides. */}
      <ButtonBase
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? legend.hideLabel : legend.showLabel}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          color: 'text.secondary',
          '&:hover, &.Mui-focusVisible': { color: 'text.primary' },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {legend.title}
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'flex',
            transition: (theme) => theme.transitions.create('transform'),
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <Icon name="dropdown" size={18} />
        </Box>
      </ButtonBase>

      {open && (
        <Stack id={listId} spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
          {rows.map((item) => (
            <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              {/* As tall as the label's first line and centred in it, so every
                  swatch — a 2px line or a 10px dot — sits on the title it
                  names rather than riding above it. */}
              <Box
                aria-hidden
                sx={{
                  typography: 'body2',
                  lineHeight: 1.3,
                  height: '1.3em',
                  width: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LegendSwatch id={item.id} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {item.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  )
}

/** localStorage key for whether the legend is expanded. */
const LEGEND_OPEN_KEY = 'emr-dental:legend-open'

// Open unless the viewer collapsed it; storage failing just means open.
function readLegendOpen() {
  try {
    return window.localStorage.getItem(LEGEND_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

function writeLegendOpen(open: boolean) {
  try {
    window.localStorage.setItem(LEGEND_OPEN_KEY, open ? '1' : '0')
  } catch {
    // Not persisted; see `readLegendOpen`.
  }
}

/** Each row's swatch drawn as the mark it stands for, so the two read as one thing. */
function LegendSwatch({ id }: { id: string }) {
  if (id === 'margin') {
    return <Box sx={{ width: 14, height: 2, borderRadius: 0.25, bgcolor: 'error.main' }} />
  }

  if (id === 'postCore') {
    return (
      <Box
        sx={{
          width: 6,
          height: 14,
          borderRadius: 0.25,
          // The post's own metal, not a palette channel — the swatch has to be
          // the alloy the model is drawn in or it stops identifying the mark it
          // explains. See POST_PAINT in toothScene.ts.
          bgcolor: POST_PAINT.metal,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      />
    )
  }

  if (id === 'endo-canal') {
    return (
      <Box
        sx={{
          width: 6,
          height: 14,
          // Tapered like the canal it stands for, and in the pulp's own red
          // rather than a palette channel — see ENDO_PAINT in toothScene.ts.
          borderRadius: '50% 50% 40% 40%',
          bgcolor: ENDO_PAINT.canal,
          border: `1px solid ${ENDO_PAINT.margin}`,
        }}
      />
    )
  }

  if (id === 'endo-needed') {
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          // This row is about treatment STATE rather than anatomy, so unlike
          // the row above it takes the theme's error channel — the same colour
          // the tooth badge uses for a charted endo need.
          bgcolor: (theme) => `rgba(${theme.vars.palette.error.mainChannel} / 0.24)`,
          border: (theme) => `2px solid ${theme.palette.error.main}`,
        }}
      />
    )
  }

  if (id === 'implant') {
    return (
      <Box
        sx={{
          width: 8,
          height: 14,
          borderRadius: 0.25,
          // The fixture's OWN metal, for the reason the caries swatch gives:
          // the swatch has to be the colour the model is drawn in or it stops
          // identifying the thing it explains. See IMPLANT_PAINT in
          // toothScene.ts for why it is not theme-driven.
          bgcolor: IMPLANT_PAINT.metal,
          border: `1px solid ${IMPLANT_PAINT.collar}`,
        }}
      />
    )
  }

  if (id === 'restoration') {
    // A filled tile in the cool blue-grey the model paints restored enamel
    // with — material set INTO the tooth, as against a lesion's stain.
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: 0.25,
          bgcolor: 'info.light',
          border: (theme) => `1px solid ${theme.palette.info.main}`,
        }}
      />
    )
  }

  if (id === 'caries') {
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          // The stain's OWN colours, not a palette channel — the swatch has to
          // be the same brown the model is painted with, or it stops
          // identifying the mark it is there to explain. See CARIES_PAINT in
          // toothScene.ts for why the lesion is not theme-driven.
          borderRadius: '50%',
          bgcolor: CARIES_PAINT.core,
          border: `2px solid ${CARIES_PAINT.halo}`,
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        width: 14,
        height: 12,
        borderRadius: 0.25,
        bgcolor: 'info.main',
        opacity: 0.45,
        border: (theme) => `1px solid ${theme.palette.info.main}`,
      }}
    />
  )
}

/**
 * The fixture in full, for the implanted tooth the user just clicked.
 *
 * The screw on the model shows THAT the site is implanted and roughly how much
 * fixture is in the bone; this states the two dimensions it was drawn from, the
 * system, when it was placed and what sits on it. That ordering matters: the
 * drawn screw is generated from `diameter` and `length`, so a reader has to be
 * able to see the figures the picture came from rather than measuring the
 * picture — it is not a radiograph and the disclaimer says so.
 *
 * `severity="info"` rather than the caries panel's warning: an implant is a
 * fact about the site, not a finding to act on. The icon still rides along, so
 * the panel does not rest on its colour.
 */
function ImplantDetail({
  tooth,
  fixture,
  implants,
}: {
  tooth: Tooth
  fixture: ImplantFixture
  implants: ImplantChart
}) {
  const { model } = patientChart.odontogram
  const name = `${model.toothLabel} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`

  return (
    <Alert
      severity="info"
      variant="outlined"
      sx={{ bgcolor: 'background.paper', pointerEvents: 'auto', width: '100%' }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{`${implants.title} · ${name}`}</AlertTitle>

      <Stack spacing={0.25}>
        <DetailRow label={implants.labels.system} value={fixture.system} />
        <DetailRow
          label={implants.labels.fixture}
          // Diameter × length, the way a fixture is written on a chart, with
          // the unit stated rather than left to be assumed from the numbers.
          value={`${fixture.diameter} × ${fixture.length} ${implants.unit}`}
        />
        <DetailRow label={implants.labels.placed} value={fixture.placedOn} />
        <DetailRow label={implants.labels.restoration} value={fixture.restoration} />
        <DetailRow label={implants.labels.plan} value={fixture.plan} />

        <Typography variant="caption" sx={{ display: 'block', pt: 0.5, fontStyle: 'italic' }}>
          {fixture.note}
        </Typography>

        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600 }}>
          {implants.disclaimer}
        </Typography>
      </Stack>
    </Alert>
  )
}

/**
 * The canal record in full, for the endo tooth the user just clicked.
 *
 * The red through the tooth shows roughly WHERE the pulp runs; this is the only
 * place that says how many canals there are, what they are called, what the
 * pulpal and periapical diagnoses are and what is planned. The count matters
 * most: the drawing gets it from this record, so a reader has to be able to
 * check the number rather than count shapes on a rotating model — and a canal
 * that has not been located is not drawn at all.
 *
 * `severity="error"` because every finding here is an open treatment need, and
 * the icon carries that alongside the colour.
 */
function EndoDetail({
  tooth,
  finding,
  endo,
}: {
  tooth: Tooth
  finding: EndoFinding
  endo: EndoChart
}) {
  const { model } = patientChart.odontogram
  const name = `${model.toothLabel} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`

  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={{ bgcolor: 'background.paper', pointerEvents: 'auto', width: '100%' }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{`${endo.title} · ${name}`}</AlertTitle>

      <Stack spacing={0.25}>
        <DetailRow
          label={endo.labels.canals}
          // The count leads and the names follow it, because the count is what
          // the drawing was built from and the names are what a clinician
          // works to.
          value={`${finding.canals.length} — ${finding.canals.join(', ')}`}
        />
        <DetailRow label={endo.labels.status} value={endo.statusLabels[finding.status]} />
        <DetailRow label={endo.labels.diagnosis} value={finding.diagnosis} />
        <DetailRow label={endo.labels.periapical} value={finding.periapical} />
        <DetailRow label={endo.labels.detected} value={finding.detectedOn} />
        <DetailRow label={endo.labels.plan} value={finding.plan} />

        <Typography variant="caption" sx={{ display: 'block', pt: 0.5, fontStyle: 'italic' }}>
          {finding.note}
        </Typography>

        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600 }}>
          {endo.disclaimer}
        </Typography>
      </Stack>
    </Alert>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
      <Typography
        variant="caption"
        sx={{ flexShrink: 0, minWidth: 62, color: 'text.secondary', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Stack>
  )
}

// ─── CHART LAYERS AND VIEW ────────────────────────────────────────────────

/** The button both menus open from, so they read as a matched pair. */
function MenuButton({
  icon,
  label,
  open,
  onClick,
}: {
  icon: IconName
  label: string
  open: boolean
  onClick: (event: React.MouseEvent<HTMLElement>) => void
}) {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      aria-haspopup="true"
      aria-expanded={open}
      startIcon={<Icon name={icon} size={20} />}
      endIcon={
        <Icon
          name="dropdown"
          size={20}
          // Turns to point at the open menu, which is the one cue that says
          // the button is a disclosure rather than an action.
        />
      }
      sx={{
        px: 2.5,
        py: 1.25,
        color: 'primary.main',
        // Solid rather than the outlined variant's transparent default. These
        // two buttons sit over the canvas, and a see-through fill let the arch
        // and its tooth badges show through the label.
        bgcolor: 'background.paper',
        borderColor: open ? 'primary.main' : 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          // The action tint laid OVER the solid fill rather than replacing it.
          // `bgcolor: 'action.selected'` is a translucent neutral, so setting it
          // here would drop the white out again for as long as the pointer is
          // on the button — the exact thing this is fixing.
          bgcolor: 'background.paper',
          backgroundImage: (theme) =>
            `linear-gradient(${theme.vars.palette.action.selected}, ${theme.vars.palette.action.selected})`,
        },
        '& .MuiButton-endIcon': {
          transition: (theme) => theme.transitions.create('transform'),
          transform: open ? 'rotate(180deg)' : 'none',
        },
      }}
    >
      {label}
    </Button>
  )
}

/**
 * The swatch beside a layer row — the mark itself, in miniature.
 *
 * Drawn rather than described so the row is recognisable at a glance against
 * what is on the model. The three that ARE on the model take their colour from
 * the same constants the 3D layers use, so a swatch can never drift from the
 * thing it stands for; the rest are theme channels, because there is no mark
 * to match yet.
 */
function LayerSwatch({ kind }: { kind: ChartLayerSwatch }) {
  const common = { flexShrink: 0, width: 14, height: 14 } as const

  switch (kind) {
    case 'caries':
      return <Box aria-hidden sx={{ ...common, borderRadius: '50%', bgcolor: CARIES_PAINT.core }} />
    case 'implant':
      return (
        <Box aria-hidden sx={{ ...common, width: 8, borderRadius: 0.5, bgcolor: IMPLANT_PAINT.metal }} />
      )
    case 'endo':
      return (
        <Box
          aria-hidden
          sx={{ ...common, width: 9, borderRadius: 0.25, border: `2px solid ${ENDO_PAINT.canal}` }}
        />
      )
    case 'label':
      return (
        <Typography
          aria-hidden
          variant="caption"
          sx={{
            flexShrink: 0,
            px: 0.5,
            borderRadius: 0.5,
            fontWeight: 700,
            color: 'info.dark',
            bgcolor: (theme) => `rgba(${theme.vars.palette.info.mainChannel} / 0.16)`,
          }}
        >
          3R
        </Typography>
      )
    case 'measure':
      return (
        <Box
          aria-hidden
          sx={{ ...common, width: 8, borderRadius: 0.25, border: '2px solid', borderColor: 'text.disabled' }}
        />
      )
    case 'lesion':
      return <Box aria-hidden sx={{ ...common, borderRadius: '50%', bgcolor: 'error.main' }} />
    case 'fracture':
      return <Box aria-hidden sx={{ ...common, borderRadius: '50%', bgcolor: 'secondary.main' }} />
    case 'restoration':
      return (
        <Box
          aria-hidden
          sx={{ ...common, width: 9, borderRadius: 0.25, border: '2px solid', borderColor: 'success.main' }}
        />
      )
    case 'postCore':
      return <Box aria-hidden sx={{ ...common, width: 5, borderRadius: 0.5, bgcolor: 'warning.main' }} />
    default:
      return (
        <Box
          aria-hidden
          sx={{ ...common, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }}
        />
      )
  }
}

/**
 * What to draw on the chart.
 *
 * A `Popover` rather than a `Menu`: this is a form of grouped checkboxes, not
 * a list of commands, and Menu's roving focus and type-ahead fight a checkbox
 * the moment there is more than one section.
 *
 * The four rows at the top are the broad strokes and the rest refine two of
 * them — switching `findings` off hides caries whatever the caries row says,
 * so the refinements read as disabled while their parent is off rather than
 * appearing to promise something the parent has already overruled.
 */
function ChartLayersMenu({
  layers,
  state,
  onChange,
}: {
  layers: ChartLayers
  state: Record<ChartLayerId, boolean>
  onChange: (next: Record<ChartLayerId, boolean>) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const set = (id: ChartLayerId, on: boolean) => onChange({ ...state, [id]: on })

  const showAll = () => {
    const next = { ...state }
    for (const group of layers.groups) {
      // Only what is actually drawn — "show all" cannot conjure a mark that
      // does not exist, and ticking one would be a lie the model then fails.
      for (const item of group.items) if (item.available) next[item.id] = true
    }
    onChange(next)
  }

  return (
    <>
      <MenuButton
        icon="layers"
        label={layers.buttonLabel}
        open={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
      />

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 340,
              borderRadius: 1.5,
              /*
               * Twelve rows plus two headings and a footer run to about 940px,
               * which does not fit under the button on a laptop — and a
               * Popover that cannot fit gets shifted up the screen until it
               * does, landing on top of the patient header. Capping it keeps
               * the menu hanging off the control that opened it and scrolls
               * the overflow instead.
               */
              maxHeight: '62vh',
              overflowY: 'auto',
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {layers.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {layers.subtitle}
          </Typography>
        </Box>

        {layers.groups.map((group, index) => (
          <Box key={group.id}>
            {index > 0 && <Divider />}
            {group.title && (
              <Typography variant="subtitle2" sx={{ px: 2.5, pt: 2, fontWeight: 700 }}>
                {group.title}
              </Typography>
            )}
            <Stack sx={{ px: 1.5, py: 1 }}>
              {group.items.map((item) => {
                // A refinement is only as available as the group it refines.
                const parent =
                  group.id === 'findings' ? 'findings' : group.id === 'treatments' ? 'treatments' : null
                const blocked = parent !== null && !state[parent as ChartLayerId]
                const disabled = !item.available || blocked

                return (
                  <Tooltip
                    key={item.id}
                    title={item.available ? '' : layers.unavailableHint}
                    placement="left"
                  >
                    {/* A disabled control fires no pointer events, so the
                        tooltip needs a live element to hang off. */}
                    <Box>
                      <FormControlLabel
                        disabled={disabled}
                        control={
                          <Checkbox
                            checked={state[item.id] ?? false}
                            onChange={(event) => set(item.id, event.target.checked)}
                          />
                        }
                        label={
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: 'center', py: 0.5 }}
                          >
                            <LayerSwatch kind={item.swatch} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                {item.label}
                              </Typography>
                              {item.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.description}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        }
                        sx={{ width: '100%', m: 0, alignItems: 'center' }}
                      />
                    </Box>
                  </Tooltip>
                )
              })}
            </Stack>
          </Box>
        ))}

        <Divider />
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2.5, py: 2, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Button onClick={showAll} sx={{ fontWeight: 700 }}>
            {layers.showAll}
          </Button>
          <Button variant="outlined" onClick={() => onChange(defaultChartLayers(layers))}>
            {layers.reset}
          </Button>
        </Stack>
      </Popover>
    </>
  )
}

/** Where to look from. A plain list of commands, so a `Menu` is right here. */
function ViewMenu({
  views,
  active,
  onChange,
}: {
  views: ChartViews
  active: ChartViewOption
  onChange: (id: string) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <MenuButton
        icon="view3d"
        // The current view is ON the button, not just inside the menu — where
        // the arch is being seen from changes which side of the mouth is on
        // which side of the screen, and that must never need a click to check.
        label={`${views.buttonLabel}: ${active.label}`}
        open={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
      />

      <Menu
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 1.5 } } }}
      >
        {views.options.map((option) => (
          <MenuItem
            key={option.id}
            selected={option.id === active.id}
            onClick={() => {
              onChange(option.id)
              setAnchor(null)
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// ─── TOOTH PANELS ─────────────────────────────────────────────────────────

/** A tooth panel's width, px — also how far the bottom-left asides step aside for it. */
const TOOTH_PANEL_WIDTH = 468

/**
 * Where a tooth panel sits: flush against the card's left edge and the full
 * height of it, top edge to bottom edge — the same box the canvas fills.
 */
const TOOTH_PANEL_SLOT_SX = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: TOOTH_PANEL_WIDTH,
  maxWidth: '100%',
  zIndex: 2,
  display: 'flex',
} as const

/**
 * How far content INSIDE the card's padding has to start to clear an open
 * tooth panel: the panel's width, less the 32px of padding that content
 * already stands in from the edge, plus one 16px step of air.
 */
const PAST_TOOTH_PANEL = (theme: Theme) =>
  `calc(${TOOTH_PANEL_WIDTH}px - ${theme.spacing(4)} + ${theme.spacing(2)})`

/**
 * The heading every tooth panel opens with: the tooth in both notations, its
 * type, and the close button level with the top of the title.
 */
function ToothPanelHeader({
  titlePrefix,
  tooth,
  closeLabel,
  onClose,
  record,
}: {
  titlePrefix: string
  tooth: Tooth
  closeLabel: string
  onClose: () => void
  /**
   * Set while a record is open: the heading then names the RECORD first — the
   * thing on screen — with the tooth after it, and a way back stands above it.
   */
  record?: { title: string; backLabel: string; onBack: () => void }
}) {
  const toothName = `${titlePrefix} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`
  const toothKind = `FDI ${tooth.fdi} · ${patientChart.odontogram.model.typeLabels[tooth.type]}`
  const close = (
    <IconButton aria-label={closeLabel} onClick={onClose}>
      <Icon name="close" size={22} />
    </IconButton>
  )

  if (record) {
    return (
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          {/* Back, as a bare icon in front of the record's name — the first
              thing in the panel while a record is open. */}
          <Tooltip title={record.backLabel}>
            <IconButton
              aria-label={record.backLabel}
              size="small"
              edge="start"
              onClick={record.onBack}
              // Level with the first line of the heading beside it.
              sx={{ mt: 0.125 }}
            >
              {/* The record's own caret, turned to point back. */}
              <Box component="span" sx={{ display: 'flex', transform: 'rotate(90deg)' }}>
                <Icon name="dropdown" size={22} />
              </Box>
            </IconButton>
          </Tooltip>
          {/* The record names the panel; the tooth it is on — in both
              notations, as everywhere a tooth is named — is the line under. */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              {record.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`${toothName} · ${toothKind}`}
            </Typography>
          </Box>
        </Stack>
        {close}
      </Stack>
    )
  }

  return (
    // `flex-start`: the close button lines up with the top of the title, not
    // the middle of the two-line heading block.
    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {/* Both notations, as everywhere else a tooth is named: Universal 3 and
          FDI 3 are different teeth. */}
      <Box>
        <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
          {toothName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {toothKind}
        </Typography>
      </Box>
      {close}
    </Stack>
  )
}

/**
 * The panel every tooth opens, whichever chart is up.
 *
 * Left to right: the tooth list, then the tooth itself. The Overview tab has
 * two levels:
 *
 *   1. the OVERVIEW — one card per thing charted on this tooth in the chart
 *      type in view ("this tooth has caries; and an implant"), which is what a
 *      tooth opens on;
 *   2. an open RECORD — the form or detail behind one of those cards, with a
 *      way back.
 *
 * Only the middle scrolls: the name, the tabs and the actions stay put however
 * long the section is. The other tabs have nothing behind them yet and say so
 * in words.
 */
function ToothPanel({
  tooth,
  teeth,
  tab,
  onTabChange,
  flags,
  records,
  onOpenRecord,
  overviewNote,
  record,
  notes,
  onAddNote,
  onAddPathology,
  pathologyKinds,
  onPickPathology,
  restorationKinds,
  onAddRestoration,
  sections,
  onClose,
  onSelectTooth,
}: {
  tooth: Tooth
  /** Every tooth currently on the arch, for the rail. */
  teeth: Tooth[]
  /** Which section of the tooth's record is up — owned by the parent. */
  tab: ToothPanelTabId
  onTabChange: (tab: ToothPanelTabId) => void
  /** The sets of teeth the rail marks with a dot. */
  flags: RailFlag[]
  /** What is charted on THIS tooth in the chart in view — the overview's cards. */
  records: ChartFinding[]
  /** A card was picked (`null` is "back to the overview"). */
  onOpenRecord: (kind: RecordKind | null, recordId?: string) => void
  /** Something the overview has to say before its cards — "not yet probed". */
  overviewNote?: ReactNode
  /** The record that is open, or `null` on the overview. */
  record: OpenToothRecord | null
  /** What has been typed onto this tooth through the free-text line, oldest first. */
  notes: string[]
  onAddNote: (text: string) => void
  /**
   * What the tabs other than Overview show. Built by the parent, which owns the
   * state they read; each brings its own empty line for a tooth with nothing.
   */
  sections: Record<Exclude<ToothPanelTabId, 'general'>, ReactNode>
  /**
   * Opens the pathology form for this tooth straight away — for a chart type
   * with one kind of pathology to record (probing, on Perio). Absent where the
   * chart has none to open.
   */
  onAddPathology?: () => void
  /**
   * The kinds "Add pathology" offers, and what picking one does. Where the
   * handler is given, the button opens this menu instead of a form — the same
   * way "Add restoration" beside it does.
   */
  pathologyKinds: { label: string; options: PathologyOption[] }
  onPickPathology?: (kind: PathologyOption) => void
  /**
   * The kinds "Add restoration" offers, and what picking one does. The handler
   * is absent on a chart type that does not record restorations.
   */
  restorationKinds: { label: string; options: RestorationKind[] }
  onAddRestoration?: (kind: RestorationKind) => void
  onClose: () => void
  onSelectTooth: (fdi: number) => void
}) {
  const { toothPanel } = patientChart.odontogram
  const baseId = useId()
  const tabId = (id: ToothPanelTabId) => `${baseId}-tab-${id}`
  const panelId = `${baseId}-panel`
  const title = `${toothPanel.titlePrefix} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`
  // A record is a level inside Overview; the other tabs have no such level.
  const open = tab === 'general' ? record : null
  const [draft, setDraft] = useState('')
  const [confirmingReset, setConfirmingReset] = useState(false)
  /** The "Add restoration" button, while its menu of kinds is open. */
  const [kindsAnchor, setKindsAnchor] = useState<HTMLElement | null>(null)
  /** The "Add pathology" button, while ITS menu is open. */
  const [pathologyAnchor, setPathologyAnchor] = useState<HTMLElement | null>(null)

  /*
   * The two menus are ONE width, set by the longest label in either list —
   * they open from neighbouring buttons, and two menus of different widths
   * side by side read as two different kinds of thing. Measured in `ch` off
   * the label's character count, plus the item's own side padding; it runs a
   * little generous, which is the safe way for it to be wrong.
   */
  const longestKind = Math.max(
    ...[...pathologyKinds.options, ...restorationKinds.options].map((kind) => kind.label.length),
  )
  const kindMenuPaper = {
    sx: { minWidth: (theme: Theme) => `calc(${longestKind}ch + ${theme.spacing(4)})` },
  }
  /** Which "Add…" buttons open a menu, and whether it is open. */
  const menuAnchors: Record<string, HTMLElement | null | undefined> = {
    pathology: onPickPathology ? pathologyAnchor : undefined,
    restoration: onAddRestoration ? kindsAnchor : undefined,
  }

  // The three kinds of record the overview can start. Only pathology has a
  // form behind it so far; the other two keep their place and say so on hover
  // rather than doing nothing silently — the pattern the record's unbuilt
  // sections already use.
  const adders = [
    {
      id: 'pathology',
      label: toothPanel.actions.addPathology,
      icon: toothPanel.icons.addPathology,
      // With kinds to choose from, it opens their menu; otherwise the one
      // form the chart has.
      onClick: onPickPathology
        ? (event: React.MouseEvent<HTMLElement>) => setPathologyAnchor(event.currentTarget)
        : onAddPathology
          ? (_event: React.MouseEvent<HTMLElement>) => onAddPathology()
          : undefined,
      disabled: false,
    },
    {
      id: 'restoration',
      label: toothPanel.actions.addRestoration,
      icon: toothPanel.icons.addRestoration,
      // Does not start a form itself: it opens the menu of kinds, and the
      // kind picked there is what the form is for.
      onClick: onAddRestoration
        ? (event: React.MouseEvent<HTMLElement>) => setKindsAnchor(event.currentTarget)
        : undefined,
      disabled: false,
    },
    // Switched off outright, last in the row: there is nothing to add an
    // implant with yet, and unlike the hinted button beside it this one is
    // not meant to look available.
    {
      id: 'implant',
      label: toothPanel.actions.addImplant,
      icon: toothPanel.icons.addImplant,
      onClick: undefined,
      disabled: true,
    },
  ]

  return (
    <Paper
      component="section"
      // Raised, unlike every other card here: it floats over the model rather
      // than sitting in the page beside it, and the shadow is what says so.
      elevation={8}
      aria-label={title}
      sx={{
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        overflow: 'hidden',
        // Square. It lies flush against the card, which clips its own rounded
        // corners; a second radius in here would open a sliver onto the model
        // at each of them.
        borderRadius: 0,
      }}
    >
      {/* Every tooth panel carries the tooth list down its left side, so
          stepping to another tooth never means closing the panel and finding
          it on the arch. */}
      <ToothRail
        teeth={teeth}
        selectedFdi={tooth.fdi}
        label={toothPanel.toothRail}
        flags={flags}
        onSelect={onSelectTooth}
      />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexShrink: 0, px: 2.5, pt: 2.5 }}>
          <ToothPanelHeader
            titlePrefix={toothPanel.titlePrefix}
            tooth={tooth}
            closeLabel={toothPanel.close}
            onClose={onClose}
            record={
              open
                ? {
                    title: open.title,
                    backLabel: toothPanel.back,
                    onBack: () => onOpenRecord(null),
                  }
                : undefined
            }
          />

          {open ? (
            // Inside a record the tabs give way to a plain rule under the
            // heading: one level at a time.
            <Divider sx={{ mt: 1.5 }} />
          ) : (
            <Tabs
              value={tab}
              onChange={(_, id: ToothPanelTabId) => onTabChange(id)}
              aria-label={toothPanel.tabsLabel}
              sx={{ mt: 1.5, minHeight: 'auto', borderBottom: 1, borderColor: 'divider' }}
            >
              {toothPanel.tabs.map((option) => (
                <Tab
                  key={option.id}
                  value={option.id}
                  id={tabId(option.id)}
                  aria-controls={panelId}
                  label={option.label}
                  sx={{
                    minHeight: 44,
                    minWidth: 0,
                    color: 'text.secondary',
                    '&.Mui-selected': { fontWeight: 700 },
                  }}
                />
              ))}
            </Tabs>
          )}
        </Box>

        {/* The only part that scrolls. */}
        <Box
          role={open ? undefined : 'tabpanel'}
          id={panelId}
          aria-labelledby={open ? undefined : tabId(tab)}
          sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2.5 }}
        >
          {open ? (
            open.body
          ) : tab === 'general' ? (
            <Stack spacing={1.5}>
              {overviewNote}
              {records.length > 0 ? (
                <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {records.map((item) => (
                    <FindingCard
                      key={item.key}
                      finding={item}
                      selected={false}
                      onOpen={() => onOpenRecord(item.kind, item.recordId)}
                    />
                  ))}
                </Stack>
              ) : (
                // Said outright rather than left to an empty list — and said
                // with the notes still under it: a typed note is not a finding.
                !overviewNote && (
                  <Alert severity="info" variant="outlined">
                    <AlertTitle sx={{ fontWeight: 700 }}>{toothPanel.emptyOverview.title}</AlertTitle>
                    {toothPanel.emptyOverview.body}
                  </Alert>
                )
              )}
              {/* What was typed onto the tooth, in the words it was typed in —
                  under the charted records, never mixed in among them. */}
              {notes.length > 0 && (
                <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {notes.map((note, index) => (
                    <Stack
                      component="li"
                      // Notes are only ever appended, so position is a stable key.
                      key={index}
                      direction="row"
                      sx={{
                        gap: 1.25,
                        px: 1.5,
                        py: 1.25,
                        alignItems: 'flex-start',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        aria-hidden
                        sx={{ width: 16, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'text.secondary' }}
                      >
                        <Icon name="notes" size={16} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}>
                          {note}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {toothPanel.quickAdd.noteLabel}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : (
            sections[tab]
          )}
        </Box>

        {/* The bottom edge while a record is open: that record's own actions,
            each filling the width. */}
        {open?.footer && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              px: 2.5,
              py: 2,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            {/* Reset, always first and always just its icon: the one button
                here that undoes, kept apart in shape from the ones that do. */}
            {open.onReset && (
              <Tooltip title={toothPanel.actions.reset}>
                <IconButton
                  aria-label={toothPanel.actions.reset}
                  onClick={() => {
                    if (open.confirmReset === false) open.onReset?.()
                    else setConfirmingReset(true)
                  }}
                  sx={{
                    flexShrink: 0,
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
                  }}
                >
                  <Icon name="reset" size={22} />
                </IconButton>
              </Tooltip>
            )}
            {open.footer}
          </Stack>
        )}

        {/* Entries are kept the moment they are made, so there is no unsaved
            copy to fall back on: Reset asks first. */}
        <Dialog
          open={confirmingReset && Boolean(open?.onReset)}
          onClose={() => setConfirmingReset(false)}
          aria-labelledby={`${baseId}-reset-title`}
        >
          <DialogTitle id={`${baseId}-reset-title`}>{toothPanel.resetConfirm.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="text.secondary">
              {toothPanel.resetConfirm.body
                .replace('{record}', open?.title ?? '')
                .replace('{tooth}', title)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmingReset(false)}>
              {toothPanel.resetConfirm.cancel}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                open?.onReset?.()
                setConfirmingReset(false)
              }}
            >
              {toothPanel.resetConfirm.confirm}
            </Button>
          </DialogActions>
        </Dialog>

        {/*
          The bottom edge on the overview: three raised buttons floating over
          the end of the list — one per kind of record a tooth can be given —
          and under them a line to type on. No rule above them: they sit ON the
          panel, lifted by their shadow, rather than in a footer bar.
        */}
        {!open && tab === 'general' && (
          <Stack spacing={1.5} sx={{ flexShrink: 0, px: 2.5, pt: 1, pb: 2 }}>
            <Stack direction="row" spacing={1}>
              {adders.map((adder) => (
                <Tooltip
                  key={adder.id}
                  // No hint on the disabled one: a disabled button fires no
                  // hover for a tooltip to hang off.
                  title={adder.onClick || adder.disabled ? '' : toothPanel.unavailableHint}
                  disableInteractive
                >
                  {/* `aria-disabled`, not `disabled`: a disabled button drops
                      out of the tab order and kills the hover the hint hangs
                      off. It carries no handler, so it does nothing. */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Icon name={adder.icon} size={16} />}
                    onClick={adder.onClick}
                    disabled={adder.disabled}
                    aria-haspopup={menuAnchors[adder.id] !== undefined ? 'menu' : undefined}
                    aria-expanded={
                      menuAnchors[adder.id] !== undefined ? Boolean(menuAnchors[adder.id]) : undefined
                    }
                    aria-disabled={adder.onClick || adder.disabled ? undefined : true}
                    disableRipple={!adder.onClick}
                    sx={{
                      flex: '1 1 auto',
                      px: 1,
                      py: 0.75,
                      whiteSpace: 'nowrap',
                      // Three labels and three glyphs share one narrow row:
                      // the glyph sits tight to its label.
                      '& .MuiButton-startIcon': { ml: 0, mr: 0.5 },
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      // A disabled button does not float: no lift to press.
                      '&.Mui-disabled': { boxShadow: 0 },
                      cursor: adder.onClick ? 'pointer' : 'default',
                      '&:hover': { bgcolor: 'background.paper', boxShadow: adder.onClick ? 4 : 2 },
                    }}
                  >
                    {adder.label}
                  </Button>
                </Tooltip>
              ))}
            </Stack>

            {/* The kinds of restoration, in a small menu that opens UPWARD from
                its button — the button stands on the panel's bottom edge. */}
            <Menu
              open={Boolean(kindsAnchor)}
              anchorEl={kindsAnchor}
              onClose={() => setKindsAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              slotProps={{ list: { 'aria-label': restorationKinds.label }, paper: kindMenuPaper }}
            >
              {restorationKinds.options.map((kind) => (
                <MenuItem
                  key={kind.id}
                  onClick={() => {
                    setKindsAnchor(null)
                    onAddRestoration?.(kind)
                  }}
                >
                  {kind.label}
                </MenuItem>
              ))}
            </Menu>

            {/* The kinds of pathology, in the same menu from the button beside
                it. A kind with no form yet is listed and switched off. */}
            <Menu
              open={Boolean(pathologyAnchor)}
              anchorEl={pathologyAnchor}
              onClose={() => setPathologyAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              slotProps={{ list: { 'aria-label': pathologyKinds.label }, paper: kindMenuPaper }}
            >
              {pathologyKinds.options.map((kind) => (
                <MenuItem
                  key={kind.id}
                  disabled={!kind.available}
                  onClick={() => {
                    setPathologyAnchor(null)
                    onPickPathology?.(kind)
                  }}
                >
                  {kind.label}
                </MenuItem>
              ))}
            </Menu>

            {/* Typed and entered, it is added to the tooth as a note — in the
                clinician's own words, not parsed into a record. */}
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault()
                const text = draft.trim()
                if (!text) return
                onAddNote(text)
                setDraft('')
              }}
            >
              <TextField
                size="small"
                fullWidth
                // A tooth's notes must not be offered back by the browser later.
                autoComplete="off"
                placeholder={toothPanel.quickAdd.placeholder}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                slotProps={{
                  htmlInput: { 'aria-label': toothPanel.quickAdd.label },
                  input: {
                    // Decorative: the field's name already says what it adds.
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                        <Icon name={toothPanel.icons.quickAdd} size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

// ─── CARIES TOOTH PANEL ───────────────────────────────────────────────────

/** A surface nobody has assessed yet. */
const UNASSESSED: CariesSurfaceAssessment = { tissue: null, cavitation: null, grade: null }

/**
 * Where each surface sits in the panel's cross, as `row / column` of a 3 × 3
 * grid: buccal above, lingual/palatal below, mesial and distal either side of
 * the biting surface in the middle — the tooth seen from its biting end.
 */
const CARIES_SURFACE_CELL: Record<CariesSurface, string> = {
  buccal: '1 / 2',
  mesial: '2 / 1',
  occlusal: '2 / 2',
  distal: '2 / 3',
  lingual: '3 / 2',
}

/**
 * What a tooth was marked on, in one line: the tooth, then each surface that
 * has anything recorded with its depth, cavitation and grade — "3R · Occlusal:
 * Dentin, No cavitation, C2". The line a History card carries.
 *
 * Only what was actually assessed is listed. A tooth marked with nothing
 * recorded says so, rather than showing a bare tooth number that would read as
 * a finding with its details lost.
 */
function cariesActionSummary(
  caries: CariesChart,
  tooth: Tooth,
  assessment: CariesToothAssessment,
  noSurfaces: string,
) {
  const { panel } = caries
  const surfaces = CARIES_SURFACE_ORDER.flatMap((surface) => {
    const entry = assessment.surfaces[surface]
    if (!entry) return []
    const parts = [
      panel.tissues.find((option) => option.id === entry.tissue)?.label,
      panel.cavitations.find((option) => option.id === entry.cavitation)?.label,
      panel.grades.find((option) => option.id === entry.grade)?.label,
    ].filter((part): part is string => Boolean(part))
    return parts.length > 0
      ? [`${cariesSurfaceLabel(caries, tooth, surface)}: ${parts.join(', ')}`]
      : []
  })
  return [
    `${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`,
    ...(surfaces.length > 0 ? surfaces : [noSurfaces]),
  ].join(' · ')
}

/**
 * A surface's name ON THIS TOOTH. The tongue side of an upper tooth faces the
 * palate, and an anterior tooth bites on an incisal edge, not an occlusal
 * table — the same two keys, named for where the tooth is.
 */
function cariesSurfaceLabel(caries: CariesChart, tooth: Tooth, surface: CariesSurface) {
  const { surfaceLabelOverrides } = caries.panel
  if (surface === 'lingual' && tooth.arch === 'upper') return surfaceLabelOverrides.upperLingual
  if (surface === 'occlusal' && (tooth.type === 'incisor' || tooth.type === 'canine')) {
    return surfaceLabelOverrides.anteriorOcclusal
  }
  return caries.surfaceLabels[surface]
}

/**
 * The caries assessment for ONE tooth, opened by picking a carious tooth on
 * the Dental tab.
 *
 * The counterpart of the perio panel, built the same way: tiles on top for the
 * places a finding can be, the controls under them for whichever tile is in
 * hand, and every entry kept as it is made. The differences are the anatomy's,
 * not the layout's — caries is charted on the crown's FIVE surfaces, where
 * perio probes six points round the gum.
 *
 * Each surface carries its own depth, cavitation and grade, because one tooth
 * can hold lesions of different severity on different faces; the grade shows
 * on the tile so all five read at a glance. The decision that closes the form
 * is for the tooth as a whole.
 *
 * It is the Overview tab of the shared `ToothPanelFrame`, which supplies the
 * rail, the heading, the tabs and the actions on the bottom edge.
 */
function CariesForm({
  tooth,
  caries,
  assessment,
  activeSurface,
  onSurfaceChange,
  onEditSurface,
}: {
  tooth: Tooth
  caries: CariesChart
  assessment: CariesToothAssessment
  /** The surface in hand — owned by the parent, which also outlines it on the arch. */
  activeSurface: CariesSurface
  onSurfaceChange: (surface: CariesSurface) => void
  /** Applied at once — entries are kept as they are made. */
  onEditSurface: (
    fdi: number,
    surface: CariesSurface,
    change: Partial<CariesSurfaceAssessment>,
  ) => void
}) {
  const { panel } = caries
  const surfacesId = useId()
  const current = assessment.surfaces[activeSurface] ?? UNASSESSED

  return (
    <Stack spacing={2.5}>
      <Box role="group" aria-labelledby={surfacesId}>
        <ChoiceHeading id={surfacesId}>{panel.surfacesTitle}</ChoiceHeading>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          {CARIES_SURFACE_ORDER.map((surface) => (
            <CariesSurfaceTile
              key={surface}
              label={cariesSurfaceLabel(caries, tooth, surface)}
              grade={assessment.surfaces[surface]?.grade ?? null}
              ungraded={panel.ungraded}
              selected={surface === activeSurface}
              cell={CARIES_SURFACE_CELL[surface]}
              onSelect={() => onSurfaceChange(surface)}
            />
          ))}
        </Box>
      </Box>

      {/* The three questions below are about the surface picked above. */}
      <ToggleChoice
        title={panel.tissueTitle}
        options={panel.tissues}
        value={current.tissue}
        onChange={(tissue) => onEditSurface(tooth.fdi, activeSurface, { tissue })}
      />
      <ToggleChoice
        title={panel.cavitationTitle}
        options={panel.cavitations}
        value={current.cavitation}
        onChange={(cavitation) => onEditSurface(tooth.fdi, activeSurface, { cavitation })}
      />
      <ChoiceGroup
        title={panel.gradeTitle}
        options={panel.grades}
        value={current.grade}
        columns={4}
        onChange={(grade) => onEditSurface(tooth.fdi, activeSurface, { grade })}
      />
    </Stack>
  )
}

/** The small heading over a group of choices in a tooth panel. */
function ChoiceHeading({ id, children }: { id: string; children: string }) {
  return (
    <Typography
      id={id}
      variant="caption"
      component="h4"
      color="text.secondary"
      sx={{ display: 'block', fontWeight: 600, mb: 1 }}
    >
      {children}
    </Typography>
  )
}

/**
 * One surface in the cross: its grade — the tile's whole point, so all five
 * read at a glance — over its name. A dash, not a blank and not "C0", where
 * nothing has been graded: unassessed is not the same as sound.
 */
function CariesSurfaceTile({
  label,
  grade,
  ungraded,
  selected,
  cell,
  onSelect,
  mark,
  locked = false,
}: {
  label: string
  grade: CariesGrade | null
  ungraded: string
  selected: boolean
  cell: string
  onSelect: () => void
  /**
   * Shown as it is and not for changing — a veneer's buccal surface, which is
   * part of what a veneer IS. It keeps its place in the tab order and says
   * `aria-disabled`, so it is still read out as included; it just takes no
   * press, ripple or hover.
   */
  locked?: boolean
  /**
   * What stands over the name INSTEAD of a grade — the restoration form's
   * tick on a surface the restoration covers (`null` for one it does not).
   * With it, `ungraded` is read out as the tile's whole value: "Mesial,
   * included".
   */
  mark?: ReactNode
}) {
  return (
    <ButtonBase
      onClick={locked ? undefined : onSelect}
      aria-pressed={selected}
      aria-disabled={locked ? true : undefined}
      disableRipple={locked}
      aria-label={`${label}, ${mark !== undefined ? ungraded : (grade ?? ungraded)}`}
      sx={{
        cursor: locked ? 'default' : 'pointer',
        gridArea: cell,
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0.25,
        px: 1,
        py: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Typography
        variant="subtitle1"
        component="span"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // One line tall whether it holds a grade, a tick or the dash.
          minHeight: '1.75em',
          fontWeight: 700,
          color: mark ? 'primary.main' : grade ? 'error.dark' : 'text.disabled',
        }}
      >
        {mark !== undefined ? (mark ?? '—') : (grade ?? '—')}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: selected ? 'primary.main' : 'text.secondary', fontWeight: 600 }}
      >
        {label}
      </Typography>
    </ButtonBase>
  )
}

/**
 * An either/or question as ONE segmented control — MUI's ToggleButtonGroup,
 * exclusive, the two halves joined, in its stock look with a tick on the
 * chosen half. Pressing the chosen half again clears it
 * (the group reports `null`), so an entry made by mistake can be taken back to
 * "not recorded" rather than only swapped.
 */
function ToggleChoice<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: { id: T; label: string }[]
  value: T | null
  onChange: (value: T | null) => void
}) {
  const headingId = useId()
  return (
    <Box>
      <ChoiceHeading id={headingId}>{title}</ChoiceHeading>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={value}
        onChange={(_, next: T | null) => onChange(next)}
        aria-labelledby={headingId}
      >
        {options.map((option) => (
          <ToggleButton
            key={option.id}
            value={option.id}
            // Stock MUI selected state — no added border. The chosen half is
            // marked by a tick before its label, at the label's own size, so
            // the choice does not rest on the grey tint alone.
            sx={{ py: 1, gap: 0.5, textTransform: 'none' }}
          >
            {value === option.id && <Icon name="check" size="inherit" />}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}

/**
 * A pick-one question with more than two answers, as a row of separate
 * toggles under a heading. Pressing the chosen one again clears it.
 */
function ChoiceGroup<T extends string>({
  title,
  options,
  value,
  columns,
  onChange,
}: {
  title: string
  options: { id: T; label: string }[]
  value: T | null
  columns: number
  onChange: (value: T | null) => void
}) {
  const headingId = useId()
  return (
    <Box role="group" aria-labelledby={headingId}>
      <ChoiceHeading id={headingId}>{title}</ChoiceHeading>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 0.5 }}>
        {options.map((option, index) => (
          <ToggleButton
            key={option.id}
            value={option.id}
            selected={value === option.id}
            size="small"
            onChange={() => onChange(value === option.id ? null : option.id)}
            sx={{
              py: 1,
              textTransform: 'none',
              borderRadius: 1,
              // A last option left alone on its row takes the whole row,
              // rather than standing as half a pair.
              ...(index === options.length - 1 &&
                columns > 1 &&
                options.length % columns === 1 && { gridColumn: '1 / -1' }),
              ...CHOSEN_TOGGLE_SX,
            }}
          >
            {option.label}
          </ToggleButton>
        ))}
      </Box>
    </Box>
  )
}

/*
 * A chosen toggle has to be unmistakable: the stock selected state is a faint
 * grey tint that vanishes on these panels. Brand border — doubled by an inset
 * ring, so the button does not grow — brand text in bold, and a light brand
 * wash. Three cues, none of them colour alone.
 */
const CHOSEN_TOGGLE_SX = {
  '&.Mui-selected, &.Mui-selected:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: Theme) => `inset 0 0 0 1px ${theme.vars.palette.primary.main}`,
    color: 'primary.main',
    fontWeight: 700,
    bgcolor: (theme: Theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)`,
  },
} as const

// ─── RESTORATION FORM ─────────────────────────────────────────────────────

/** A restoration being charted through the panel, before it is saved. */
interface RestorationDraft {
  fdi: number
  /** Which kind — the id of an option in the form's `types`. */
  typeId: string
  surfaces: CariesSurface[]
  /** The surface picked last — the one the model turns to face. */
  focus: CariesSurface | null
  material: string | null
  quality: string | null
  detail: string | null
  /** Asked of a crown only — see the kind's `asks`. */
  crownType: string | null
  crownBase: string | null
}

/**
 * The form "Add restoration" opens, for the kind picked from its menu.
 *
 * Built like the caries form above it: the crown's five surfaces as a cross of
 * tiles, then the questions under them as rows of toggles. The difference is
 * what a tile means — a restoration COVERS surfaces, so the tiles here are
 * each on or off (ticked or not) rather than one being in hand.
 *
 * Nothing is kept until Save: unlike the caries and probing forms, this one
 * describes a record that does not exist yet.
 */
/**
 * How a restoration is painted on the model, from what the form holds: the
 * kind's own paint where it has one (a sealant), or its material's where the
 * kind is drawn as its material (a composite filling). `null` is "nothing to
 * paint it as yet" — the model washes its surfaces grey instead.
 */
function restorationPaint(
  restorations: RestorationChart,
  draft: RestorationDraft,
): RestorationPaintId | null {
  const { types, materials } = restorations.form
  const kind = types.find((option) => option.id === draft.typeId)
  if (!kind) return null
  if (kind.paint) return kind.paint
  if (!kind.paintFromMaterial) return null
  return materials.find((option) => option.id === draft.material)?.paint ?? null
}

function RestorationForm({
  tooth,
  caries,
  restorations,
  kind,
  draft,
  onChange,
}: {
  tooth: Tooth
  /** For the surface names, which the two charts share. */
  caries: CariesChart
  restorations: RestorationChart
  /** The kind being charted — it decides whether surfaces are asked for at all. */
  kind: RestorationKind
  draft: RestorationDraft
  onChange: (change: Partial<RestorationDraft>) => void
}) {
  const { form } = restorations
  const surfacesId = useId()
  const locked = kind.surfaceChoice === 'locked'
  // A kind that names its materials is offered only those, in the form's order.
  const materials = kind.materialIds
    ? form.materials.filter((option) => kind.materialIds?.includes(option.id))
    : form.materials

  const toggleSurface = (surface: CariesSurface) => {
    const surfaces = draft.surfaces.includes(surface)
      ? draft.surfaces.filter((item) => item !== surface)
      : // Kept in the cross's own order, whatever order they were ticked in.
        CARIES_SURFACE_ORDER.filter((item) => item === surface || draft.surfaces.includes(item))
    onChange({
      surfaces,
      // The model turns to the surface just ticked; unticking one hands the
      // view to whichever is left.
      focus: surfaces.includes(surface) ? surface : (surfaces[surfaces.length - 1] ?? null),
    })
  }

  return (
    <Stack spacing={2.5}>
      {/* Not asked of a crown: it covers the whole crown, so there is no
          surface to choose. A veneer shows the one surface it is, ticked and
          locked — the other four are not offered at all. */}
      {kind.surfaceChoice !== 'none' && (
        <Box role="group" aria-labelledby={surfacesId}>
          <ChoiceHeading id={surfacesId}>{form.surfacesTitle}</ChoiceHeading>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {(locked ? kind.defaultSurfaces : CARIES_SURFACE_ORDER).map((surface, index) => {
              const included = draft.surfaces.includes(surface)
              return (
                <CariesSurfaceTile
                  key={surface}
                  label={cariesSurfaceLabel(caries, tooth, surface)}
                  grade={null}
                  ungraded={included ? form.surfaceOn : form.surfaceOff}
                  selected={included}
                  // The cross is for choosing among five; a locked tile simply
                  // stands first in the row.
                  cell={locked ? `1 / ${index + 1}` : CARIES_SURFACE_CELL[surface]}
                  mark={included ? <Icon name="check" size={20} /> : null}
                  locked={locked}
                  onSelect={() => toggleSurface(surface)}
                />
              )
            })}
          </Box>
        </Box>
      )}

      <ChoiceGroup
        title={form.materialTitle}
        options={materials}
        value={draft.material}
        columns={2}
        onChange={(material) => onChange({ material })}
      />
      {/* Under Material, the groups this kind is asked, in its own order. */}
      {kind.asks.map((question) => {
        switch (question) {
          case 'quality':
            return (
              <ChoiceGroup
                key={question}
                title={form.qualityTitle}
                options={form.qualities}
                value={draft.quality}
                columns={3}
                onChange={(quality) => onChange({ quality })}
              />
            )
          case 'detail':
            return (
              <ChoiceGroup
                key={question}
                title={form.detailTitle}
                options={form.details}
                value={draft.detail}
                columns={3}
                onChange={(detail) => onChange({ detail })}
              />
            )
          case 'crownType':
            return (
              <ChoiceGroup
                key={question}
                title={form.crownTypeTitle}
                options={form.crownTypes}
                value={draft.crownType}
                columns={2}
                onChange={(crownType) => onChange({ crownType })}
              />
            )
          case 'crownBase':
            return (
              <ChoiceGroup
                key={question}
                title={form.crownBaseTitle}
                options={form.crownBases}
                value={draft.crownBase}
                columns={2}
                onChange={(crownBase) => onChange({ crownBase })}
              />
            )
        }
      })}
    </Stack>
  )
}

// ─── PERIO TOOTH PANEL ────────────────────────────────────────────────────

/**
 * Everything charted on ONE tooth, opened by picking it on the perio arch.
 *
 * This is the data-entry half of the perio chart: the arch shows where the
 * disease is, and this states it site by site and lets it be recorded. It only
 * exists on the Perio tab — on the dental chart a tooth selection means
 * something else entirely.
 *
 * Three states, worded differently on purpose:
 *   1. readings with findings → the six tiles, with what was seen at each site
 *   2. readings with nothing wrong → the tiles PLUS an explicit "no issues"
 *   3. no readings at all → "not yet probed", and no tiles
 *
 * Two and three must never look alike. "We probed it and it is healthy" and
 * "nobody has probed it" are different clinical facts, and a panel that
 * renders an unprobed tooth as six zeros invites the second to be read as the
 * first — which is how a missed pocket becomes a signed-off exam.
 */
function PerioForm({
  tooth,
  perio,
  reading,
  activeSite,
  onSiteChange,
  onEdit,
}: {
  tooth: Tooth
  perio: PerioChart
  /** `undefined` means never probed — not "probed and all zero". */
  reading: PerioToothReading | undefined
  /** The site in hand — owned by the parent, which also marks it on the arch. */
  activeSite: PerioSite
  onSiteChange: (site: PerioSite) => void
  /** Applied at once — entries are kept as they are made. */
  onEdit: (fdi: number, site: PerioSite, change: Partial<PerioSiteReading>) => void
}) {
  const labels = perio.siteLabels[tooth.arch]
  const [activeMeasureId, setActiveMeasureId] = useState(perio.measures[0].id)

  const conditionsId = useId()
  const measure = perio.measures.find((m) => m.id === activeMeasureId) ?? perio.measures[0]
  const site = reading?.sites[activeSite]
  const healthy = reading ? !hasPerioFindings(reading, perio.flagDepth) : false

  return (
      <Stack spacing={2}>
        {!reading ? (
          <Alert severity="info" variant="outlined">
            <AlertTitle sx={{ fontWeight: 700 }}>{perio.panel.unprobedTitle}</AlertTitle>
            {perio.panel.unprobedBody}
          </Alert>
        ) : (
          <>
            {healthy && (
              <Alert severity="success" variant="outlined">
                <AlertTitle sx={{ fontWeight: 700 }}>{perio.panel.healthyTitle}</AlertTitle>
                {perio.panel.healthyBody}
              </Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              {PERIO_SITE_ORDER.map((id) => (
                <PerioSiteTile
                  key={id}
                  label={labels[id]}
                  reading={reading.sites[id]}
                  perio={perio}
                  selected={id === activeSite}
                  onSelect={() => onSiteChange(id)}
                />
              ))}
            </Box>

            <Box>
              <Tabs
                value={activeMeasureId}
                onChange={(_, id: PerioMeasure['id']) => setActiveMeasureId(id)}
                variant="fullWidth"
                aria-label={perio.labels.site}
                sx={{ minHeight: 'auto', borderBottom: 1, borderColor: 'divider' }}
              >
                {perio.measures.map((option) => (
                  <Tab
                    key={option.id}
                    value={option.id}
                    // The unit rides in the tab's name, so the bare numbers on
                    // the pad below are never read without it.
                    label={`${option.label} (${perio.unit})`}
                    sx={{
                      minHeight: 44,
                      color: 'text.secondary',
                      '&.Mui-selected': { fontWeight: 700 },
                    }}
                  />
                ))}
              </Tabs>

              <PerioNumberPad
                measure={measure}
                value={site ? site[measure.id] : null}
                unit={perio.unit}
                onPick={(value) => onEdit(tooth.fdi, activeSite, { [measure.id]: value })}
              />
            </Box>

            <Box role="group" aria-labelledby={conditionsId}>
              <Typography
                id={conditionsId}
                variant="caption"
                component="h4"
                color="text.secondary"
                sx={{ display: 'block', fontWeight: 600, mb: 1 }}
              >
                {perio.panel.conditionsTitle}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {perio.conditions.map((condition) => {
                  const on = site?.conditions.includes(condition.id) ?? false
                  return (
                    <ToggleButton
                      key={condition.id}
                      value={condition.id}
                      selected={on}
                      size="small"
                      onChange={() => {
                        if (!site) return
                        onEdit(tooth.fdi, activeSite, {
                          conditions: on
                            ? site.conditions.filter((c) => c !== condition.id)
                            : [...site.conditions, condition.id],
                        })
                      }}
                      sx={{
                        flex: '1 1 0',
                        gap: 0.75,
                        px: 1.5,
                        textTransform: 'none',
                        borderRadius: 1,
                        ...CHOSEN_TOGGLE_SX,
                      }}
                    >
                      <ConditionDot condition={condition.id} filled={on} />
                      {condition.label}
                    </ToggleButton>
                  )
                })}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
  )
}

/**
 * The four observations, as their marks.
 *
 * Colour is the FAST cue, never the only one: every dot here sits beside its
 * own written label — on the chips that toggle it, and in the tile's
 * accessible description — so nothing is carried by hue alone. Tartar is drawn
 * as a ring rather than a fill, which separates it from the other three
 * without asking anyone to tell two neutrals apart.
 */
const CONDITION_CHANNEL: Record<PerioCondition, 'error' | 'info' | 'warning' | 'text'> = {
  bleeding: 'error',
  plaque: 'info',
  pus: 'warning',
  tartar: 'text',
}

function ConditionDot({ condition, filled }: { condition: PerioCondition; filled: boolean }) {
  const channel = CONDITION_CHANNEL[condition]
  const colour = channel === 'text' ? 'text.disabled' : `${channel}.main`

  return (
    <Box
      aria-hidden
      sx={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: colour,
        bgcolor: filled && channel !== 'text' ? colour : 'transparent',
      }}
    />
  )
}

/** One site: its two numbers, what was seen there, and its name. */
function PerioSiteTile({
  label,
  reading,
  perio,
  selected,
  onSelect,
}: {
  label: string
  reading: PerioSiteReading
  perio: PerioChart
  selected: boolean
  onSelect: () => void
}) {
  const flagged = reading.pocketDepth >= perio.flagDepth
  const seen = perio.conditions.filter((c) => reading.conditions.includes(c.id))

  // Spelled out for the screen reader, because the dots above are a glance
  // cue and the numbers alone do not say which measurement is which.
  const description = [
    label,
    `${perio.labels.pocket} ${reading.pocketDepth} ${perio.unit}`,
    `${perio.labels.recession} ${reading.recession} ${perio.unit}`,
    seen.length > 0 ? seen.map((c) => c.label).join(', ') : perio.panel.healthyTitle,
  ].join(', ')

  return (
    <Tooltip title={description}>
      <ButtonBase
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={description}
        sx={{
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0.25,
          px: 1,
          py: 1,
          borderRadius: 1,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? 'action.selected' : 'background.paper',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <Stack direction="row" spacing={0.375} sx={{ minHeight: 10, alignItems: 'center' }}>
          {seen.map((condition) => (
            <ConditionDot key={condition.id} condition={condition.id} filled />
          ))}
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: flagged ? 'error.dark' : 'text.primary',
            }}
          >
            {reading.pocketDepth}
          </Typography>
          <Box component="span" sx={{ color: 'divider' }}>
            |
          </Box>
          <Typography
            variant="subtitle1"
            sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
          >
            {reading.recession}
          </Typography>
        </Stack>

        <Typography
          variant="caption"
          sx={{ color: selected ? 'primary.main' : 'text.secondary', fontWeight: 600 }}
        >
          {label}
        </Typography>
      </ButtonBase>
    </Tooltip>
  )
}

/** The keypad for whichever measurement is in hand. */
function PerioNumberPad({
  measure,
  value,
  unit,
  onPick,
}: {
  measure: PerioMeasure
  value: number | null
  unit: string
  onPick: (value: number) => void
}) {
  const keys = [
    ...measure.values.map((v) => ({ value: v, label: String(v) })),
    ...(measure.overflow ? [measure.overflow] : []),
  ]

  return (
    <Box
      role="group"
      aria-label={`${measure.label} (${unit})`}
      sx={{
        mt: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 0.5,
      }}
    >
      {keys.map((key) => (
        <ToggleButton
          key={key.value}
          value={key.value}
          selected={value === key.value}
          size="small"
          onChange={() => onPick(key.value)}
          sx={{
            py: 1,
            textTransform: 'none',
            fontVariantNumeric: 'tabular-nums',
            borderRadius: 1,
          }}
        >
          {key.label}
        </ToggleButton>
      ))}
    </Box>
  )
}

/**
 * The tooth picker down the side of the panel.
 *
 * Numbered in UNIVERSAL, matching the badges on the arch and the panel's own
 * heading — a rail that counted in FDI while the model counted 1–32 would be
 * two numbering systems on one screen, which is the single easiest way to
 * treat the wrong tooth.
 */
function ToothRail({
  teeth,
  selectedFdi,
  label,
  flags = [],
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number
  /** Names the list for a screen reader. */
  label: string
  /**
   * The sets of teeth to mark with a dot, one dot per set a tooth is in. Each
   * set's `label` is read out after the tooth's number and is what says what
   * its dot means; the colour only tells one set's dots from another's.
   */
  flags?: RailFlag[]
  onSelect: (fdi: number) => void
}) {
  const rail = useRef<HTMLUListElement>(null)
  // Which ends still have rows past them, so each fade shows only where there
  // is actually more to scroll to.
  const [more, setMore] = useState({ above: false, below: false })

  /*
   * Ascending by the number the rail SHOWS (Universal 1–32). The order is
   * re-sorted, never the numbers — each row still names its own tooth, and the
   * selection is still keyed by FDI underneath.
   */
  const ordered = useMemo(
    () => [...teeth].sort((a, b) => universalFromFdi(a.fdi) - universalFromFdi(b.fdi)),
    [teeth],
  )

  const measure = () => {
    const el = rail.current
    if (!el) return
    const above = el.scrollTop > 1
    const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1
    setMore((prev) => (prev.above === above && prev.below === below ? prev : { above, below }))
  }

  /*
   * Keep the picked tooth in view — picking one on the arch can select a row
   * that is scrolled out of sight. CENTRED, not merely "nearest": a row at the
   * very edge would sit under the fade. Set on `scrollTop` directly because
   * `scrollIntoView` also scrolls every scrollable ancestor, page included.
   * Re-run when the rail resizes, since the panel settles its height after.
   */
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const centre = () => {
      const row = el.querySelector<HTMLElement>('[aria-current="true"]')
      if (row) el.scrollTop = row.offsetTop - (el.clientHeight - row.offsetHeight) / 2
      measure()
    }
    centre()
    const observer = new ResizeObserver(centre)
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedFdi])

  /*
   * The fades replace the old up/down chevrons: the list's own ends dissolve
   * into the grey, which says "there is more this way" without two buttons'
   * worth of chrome. A mask rather than a gradient overlay, so it fades the
   * rows themselves and never sits on top of a click.
   */
  const fade = 'calc(var(--mui-spacing) * 4)'
  const mask = `linear-gradient(to bottom, ${
    more.above ? `transparent, #000 ${fade}` : '#000, #000'
  }, ${more.below ? `#000 calc(100% - ${fade}), transparent` : '#000'})`

  return (
    <Box
      sx={{
        width: 52,
        flexShrink: 0,
        display: 'flex',
        minHeight: 0,
        // A step darker than the page grey, so the rail reads as its own
        // strip beside the white panel rather than as a paler part of it.
        bgcolor: 'grey.300',
      }}
    >
      <List
        ref={rail}
        dense
        aria-label={label}
        onScroll={measure}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 0,
          py: 1,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {ordered.map((tooth) => {
          const selected = tooth.fdi === selectedFdi
          const marks = flags.filter((flag) => flag.teeth.has(tooth.fdi))
          return (
            <ListItemButton
              key={tooth.fdi}
              selected={selected}
              aria-current={selected ? 'true' : undefined}
              aria-label={
                marks.length > 0
                  ? [universalFromFdi(tooth.fdi), ...marks.map((mark) => mark.label)].join(', ')
                  : undefined
              }
              onClick={() => onSelect(tooth.fdi)}
              sx={{
                position: 'relative',
                justifyContent: 'center',
                px: 0,
                py: 0.75,
                // Edge to edge: the chip spans the rail's full width.
                borderRadius: 0,
                // The full text colour: the lighter grey used on the paler
                // rail fell under readable contrast on this darker one.
                color: 'text.primary',
                fontVariantNumeric: 'tabular-nums',
                // The picked tooth is a raised white bar on the grey rail, in
                // bold — lighter than the brand fill, which the panel already
                // spends on Save. Not colour alone: weight, surface and shadow
                // all change. `&&` out-specifies MUI's own selected tints.
                '&&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  boxShadow: 2,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 500 }}>
                {universalFromFdi(tooth.fdi)}
              </Typography>
              {/* A dot beside the number for each thing the tooth already
                  carries — where to look first in a list of thirty-two. One
                  above the other when there are two, so neither runs into the
                  number. The row's label says the same in words. */}
              {marks.length > 0 && (
                <Stack
                  aria-hidden
                  spacing={0.25}
                  sx={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {marks.map((mark) => (
                    <Box
                      key={mark.id}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: RAIL_FLAG_COLOUR[mark.tone],
                      }}
                    />
                  ))}
                </Stack>
              )}
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}

const ARCH_VIEW_LABELS: Record<ArchView, string> = {
  upper: 'Upper arch only',
  both: 'Both arches',
  lower: 'Lower arch only',
}

function ArchSelector({
  views,
  active,
  onChange,
  upperVisible,
  lowerVisible,
}: {
  views: ArchView[]
  active: ArchView
  onChange: (view: ArchView) => void
  upperVisible: boolean
  lowerVisible: boolean
}) {
  /** Each row previews what it would show, so the icons read at a glance. */
  const filledFor: Record<ArchView, boolean> = {
    upper: upperVisible,
    both: true,
    lower: lowerVisible,
  }

  return (
    <Stack
      role="group"
      aria-label="Arches shown"
      sx={{
        // Sits on the pointer-transparent aside layer, so it re-arms itself.
        pointerEvents: 'auto',
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        // One segmented control: the segments fill the container edge to edge,
        // with no inner padding and square corners of their own. Only the
        // container is rounded, and it clips the end segments to that curve.
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {views.map((view) => {
        const isActive = view === active
        return (
          <Tooltip key={view} title={ARCH_VIEW_LABELS[view]} placement="right">
            <ButtonBase
              onClick={() => onChange(view)}
              aria-pressed={isActive}
              aria-label={ARCH_VIEW_LABELS[view]}
              sx={{
                width: 48,
                height: 36,
                borderRadius: 0,
                color: isActive ? 'primary.main' : 'text.disabled',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: isActive ? 'action.selected' : 'action.hover' },
                // The `lower` row's arch curves the other way.
                '& svg': { transform: view === 'lower' ? 'scaleY(-1)' : undefined },
              }}
            >
              <ArchGlyph filled={isActive || filledFor[view]} both={view === 'both'} />
            </ButtonBase>
          </Tooltip>
        )
      })}
    </Stack>
  )
}

function CornerAction({
  item,
  expanded,
  onClick,
}: {
  item: RailItem
  /** Set when the button opens a popup — announces whether it is open. */
  expanded?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}) {
  return (
    <Tooltip title={item.label} placement="right">
      <IconButton
        aria-label={item.label}
        onClick={onClick}
        aria-haspopup={expanded === undefined ? undefined : 'dialog'}
        aria-expanded={expanded}
        sx={{
          width: 52,
          height: 52,
          color: 'text.disabled',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          /*
           * Frosted, not solid and not see-through: these two float over the
           * model, so a clear button let the teeth run straight through the
           * glyph, and a white disc would punch a hole in the arch. A
           * translucent paper fill with the model blurred behind it keeps the
           * icon legible wherever the arch has been turned to.
           */
          bgcolor: (theme) => `rgba(${theme.vars.palette.background.paperChannel} / 0.6)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          '&:hover': {
            color: 'primary.main',
            borderColor: 'primary.main',
            bgcolor: (theme) => `rgba(${theme.vars.palette.background.paperChannel} / 0.8)`,
          },
        }}
      >
        <Icon name={item.icon} size={24} />
      </IconButton>
    </Tooltip>
  )
}

// ─── CHART HELP ───────────────────────────────────────────────────────────

/** localStorage key for "the first-visit tip has been dismissed". */
const TIP_SEEN_KEY = 'emr-dental:chart-tip-seen'

// Storage can be missing or throw (private windows, blocked site data); the
// tip then simply shows again next visit, which is the safe failure.
function readTipSeen() {
  try {
    return window.localStorage.getItem(TIP_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function writeTipSeen() {
  try {
    window.localStorage.setItem(TIP_SEEN_KEY, '1')
  } catch {
    // Not persisted; see `readTipSeen`.
  }
}

/** The gestures, with the tooth click re-worded for the current chart tab. */
function gesturesFor(help: ChartHelp, selectHint: string | null) {
  return help.gestures.map((item) =>
    item.id === 'select' && selectHint ? { ...item, action: selectHint } : item,
  )
}

/**
 * The one-time tip on a first visit: every gesture on one line, beside the
 * control strip whose "?" holds them for good. Dismissing it — or opening the full help —
 * stores that it was seen.
 */
function ChartTip({
  help,
  selectHint,
  onClose,
}: {
  help: ChartHelp
  selectHint: string | null
  onClose: () => void
}) {
  const gestures = gesturesFor(help, selectHint)
  return (
    <Alert
      severity="info"
      variant="outlined"
      onClose={onClose}
      slotProps={{ closeButton: { 'aria-label': help.dismissLabel } }}
      sx={{ bgcolor: 'background.paper', py: 0, alignItems: 'center' }}
    >
      <Typography variant="body2">
        <Box component="strong" sx={{ fontWeight: 600 }}>
          {help.tipTitle}:
        </Box>{' '}
        {gestures.map((item) => `${item.gesture} to ${item.short}`).join(' · ')}
      </Typography>
    </Alert>
  )
}

/** The full help behind the "?" button: each gesture and what it does. */
function ChartHelpPopover({
  help,
  selectHint,
  anchor,
  onClose,
}: {
  help: ChartHelp
  selectHint: string | null
  anchor: HTMLElement | null
  onClose: () => void
}) {
  const gestures = gesturesFor(help, selectHint)
  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      // Opens to the RIGHT of the control strip, which stands on the card's left edge.
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{
        paper: { role: 'dialog', 'aria-label': help.title, sx: { ml: 1.5, p: 2.5, width: 300 } },
      }}
    >
      <Typography variant="subtitle2" component="h3" sx={{ mb: 1.5 }}>
        {help.title}
      </Typography>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 2,
          rowGap: 1,
        }}
      >
        {gestures.map((item) => (
          <Fragment key={item.id}>
            <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>
              {item.gesture}
            </Typography>
            <Typography component="dd" variant="body2" color="text.secondary" sx={{ m: 0 }}>
              {item.action}
            </Typography>
          </Fragment>
        ))}
      </Box>
    </Popover>
  )
}

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function PatientChart({
  section,
  onOpenSection,
  onOpenPatients,
  onOpenDetails,
  onNavigate,
}: {
  /**
   * Which section of the record fills the right of the screen — the `id` of a
   * tab in the sidebar. The patient sidebar is on the left for every one of
   * them; only what is beside it changes. `details` is the exception: it
   * opens the patient's details as a dialog over the section already up.
   */
  section: string
  /** A section was picked in the sidebar; the app puts it in the URL. */
  onOpenSection: (id: string) => void
  /** Leaves the record for the Patients list — the breadcrumb calls it. */
  onOpenPatients: () => void
  /** Opens the patient's full details — the button under the allergies. */
  onOpenDetails: () => void
  /** A rail item was picked; the app decides whether it leads anywhere. */
  onNavigate: (id: string) => void
}) {
  /*
   * Keep a trackpad pinch from zooming the PAGE.
   *
   * On the 3D canvas a pinch zooms the model — OrbitControls takes the
   * gesture. Anywhere else it went to the browser: the whole page magnified by
   * a few percent and slid sideways, the app rail went off the left edge — its
   * box still 88px wide, its icons cut in half — and with scrollbars hidden
   * and no API to reset a pinch-zoom, there was no visible way back.
   *
   * On the whole screen rather than just the chart card, because a pinch aimed
   * at the model routinely starts a few pixels outside it. Browser zoom
   * (Cmd/Ctrl +/−) is untouched, which is the zoom people who need larger text
   * rely on, and unlike a pinch it reflows the layout instead of cropping it.
   */
  useEffect(() => {
    // Chrome and Firefox report a trackpad pinch as a wheel event with ctrlKey.
    const stopPinch = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault()
    }
    // Safari reports it as its own gesture events instead.
    const stopGesture = (event: Event) => event.preventDefault()
    document.addEventListener('wheel', stopPinch, { passive: false })
    document.addEventListener('gesturestart', stopGesture)
    document.addEventListener('gesturechange', stopGesture)
    return () => {
      document.removeEventListener('wheel', stopPinch)
      document.removeEventListener('gesturestart', stopGesture)
      document.removeEventListener('gesturechange', stopGesture)
    }
  }, [])

  /*
   * The section under the details dialog: the one that was up when it opened.
   * Remembered here — updated during render whenever a real section is up —
   * so opening the details changes nothing beneath them. That matters most on
   * the chart, whose panel holds everything charted in this sitting: it has to
   * stay MOUNTED under the dialog, or closing the details would hand back an
   * emptied chart.
   */
  const detailsOpen = section === DETAILS_SECTION
  const [under, setUnder] = useState(detailsOpen ? DEFAULT_SECTION : section)
  if (!detailsOpen && under !== section) setUnder(section)

  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        /*
         * The viewport is the CEILING, not just the floor.
         *
         * Was `minHeight`, which let the page grow past the viewport — fine
         * while the chart was the only thing here, but the perio panel is tall
         * enough to push the arch's canvas off the bottom of the screen, and a
         * 3D view you have to scroll to is not a 3D view. Pinning the height
         * makes the panel scroll inside itself instead, and gives the canvas a
         * bounded box to frame the arch against.
         */
        height: '100vh',
        // `clip`, not `hidden`: a hidden box can still be SCROLLED — by focus
        // landing on something past its edge, or a script — which slides the
        // whole page sideways and takes the rail off-screen with no scrollbar
        // to bring it back. A clipped box cannot scroll at all.
        overflow: 'clip',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Rail rail={patientChart.rail} onSelect={onNavigate} />
      <Stack
        direction="row"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          // Lets the chart row shrink inside the pinned height rather than
          // forcing the column open at its content's size.
          minHeight: 0,
          p: (theme) => theme.layout.gutter,
          // Gap between the cards is two thirds of the page gutter. `gap`
          // rather than Stack's `spacing` prop, which takes no theme callback.
          gap: (theme) => theme.spacing((theme.layout.gutter * 2) / 3),
        }}
      >
        {/* The patient block: on the left of EVERY section of the record. */}
        <PatientSidebar
          activeTabId={under}
          onSelectTab={onOpenSection}
          onOpenPatients={onOpenPatients}
          onOpenDetails={onOpenDetails}
        />
        {under === 'imaging' ? <ImagingPanel /> : <ChartPanel />}
      </Stack>

      {/* Closing goes back to the section underneath — by its address, so the
          URL never keeps saying "details" over a closed dialog. */}
      <PatientDetailsDialog open={detailsOpen} onClose={() => onOpenSection(under)} />
    </Box>
  )
}
