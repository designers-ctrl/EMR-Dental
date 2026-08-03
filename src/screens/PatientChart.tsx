import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SvgIconComponent } from '@mui/icons-material'

import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import CachedOutlined from '@mui/icons-material/CachedOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CallOutlined from '@mui/icons-material/CallOutlined'
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined'
import ContactMailOutlined from '@mui/icons-material/ContactMailOutlined'
import ContactPageOutlined from '@mui/icons-material/ContactPageOutlined'
import ContentPasteOutlined from '@mui/icons-material/ContentPasteOutlined'
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import DynamicFormOutlined from '@mui/icons-material/DynamicFormOutlined'
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined'
import ForwardToInboxOutlined from '@mui/icons-material/ForwardToInboxOutlined'
import HelpOutlined from '@mui/icons-material/HelpOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import HubOutlined from '@mui/icons-material/HubOutlined'
import KeyboardTabOutlined from '@mui/icons-material/KeyboardTabOutlined'
import LibraryBooksOutlined from '@mui/icons-material/LibraryBooksOutlined'
import MedicationOutlined from '@mui/icons-material/MedicationOutlined'
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

import logo from '../assets/EMRdentallogo.svg'
import {
  patientChart,
  type ArchView,
  type IconName,
  type PatientField,
  type RailItem,
  type Tooth,
} from '../data/patientChart.ts'
import { ArchGlyph } from './ArchGlyph.tsx'
import { ToothArch3D } from './ToothArch.tsx'

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
  history: HistoryOutlined,
  help: HelpOutlined,
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

function PatientHeader() {
  const { patient } = patientChart
  const [activeTabId, setActiveTabId] = useState(patient.activeTabId)
  const [primaryAction, ...iconActions] = [
    ...patient.actions.filter((action) => action.primary),
    ...patient.actions.filter((action) => !action.primary),
  ]

  return (
    <Paper component="header" sx={{ px: 4, pt: 3.5, pb: 1.5 }}>
      <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
        <PatientPhoto initials={patient.initials} name={patient.name} />

        <Box sx={{ minWidth: 190 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {patient.chartNumber}
          </Typography>
          <Typography variant="h1" component="h1" sx={{ my: 0.5 }}>
            {patient.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {patient.status}, {patient.dateOfBirth}
          </Typography>
        </Box>

        {/* Six fields, read down each column then across — as in the record. */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gridAutoFlow: 'column',
            gridTemplateRows: 'repeat(2, auto)',
            columnGap: 4,
            rowGap: 2,
            pt: 1,
            minWidth: 0,
          }}
        >
          {patient.fields.map((field) => (
            <Field key={field.id} field={field} />
          ))}
        </Box>

        <Stack spacing={1.5} sx={{ flexShrink: 0 }}>
          <Stack direction="row" spacing={1.5}>
            {iconActions.map((action) => (
              <Tooltip key={action.id} title={action.label}>
                <IconButton
                  aria-label={action.label}
                  sx={{
                    width: 56,
                    height: 56,
                    color: 'primary.main',
                    border: (theme) => `1px solid ${theme.palette.primary.main}`,
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <Icon name={action.icon} size={24} />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
          <Button
            variant="contained"
            aria-label={primaryAction.label}
            startIcon={<Icon name={primaryAction.icon} size={22} />}
            sx={{ height: 56, '& .MuiButton-startIcon': { m: 0 } }}
          />
        </Stack>
      </Stack>

      <Stack
        direction="row"
        component="nav"
        aria-label="Patient record sections"
        sx={{ mt: 2, overflowX: 'auto', scrollbarWidth: 'thin' }}
      >
        {patient.tabs.map((tab) => {
          const active = tab.id === activeTabId
          return (
            <ButtonBase
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              aria-current={active ? 'page' : undefined}
              sx={{
                flex: '1 0 auto',
                minWidth: 84,
                px: 1,
                py: 1.25,
                borderRadius: 1.5,
                color: active ? 'primary.main' : 'text.secondary',
                border: (theme) =>
                  `1px solid ${active ? theme.palette.divider : 'transparent'}`,
                flexDirection: 'column',
                gap: 0.75,
                '&:hover': { color: 'text.primary' },
              }}
            >
              <Icon name={tab.icon} size={20} />
              <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>
                {tab.label}
              </Typography>
            </ButtonBase>
          )
        })}
      </Stack>
    </Paper>
  )
}

function PatientPhoto({ initials, name }: { initials: string; name: string }) {
  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <Box
        role="img"
        aria-label={`${name} — no photo on file`}
        sx={{
          width: 92,
          height: 92,
          borderRadius: 3,
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
      <Typography variant="body2" color="text.secondary" noWrap>
        {field.label}
      </Typography>
      <Typography
        variant="subtitle2"
        noWrap
        sx={{ color: field.tone === 'accent' ? 'primary.main' : 'text.primary' }}
      >
        {field.value}
      </Typography>
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
  const [modeId, setModeId] = useState(odontogram.activeModeId)
  const [archView, setArchView] = useState<ArchView>(odontogram.activeArchView)
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null)

  const showUpper = archView !== 'lower'
  const showLower = archView !== 'upper'

  return (
    <Paper
      component="section"
      sx={{ p: 4, position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Typography variant="h2" component="h2" sx={{ minWidth: 140 }}>
          {title}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          {odontogram.modes.map((mode) => {
            const active = mode.id === modeId
            return (
              <Button
                key={mode.id}
                variant="outlined"
                onClick={() => setModeId(mode.id)}
                aria-pressed={active}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  color: 'primary.main',
                  borderColor: active ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' },
                }}
              >
                {mode.label}
              </Button>
            )
          })}
        </Stack>

        {/* Balances the title, so the modes stay centred over the arch. */}
        <Box sx={{ minWidth: 140 }} />
      </Stack>

      <Box
        sx={{
          position: 'relative',
          mt: 5,
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          // Keep the arch selector clear of the teeth.
          pr: 8,
        }}
      >
        <ArchModel
          teeth={[...(showUpper ? odontogram.upper : []), ...(showLower ? odontogram.lower : [])]}
          selectedFdi={selectedFdi}
          onSelect={setSelectedFdi}
        />

        <ArchSelector
          views={odontogram.archViews}
          active={archView}
          onChange={setArchView}
          upperVisible={showUpper}
          lowerVisible={showLower}
        />
      </Box>

      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', mt: 3 }}
      >
        <CornerAction item={odontogram.footerActions.start} />
        <CornerAction item={odontogram.footerActions.end} />
      </Stack>
    </Paper>
  )
}

/** How tall the stage is, in px — a definite box for the canvas to frame into. */
const ARCH_HEIGHT = 620

/**
 * The dentition in its real arch.
 *
 * No number rows and no columns: the teeth carry their own identity here, so
 * the caption names whichever one is selected instead.
 */
function ArchModel({
  teeth,
  selectedFdi,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  onSelect: (fdi: number | null) => void
}) {
  const { model } = patientChart.odontogram
  const selected = teeth.find((tooth) => tooth.fdi === selectedFdi)

  return (
    <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 0, height: ARCH_HEIGHT }}>
      <ToothArch3D teeth={teeth} selectedFdi={selectedFdi} onSelect={onSelect} />

      <Typography
        variant="subtitle2"
        aria-live="polite"
        sx={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          // The caption sits over the canvas; let drags through to the model.
          pointerEvents: 'none',
          color: selected ? 'text.primary' : 'text.secondary',
          fontWeight: selected ? 600 : 500,
          textTransform: selected ? 'capitalize' : 'none',
        }}
      >
        {selected ? `${model.toothLabel} ${selected.fdi} · ${selected.type}` : model.hint}
      </Typography>
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
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        p: 0.5,
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
      }}
    >
      {views.map((view) => {
        const isActive = view === active
        return (
          <Tooltip key={view} title={ARCH_VIEW_LABELS[view]} placement="left">
            <ButtonBase
              onClick={() => onChange(view)}
              aria-pressed={isActive}
              aria-label={ARCH_VIEW_LABELS[view]}
              sx={{
                width: 40,
                height: 30,
                borderRadius: 1,
                color: isActive ? 'primary.main' : 'text.disabled',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: isActive ? 'action.selected' : 'action.hover' },
                // The `lower` row's arch curves the other way.
                '& svg': { transform: view === 'lower' ? 'scaleY(-1)' : undefined },
              }}
            >
              <ArchGlyph filled={isActive || filledFor[view]} />
            </ButtonBase>
          </Tooltip>
        )
      })}
    </Stack>
  )
}

function CornerAction({ item }: { item: RailItem }) {
  return (
    <Tooltip title={item.label}>
      <IconButton
        aria-label={item.label}
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

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function PatientChart() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        // Mounted at the document root, so the viewport is the floor.
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Rail />
      <Stack
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: (theme) => theme.layout.gutter,
          // Gap between the cards is two thirds of the page gutter. `gap`
          // rather than Stack's `spacing` prop, which takes no theme callback.
          gap: (theme) => theme.spacing((theme.layout.gutter * 2) / 3),
        }}
      >
        <PatientHeader />
        <ChartPanel />
      </Stack>
    </Box>
  )
}
