import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { darken, lighten, type Theme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import CachedOutlined from '@mui/icons-material/CachedOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CallOutlined from '@mui/icons-material/CallOutlined'
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined'
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ContactMailOutlined from '@mui/icons-material/ContactMailOutlined'
import ContactPageOutlined from '@mui/icons-material/ContactPageOutlined'
import ContentPasteOutlined from '@mui/icons-material/ContentPasteOutlined'
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import DynamicFormOutlined from '@mui/icons-material/DynamicFormOutlined'
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined'
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined'
import FemaleOutlined from '@mui/icons-material/FemaleOutlined'
import ForwardToInboxOutlined from '@mui/icons-material/ForwardToInboxOutlined'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import HelpOutlined from '@mui/icons-material/HelpOutlined'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import HubOutlined from '@mui/icons-material/HubOutlined'
import KeyboardTabOutlined from '@mui/icons-material/KeyboardTabOutlined'
import LibraryBooksOutlined from '@mui/icons-material/LibraryBooksOutlined'
import MaleOutlined from '@mui/icons-material/MaleOutlined'
import MedicationOutlined from '@mui/icons-material/MedicationOutlined'
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import NearMeOutlined from '@mui/icons-material/NearMeOutlined'
import NotificationImportantOutlined from '@mui/icons-material/NotificationImportantOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import PhotoOutlined from '@mui/icons-material/PhotoOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import PostAddOutlined from '@mui/icons-material/PostAddOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import ScienceOutlined from '@mui/icons-material/ScienceOutlined'
import SentimentSatisfiedAltOutlined from '@mui/icons-material/SentimentSatisfiedAltOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import ShareOutlined from '@mui/icons-material/ShareOutlined'
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined'
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import VaccinesOutlined from '@mui/icons-material/VaccinesOutlined'
import ViewInArOutlined from '@mui/icons-material/ViewInArOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'

import logo from '../assets/EMRdentallogo.svg'
import {
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
  type CariesFinding,
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
  type PatientField,
  type PatientTab,
  type PerioChart,
  type PerioCondition,
  type PerioMeasure,
  type PerioSite,
  type PerioSiteReading,
  type PerioToothReading,
  type PostCoreChart,
  type RailItem,
  type Tooth,
} from '../data/patientChart.ts'
import { ArchGlyph } from './ArchGlyph.tsx'
import { CARIES_PAINT, ENDO_PAINT, IMPLANT_PAINT, POST_PAINT } from './toothScene.ts'
import { ToothArch3D, type ChartLayerVisibility } from './ToothArch.tsx'

/** The one place icon names from the dataset become components. */
const ICONS: Record<IconName, SvgIconComponent> = {
  schedule: CalendarMonthOutlined,
  operations: HubOutlined,
  tasks: ContentPasteOutlined,
  billing: CreditCardOutlined,
  settings: SettingsOutlined,
  patients: ContactPageOutlined,
  referrals: LibraryBooksOutlined,
  contacts: ContactMailOutlined,
  treatmentPlans: EditNoteOutlined,
  inventory: ShoppingBasketOutlined,
  pharmacy: VaccinesOutlined,
  library: MenuBookOutlined,
  notes: StickyNote2Outlined,
  support: SupportAgentOutlined,
  collapse: KeyboardTabOutlined,
  recall: CachedOutlined,
  newForm: PostAddOutlined,
  message: ForwardToInboxOutlined,
  call: CallOutlined,
  sexFemale: FemaleOutlined,
  sexMale: MaleOutlined,
  general: PersonOutlined,
  photos: PhotoOutlined,
  charts: BarChartOutlined,
  eclaims: NearMeOutlined,
  ledger: DescriptionOutlined,
  implantExam: ReceiptLongOutlined,
  smile: SentimentSatisfiedAltOutlined,
  checklists: CheckBoxOutlined,
  lab: ScienceOutlined,
  imaging: AddPhotoAlternateOutlined,
  erx: MedicationOutlined,
  docs: ArticleOutlined,
  forms: DynamicFormOutlined,
  alerts: NotificationImportantOutlined,
  clinicalNotes: AssignmentIndOutlined,
  sharedCare: ShareOutlined,
  sPad: EditNoteOutlined,
  hidden: VisibilityOffOutlined,
  history: HistoryOutlined,
  help: HelpOutlined,
  close: CloseOutlined,
  previousTooth: ChevronLeftOutlined,
  nextTooth: ChevronRightOutlined,
  back: ArrowBackOutlined,
  more: MoreHorizOutlined,
  layers: LayersOutlined,
  view3d: ViewInArOutlined,
  dropdown: ExpandMoreOutlined,
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const Component = ICONS[name]
  return <Component sx={{ fontSize: size }} />
}

// ─── APP RAIL ─────────────────────────────────────────────────────────────

function Rail() {
  const { groups, footer } = patientChart.rail
  const [activeId, setActiveId] = useState(patientChart.rail.activeItemId)

  return (
    <Stack
      component="nav"
      aria-label="Sections"
      sx={{
        width: (theme) => theme.layout.railWidth,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        overflowY: 'auto',
        py: 2,
        alignItems: 'center',
      }}
    >
      <Box sx={{ mb: 2, display: 'grid', placeItems: 'center' }}>
        <Box component="img" src={logo} alt="EMR Dental" sx={{ width: 34, height: 34 }} />
      </Box>

      {groups.map((group, index) => (
        <Stack key={group.id} sx={{ width: '100%', alignItems: 'center' }}>
          {index > 0 && <Divider flexItem sx={{ my: 1.5, mx: 2 }} />}
          {group.items.map((item) => (
            <RailButton
              key={item.id}
              item={item}
              active={item.id === activeId}
              onClick={() => setActiveId(item.id)}
            />
          ))}
        </Stack>
      ))}

      <Box sx={{ flexGrow: 1, minHeight: 24 }} />
      <RailButton item={footer} active={false} onClick={() => {}} />
    </Stack>
  )
}

function RailButton({
  item,
  active,
  onClick,
}: {
  item: RailItem
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip title={item.label} placement="right">
      <ButtonBase
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        sx={{
          position: 'relative',
          width: (theme) => theme.layout.iconButton,
          height: (theme) => theme.layout.iconButton,
          my: 0.25,
          borderRadius: 1.5,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? 'action.selected' : 'transparent',
          transition: (theme) => theme.transitions.create(['background-color', 'color']),
          '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
          // The active item also gets a bar in the rail's left margin.
          '&::before': active
            ? {
                content: '""',
                position: 'absolute',
                left: (theme) => theme.spacing(-2),
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: 26,
                borderRadius: 1,
                bgcolor: 'primary.main',
              }
            : undefined,
        }}
      >
        <Icon name={item.icon} />
      </ButtonBase>
    </Tooltip>
  )
}

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
 * Space kept under the EXPANDED tab list so the floating toggle never covers
 * the last row, in spacing units — the toggle's height plus its inset.
 */
const TOGGLE_BAND = 9

function PatientSidebar() {
  const { patient } = patientChart
  const [activeTabId, setActiveTabId] = useState(patient.activeTabId)

  // Every section in one list, the practice's chosen ones (`primary`) first.
  // How many of them show at rest is decided by the space, not the data.
  const orderedTabs = [
    ...patient.tabs.filter((tab) => tab.primary),
    ...patient.tabs.filter((tab) => !tab.primary),
  ]
  const [showAll, setShowAll] = useState(false)
  /** How many whole rows fit the tab region at rest. Measured, see below. */
  const [fitCount, setFitCount] = useState(orderedTabs.length)
  const tabListId = useId()
  const scroller = useRef<HTMLDivElement>(null)

  // Count the rows that fit: the nav region's height, less its top padding,
  // over one row's height (including its margin). The floating toggle does NOT
  // reserve a band at rest — it sits over the bottom of the list, covering part
  // of the last row if it must, so the region stays full rather than ending in
  // a gap. Re-measured on every resize, so a taller window shows more tabs.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const row = el.querySelector<HTMLElement>('[data-tab-row]')
      if (!row) return
      const rowHeight =
        row.getBoundingClientRect().height + parseFloat(getComputedStyle(row).marginBottom)
      const top = parseFloat(getComputedStyle(el).paddingTop)
      const fits = Math.floor((el.clientHeight - top) / rowHeight)
      setFitCount(Math.max(1, Math.min(fits, orderedTabs.length)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [orderedTabs.length])

  const overflows = fitCount < orderedTabs.length
  // At rest, the rows that fit — with the active section swapped into the last
  // slot if it sits below the fold, so the current place is never hidden.
  const restingTabs = (() => {
    const head = orderedTabs.slice(0, fitCount)
    if (head.some((tab) => tab.id === activeTabId)) return head
    const active = orderedTabs.find((tab) => tab.id === activeTabId)
    return active ? [...head.slice(0, -1), active] : head
  })()
  const shownTabs = showAll || !overflows ? orderedTabs : restingTabs

  // Expanding scrolls the region to the first newly revealed row; collapsing
  // returns it to the top. Only the tab region scrolls — the patient block
  // above it stays put.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = reduceMotion ? 'auto' : 'smooth'
    if (!showAll) {
      el.scrollTo({ top: 0 })
      return
    }
    const first = el.querySelector<HTMLElement>(`[data-tab-index="${fitCount}"]`)
    if (!first) return
    const top = parseFloat(getComputedStyle(el).paddingTop)
    const offset = first.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
    el.scrollTo({ top: offset - top, behavior })
    // Scroll only on the toggle, not when a resize changes `fitCount`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll])

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
            data-tab-row
            data-tab-index={orderedTabs.indexOf(tab)}
            selected={active}
            onClick={tab.available ? () => setActiveTabId(tab.id) : undefined}
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
          <ButtonBase
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

        {/* Six fields in a two-column grid, read across in the record's own
            pairs: provider/phone, the two insurances, last/next visit. A column
            is 120px wide, so values may wrap rather than truncate — a clipped
            provider name or insurance date is worse than a second line. */}
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
        </Box>
      </Stack>

      <Divider />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      {/* The only scrolling region. At rest it shows as many sections as fit
          its height, and a floating toggle reveals the rest IN PLACE — the list
          grows and this region scrolls, while everything above stays put. */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
        <Box
          ref={scroller}
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1.5,
            pt: 2,
            // Expanded, room under the last row so the toggle never covers it;
            // at rest the toggle may overlap the bottom row (see the measure).
            pb: showAll ? TOGGLE_BAND : 0,
            overflowY: showAll ? 'auto' : 'hidden',
          }}
        >
          <List id={tabListId} component="nav" aria-label="Patient record sections" disablePadding>
            {shownTabs.map(renderTab)}
          </List>
        </Box>

        {/* Floats over the list; hidden (and out of the tab order and the
            accessibility tree) when every section fits. */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowAll((open) => !open)}
          aria-expanded={showAll}
          aria-controls={tabListId}
          endIcon={
            <Box
              component="span"
              sx={{
                display: 'flex',
                transition: (theme) => theme.transitions.create('transform'),
                transform: showAll ? 'rotate(180deg)' : 'none',
              }}
            >
              <Icon name="dropdown" size={18} />
            </Box>
          }
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: (theme) => theme.spacing(2),
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper', boxShadow: 4 },
            visibility: overflows ? 'visible' : 'hidden',
          }}
        >
          {showAll ? patient.lessLabel : patient.moreLabel}
        </Button>
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
          sx={{ fontWeight: 500, textAlign: 'left' }}
        >
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

// ─── ODONTOGRAM ───────────────────────────────────────────────────────────

/**
 * The odontogram is the dentition in 3D and nothing else.
 *
 * The numbered grid of flat tooth rows this panel used to carry was removed:
 * both views drew the same 32 meshes out of `teeth.glb`, and the arch is the
 * one that shows where a tooth actually sits. What remains of the chart around
 * it is the mode row, the arch selector and the corner actions.
 */
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
  const { caries, implants } = odontogram

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
  const selectedLesions = selectedTooth ? (lesions.get(selectedTooth.fdi) ?? []) : []
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
   * The panel edits a DRAFT of its tooth; nothing reaches the arch, the
   * badges or the caption until Save. A draft for any tooth other than the
   * one in the panel is stale and ignored.
   */
  const [perioDraft, setPerioDraft] = useState<PerioToothReading | null>(null)

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
  const savedPanelReading = panelTooth ? perioReadingByFdi.get(panelTooth.fdi) : undefined
  const liveDraft = perioDraft && perioDraft.fdi === panelTooth?.fdi ? perioDraft : null
  const panelReading = liveDraft ?? savedPanelReading
  const perioDirty =
    liveDraft !== null && JSON.stringify(liveDraft) !== JSON.stringify(savedPanelReading)

  /**
   * Record one site in the draft. Only ever touches the tooth and site named —
   * a probing sequence edits one site at a time, and rewriting a whole tooth
   * would silently carry stale values for the five sites not in hand.
   */
  const editPerioSite = (fdi: number, site: PerioSite, change: Partial<PerioSiteReading>) => {
    setPerioDraft((current) => {
      const base = current && current.fdi === fdi ? current : perioReadingByFdi.get(fdi)
      if (!base) return current
      return { ...base, sites: { ...base.sites, [site]: { ...base.sites[site], ...change } } }
    })
  }

  const savePerio = () => {
    if (!liveDraft) return
    setPerioReadings((current) =>
      current.map((reading) => (reading.fdi === liveDraft.fdi ? liveDraft : reading)),
    )
    setPerioDraft(null)
  }

  /*
   * The ONE way anything leaves the tooth in the panel — Previous/Next, the
   * rail, close, a click on the arch, a tab, view or arch change. With unsaved
   * edits it parks the move and asks first; otherwise it just goes.
   */
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)
  const guard = (leave: () => void) => {
    if (perioDirty) setPendingLeave(() => leave)
    else leave()
  }
  const settleLeave = (save: boolean) => {
    if (save) savePerio()
    else setPerioDraft(null)
    pendingLeave?.()
    setPendingLeave(null)
  }

  // Closing or reloading the tab is a way to leave too, and the one the guard
  // above cannot see; the browser's own prompt covers it.
  useEffect(() => {
    if (!perioDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [perioDirty])

  return (
      <Paper
        component="section"
        // The visible title gave way to the chart tabs; the section keeps it
        // as its accessible name.
        aria-label={title}
        elevation={0}
        sx={{
          p: 4,
          position: 'relative',
          // The model layer bleeds out past the padding to the card's edges;
          // this is what trims it back to the rounded corner.
          overflow: 'hidden',
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
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        {/* Chart tabs lead where the title used to be — they ARE the panel's
            heading now, naming which reading of the arch is on screen — and
            the two menus sit flush right. */}
        <Tabs
          value={chartId}
          /*
           * The selection deliberately SURVIVES the tab change.
           *
           * Changing chart type must leave the 3D exactly where it was, and
           * the camera flies home whenever the selection is dropped — so
           * clearing here would read as a deselect and throw the view away on
           * every switch. Each chart is a different reading of the same tooth,
           * so holding it is also the truer behaviour: the perio panel simply
           * appears or disappears around a tooth that stays picked.
           */
          onChange={(_, id: string) => guard(() => setChartId(id))}
          aria-label="Chart type"
          sx={{ minHeight: 'auto' }}
        >
          {odontogram.charts.map((chart) => (
            <Tab
              key={chart.id}
              value={chart.id}
              label={chart.label}
              disabled={!chart.enabled}
              icon={chart.icon ? <Icon name={chart.icon} size={20} /> : undefined}
              iconPosition="end"
              sx={{
                minWidth: 0,
                px: 1.5,
                color: 'text.secondary',
                '&.Mui-selected': { color: 'text.primary', fontWeight: 600 },
              }}
            />
          ))}
        </Tabs>

        {/* `stretch` so the arch selector takes the menus' height exactly. */}
        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto', alignItems: 'stretch' }}>
          <ArchSelector
            views={odontogram.archViews}
            active={archView}
            onChange={(next) => guard(() => setArchView(next))}
            upperVisible={showUpper}
            lowerVisible={showLower}
          />
          <ChartLayersMenu layers={odontogram.layers} state={layers} onChange={setLayers} />
          <ViewMenu
            views={odontogram.views}
            active={view}
            onChange={(id) =>
              guard(() => {
                setViewId(id)
                /*
                 * Picking a standing view is a step BACK to the whole arch, so
                 * it lets go of any tooth. That also does the camera work: the
                 * flight home is already what a deselect orders, and it aims
                 * along whichever direction is current — so the view change and
                 * the return are one glide rather than two fighting each other.
                 */
                setSelectedFdi(null)
              })
            }
          />
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
        Paper has no border, so that box IS the card — the `p: 4` insets
        children in the flow, not this one. Cancelling the padding with a
        negative inset overshoots by 64px and quietly throws the model off
        centre inside a canvas the card then has to clip.

        Everything else — the header, the asides, the footer — now floats over
        it on `zIndex: 1`.
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
          teeth={teeth}
          selectedFdi={selectedFdi}
          perio={perio}
          perioReadings={perioReadings}
          caries={caries}
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
          focusSite={panelTooth ? activeSite : null}
          // Relative to the framed distance, which already carries the default
          // 30% step in — so this is the further step taken when a single
          // tooth is opened, not the whole zoom.
          zoom={selectedTooth ? 0.85 : 1}
          viewDirection={view.direction}
          show={show}
          onSelect={(fdi) => guard(() => setSelectedFdi(fdi))}
        />
      </Box>

      {/*
        The layer the asides sit on. Takes the same space the model used to,
        so the legend and the arch selector keep the positions they had — but
        it is TRANSPARENT TO THE POINTER, or it would swallow every drag meant
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
          Floated OVER the arch, not beside it. As a column in a row it stole
          width from the model and squeezed the chart into whatever was left;
          overlaying keeps the canvas at full size underneath and lets the
          camera's own move — front on, stepped in — be what makes room for
          the panel. `elevation` rather than a border, because the thing it
          has to say is that it is above the model, not part of it.
        */}
        {panelTooth && perio && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              // Clear of the chart tabs above it by one 16px step.
              top: (theme) => theme.spacing(2),
              bottom: 0,
              zIndex: 2,
              display: 'flex',
              maxWidth: '100%',
              // The layer above is pointer-transparent; the panel is not.
              pointerEvents: 'auto',
            }}
          >
            <PerioToothPanel
              // Remounting on the tooth resets which measurement is in hand
              // (the site resets in `siteInHand`, keyed to the tooth). Carrying
              // "recession" across to the next tooth would put the next
              // keypress on a measure nobody chose.
              key={panelTooth.fdi}
              tooth={panelTooth}
              perio={perio}
              reading={panelReading}
              dirty={perioDirty}
              activeSite={activeSite}
              onSiteChange={(site) => setSiteInHand({ fdi: panelTooth.fdi, site })}
              teeth={teeth}
              onEdit={editPerioSite}
              onSave={savePerio}
              onClose={() => guard(() => setSelectedFdi(null))}
              onSelectTooth={(fdi) => guard(() => setSelectedFdi(fdi))}
            />
          </Box>
        )}

        {/*
          One column of asides down the RIGHT edge: the finding for whichever
          tooth is in hand at the top, and the legend — collapsible — pinned to
          the bottom, out of the way of the arch. Stacked rather than overlaid
          so the detail can never cover the legend that explains it.

          Right rather than left so it never collides with the perio panel,
          which opens over the left of the arch — the column no longer has to
          jump corners when it appears.
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
            }}
          >
            {selectedTooth && selectedLesions.length > 0 && (
              <CariesDetail tooth={selectedTooth} findings={selectedLesions} caries={caries} />
            )}
            {selectedTooth && selectedFixture && (
              <ImplantDetail tooth={selectedTooth} fixture={selectedFixture} implants={implants} />
            )}
            {selectedTooth && selectedCanals && endo && (
              <EndoDetail tooth={selectedTooth} finding={selectedCanals} endo={endo} />
            )}
          </Stack>

          <Box sx={{ flexShrink: 0, pointerEvents: 'auto' }}>
            <ChartLegend
              perio={perio}
              caries={caries}
              implants={implants}
              endo={endo}
              postCore={odontogram.postCore}
            />
          </Box>
        </Stack>
      </Box>

      {/*
        The footer line: what is selected on the left, the two chart affordances
        together on the right. `flex-start` rather than centre so the buttons
        keep a fixed offset from the top of the row while the caption grows
        downward — a tooth with perio, caries, implant and endo findings runs to
        four lines, and centring would slide the buttons on every selection.
      */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          position: 'relative',
          zIndex: 1,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 3,
        }}
      >
        {/* The panel states the readings itself while it is open, so the line
            under the model would only repeat it. The slot stays, empty, to
            hold the corner buttons where they are. */}
        {panelTooth ? (
          <Box sx={{ flex: '1 1 auto' }} />
        ) : (
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

        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
          {/* Only while nothing is selected: the tooth caption then owns this
              line, and the tip beside it would squeeze it into a column. */}
          {tipOpen && selectedFdi === null && (
            <ChartTip help={odontogram.model.help} selectHint={selectHint} onClose={dismissTip} />
          )}
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
        {panelTooth && perio && (
          <Dialog
            open={pendingLeave !== null}
            onClose={() => setPendingLeave(null)}
            aria-labelledby="perio-unsaved-title"
          >
            <DialogTitle id="perio-unsaved-title">{perio.panel.unsaved.title}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {perio.panel.unsaved.body.replace(
                  '{tooth}',
                  `${perio.panel.titlePrefix} ${universalFromFdi(panelTooth.fdi)}${sideFromFdi(panelTooth.fdi)}`,
                )}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPendingLeave(null)}>{perio.panel.unsaved.keepEditing}</Button>
              <Button color="error" onClick={() => settleLeave(false)}>
                {perio.panel.unsaved.discard}
              </Button>
              <Button variant="contained" onClick={() => settleLeave(true)}>
                {perio.panel.unsaved.saveAndContinue}
              </Button>
            </DialogActions>
          </Dialog>
        )}
        <ChartHelpPopover
          help={odontogram.model.help}
          selectHint={selectHint}
          anchor={helpAnchor}
          onClose={() => setHelpAnchor(null)}
        />
      </Stack>
      </Paper>
  )
}

/**
 * The dentition in its real arch.
 *
 * No number rows and no columns: the teeth carry their own identity here, so
 * `ArchCaption` on the footer line names whichever one is selected instead.
 */
function ArchModel({
  teeth,
  selectedFdi,
  perio,
  perioReadings,
  caries,
  implants,
  endo,
  postCore,
  zoom,
  focusFdi,
  focusSite,
  viewDirection,
  show,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  perio: PerioChart | null
  perioReadings: PerioToothReading[]
  caries: CariesChart
  implants: ImplantChart
  endo: EndoChart | null
  postCore: PostCoreChart
  zoom: number
  focusFdi: number | null
  focusSite: PerioSite | null
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
        implants={implants}
        endo={endo}
        postCore={postCore}
        zoom={zoom}
        focusFdi={focusFdi}
        focusSite={focusSite}
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
 * The lesion in full, for the tooth the user just clicked.
 *
 * The stain on the model shows WHERE the decay is; this says what it is —
 * which surfaces, how far it has got, when it was charted and what is planned.
 * None of that can be read off a brown patch, which is the whole reason this
 * panel exists rather than leaving the mark to speak for itself.
 *
 * `Alert severity="warning"` rather than a hand-rolled card: it ships the
 * status icon alongside the colour, so the finding never rests on hue, and it
 * is already the DS's consumer of the warning channel.
 */
function CariesDetail({
  tooth,
  findings,
  caries,
}: {
  tooth: Tooth
  findings: CariesFinding[]
  caries: CariesChart
}) {
  const { model } = patientChart.odontogram
  const name = `${model.toothLabel} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`

  return (
    <Alert
      severity="warning"
      variant="outlined"
      // Readable over the canvas, and clickable so the text can be selected —
      // unlike the legend, this carries content somebody may want to copy.
      sx={{ bgcolor: 'background.paper', pointerEvents: 'auto', width: '100%' }}
    >
      {/* Both notations named, for the reason the caption gives: Universal 3
          and FDI 3 are different teeth, and a bare number is how the wrong one
          gets treated. */}
      <AlertTitle sx={{ fontWeight: 700 }}>
        {`${caries.title} · ${name}`}
      </AlertTitle>

      <Stack spacing={1}>
        {findings.map((finding) => (
          <Stack key={`${finding.fdi}-${finding.surfaces.join('-')}`} spacing={0.25}>
            <DetailRow
              label={caries.labels.surfaces}
              value={finding.surfaces.map((surface) => caries.surfaceLabels[surface]).join(', ')}
            />
            <DetailRow
              label={caries.labels.icdas}
              // The bare code is never shown alone: a reader who does not hold
              // the ICDAS scale in their head gets the words for it, and a
              // code with no entry degrades to the number rather than to a
              // description invented for it.
              value={
                caries.icdasLabels[finding.icdas]
                  ? `${finding.icdas} — ${caries.icdasLabels[finding.icdas]}`
                  : String(finding.icdas)
              }
            />
            <DetailRow label={caries.labels.extent} value={finding.extent} />
            <DetailRow label={caries.labels.detected} value={finding.detectedOn} />
            <DetailRow label={caries.labels.plan} value={finding.plan} />

            <Typography variant="caption" sx={{ display: 'block', pt: 0.5, fontStyle: 'italic' }}>
              {finding.note}
            </Typography>
          </Stack>
        ))}

        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600 }}>
          {caries.disclaimer}
        </Typography>
      </Stack>
    </Alert>
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
function PerioToothPanel({
  tooth,
  perio,
  reading,
  dirty,
  activeSite,
  onSiteChange,
  teeth,
  onEdit,
  onSave,
  onClose,
  onSelectTooth,
}: {
  tooth: Tooth
  perio: PerioChart
  /**
   * The tooth as being edited — the draft if there is one, else what is saved.
   * `undefined` means never probed — not "probed and all zero".
   */
  reading: PerioToothReading | undefined
  /** Whether `reading` holds edits not yet saved. */
  dirty: boolean
  /** The site in hand — owned by the parent, which also marks it on the arch. */
  activeSite: PerioSite
  onSiteChange: (site: PerioSite) => void
  /** Every tooth currently on the arch, for the rail and Previous / Next. */
  teeth: Tooth[]
  onEdit: (fdi: number, site: PerioSite, change: Partial<PerioSiteReading>) => void
  onSave: () => void
  /** Both of these go through the unsaved-changes guard in the parent. */
  onClose: () => void
  onSelectTooth: (fdi: number) => void
}) {
  const labels = perio.siteLabels[tooth.arch]
  const [activeMeasureId, setActiveMeasureId] = useState(perio.measures[0].id)

  const measure = perio.measures.find((m) => m.id === activeMeasureId) ?? perio.measures[0]
  const site = reading?.sites[activeSite]
  const healthy = reading ? !hasPerioFindings(reading, perio.flagDepth) : false

  // Previous / Next walk the same order the rail shows: ascending Universal.
  const ordered = [...teeth].sort((a, b) => universalFromFdi(a.fdi) - universalFromFdi(b.fdi))
  const index = ordered.findIndex((candidate) => candidate.fdi === tooth.fdi)
  const previous = ordered[(index - 1 + ordered.length) % ordered.length]
  const next = ordered[(index + 1) % ordered.length]

  return (
    <Paper
      component="section"
      // Raised, unlike every other card here: it floats over the model rather
      // than sitting in the page beside it, and the shadow is what says so.
      elevation={8}
      aria-label={`${perio.panel.titlePrefix} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`}
      sx={{
        width: 468,
        maxWidth: '100%',
        flexShrink: 0,
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <PerioToothRail teeth={teeth} selectedFdi={tooth.fdi} perio={perio} onSelect={onSelectTooth} />

      {/* `useFlexGap`: Stack's default spacing is a margin on each child, which
          would override the footer's `mt: auto` and leave it floating mid-panel
          instead of on the bottom edge. A gap leaves the margin free. */}
      <Stack
        spacing={2}
        useFlexGap
        sx={{ flexGrow: 1, minWidth: 0, p: 2.5, overflowY: 'auto' }}
      >
        {/* `flex-start`: the close button lines up with the top of the title,
            not the middle of the two-line heading block. */}
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Both notations, as everywhere else a tooth is named: Universal 3
              and FDI 3 are different teeth. */}
          <Box>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              {`${perio.panel.titlePrefix} ${universalFromFdi(tooth.fdi)}${sideFromFdi(tooth.fdi)}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`FDI ${tooth.fdi} · ${patientChart.odontogram.model.typeLabels[tooth.type]}`}
            </Typography>
          </Box>
          <IconButton aria-label={perio.panel.close} onClick={onClose}>
            <Icon name="close" size={22} />
          </IconButton>
        </Stack>

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
                    label={option.label}
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
                    }}
                  >
                    <ConditionDot condition={condition.id} filled={on} />
                    {condition.label}
                  </ToggleButton>
                )
              })}
            </Stack>
          </>
        )}

        {/* Pushed to the bottom: a plain line of the readings as they stand in
            the draft, then the three actions. No banner — the states that
            need one are stated above the tiles. */}
        <Stack spacing={1.5} sx={{ mt: 'auto', pt: 1 }}>
          {/* Follows the controls above: the site picked in the tiles, the
              measure picked in the tabs, and the conditions marked for that
              site. With no readings at all it says so, never "fine". */}
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {site
              ? [
                  labels[activeSite],
                  `${measure.label} ${site[measure.id]} ${perio.unit}`,
                  site.conditions.length > 0
                    ? perio.conditions
                        .filter((condition) => site.conditions.includes(condition.id))
                        .map((condition) => condition.label)
                        .join(', ')
                    : perio.panel.noConditions,
                ].join(' · ')
              : perio.panel.unprobedTitle}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Icon name="previousTooth" size={20} />}
              onClick={() => onSelectTooth(previous.fdi)}
              sx={{ flex: '1 1 0' }}
            >
              {perio.panel.previousTooth}
            </Button>
            <Button
              variant="outlined"
              endIcon={<Icon name="nextTooth" size={20} />}
              onClick={() => onSelectTooth(next.fdi)}
              sx={{ flex: '1 1 0' }}
            >
              {perio.panel.nextTooth}
            </Button>
            {/* Enabled only with something to save, which doubles as the
                "unsaved" cue. */}
            <Button variant="contained" disabled={!dirty} onClick={onSave} sx={{ flex: '1 1 0' }}>
              {perio.panel.save}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
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
function PerioToothRail({
  teeth,
  selectedFdi,
  perio,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number
  perio: PerioChart
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
        bgcolor: 'background.default',
      }}
    >
      <List
        ref={rail}
        dense
        aria-label={perio.panel.toothRail}
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
          return (
            <ListItemButton
              key={tooth.fdi}
              selected={selected}
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(tooth.fdi)}
              sx={{
                justifyContent: 'center',
                px: 0,
                py: 0.75,
                // Edge to edge: the chip spans the rail's full width.
                borderRadius: 0,
                color: 'text.secondary',
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
      direction="row"
      spacing={0.5}
      sx={{
        // Sits on the pointer-transparent aside layer, so it re-arms itself.
        pointerEvents: 'auto',
        p: 0.5,
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
      }}
    >
      {views.map((view) => {
        const isActive = view === active
        return (
          <Tooltip key={view} title={ARCH_VIEW_LABELS[view]}>
            <ButtonBase
              onClick={() => onChange(view)}
              aria-pressed={isActive}
              aria-label={ARCH_VIEW_LABELS[view]}
              sx={{
                width: 44,
                // Fills the row, which the header stretches to the menus' height.
                height: '100%',
                borderRadius: 1,
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
    <Tooltip title={item.label}>
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
          '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
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
 * "?" that holds them for good. Dismissing it — or opening the full help —
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
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      slotProps={{
        paper: { role: 'dialog', 'aria-label': help.title, sx: { mt: -1, p: 2.5, width: 300 } },
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

export default function PatientChart() {
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
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Rail />
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
        <PatientSidebar />
        <ChartPanel />
      </Stack>
    </Box>
  )
}
