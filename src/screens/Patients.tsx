/**
 * The Patients screen — the list a record is opened from, with the day's
 * schedule beside it.
 *
 * One job: find a patient and open their chart. The table leads; the schedule
 * is a glance, not a second task, which is why it gets a third of the width
 * and no controls beyond stepping a day.
 *
 * Nothing here is new to the design system. The cards, buttons and status chip
 * are the ones `PatientChart.tsx` already draws; the table, text field, select
 * and snackbar are the Storybook's. The arrangement follows the design
 * reference, the look is the theme's.
 *
 * Like every screen it is a pure projection of its dataset
 * (`src/data/patients.ts`) and brings its own rail — there is no shared shell.
 */

import { useCallback, useMemo, useState, type SyntheticEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  DataGrid,
  GridActionsCell,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid'
import dayjs from 'dayjs'

import { Icon } from '../components/Icon.tsx'
import { Rail } from '../components/Rail.tsx'
import {
  hasChart,
  patients,
  type Appointment,
  type PatientFilterId,
  type PatientRow,
  type PatientStatusId,
} from '../data/patients.ts'

// ─── PATIENT LIST ─────────────────────────────────────────────────────────

const STATUS_BY_ID = new Map(patients.statuses.map((status) => [status.id, status]))

/** Field name of the row-menu column — it has no counterpart in the row data. */
const ACTIONS_FIELD = 'actions'

/**
 * Header height in px (the grid's own unit). Taller than stock because three
 * headers carry a filter under their label.
 */
const HEADER_HEIGHT = 64

const PAGE_SIZES = [25, 50, 100]

type Filters = Record<PatientFilterId, string>

/** `''` on every filter means "All". */
const NO_FILTERS: Filters = { status: '', procedure: '', provider: '' }

interface FilterOption {
  value: string
  label: string
}

const distinct = (values: (string | null)[]): FilterOption[] =>
  [...new Set(values.filter((value): value is string => value !== null))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }))

/**
 * What each header filter offers. Status comes from the dataset's own list;
 * the other two are whatever values the rows actually hold, so an option can
 * never lead to an empty table on its own.
 */
const FILTER_OPTIONS: Record<PatientFilterId, FilterOption[]> = {
  status: patients.statuses.map((status) => ({ value: status.id, label: status.label })),
  procedure: distinct(patients.rows.map((row) => row.procedure)),
  provider: distinct(patients.rows.map((row) => row.provider)),
}

function matches(row: PatientRow, query: string, filters: Filters) {
  if (filters.status && row.status !== filters.status) return false
  if (filters.procedure && row.procedure !== filters.procedure) return false
  if (filters.provider && row.provider !== filters.provider) return false
  if (!query) return true
  return `${row.id} ${row.firstName} ${row.lastName}`.toLowerCase().includes(query)
}

/**
 * A column header that carries its own filter: the label, and under it a
 * select reading "All" until it is narrowed.
 *
 * ⚠ The select lives INSIDE a header the grid sorts on click and on Enter, and
 *   React bubbles events out of the select's portalled menu as if it were a
 *   child. Without the two `stop` handlers, picking an option would also sort
 *   the column.
 */
function HeaderFilter({
  title,
  label,
  value,
  options,
  onChange,
}: {
  title: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const stop = (event: SyntheticEvent) => event.stopPropagation()

  return (
    <Stack sx={{ minWidth: 0, alignItems: 'flex-start' }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Box onClick={stop} onKeyDown={stop} sx={{ maxWidth: '100%' }}>
        <Select
          variant="standard"
          disableUnderline
          displayEmpty
          value={value}
          onChange={(event) => onChange(event.target.value)}
          SelectDisplayProps={{ 'aria-label': label }}
          sx={{
            typography: 'caption',
            // A narrowed filter reads as set by its words, and is darkened to
            // match — never by colour alone.
            color: value ? 'text.primary' : 'text.secondary',
            fontWeight: value ? 600 : 400,
          }}
        >
          <MenuItem value="">{patients.filters.all}</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  )
}

function PatientList({ onOpenChart }: { onOpenChart: () => void }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [noChartOpen, setNoChartOpen] = useState(false)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return patients.rows.filter((row) => matches(row, needle, filters))
  }, [query, filters])

  /**
   * Picking a patient. Only a row with a chart behind it leaves the list; any
   * other row SAYS it has none rather than doing nothing — a dead click in a
   * list of patients reads as a broken app, and opening the one chart that
   * exists under another patient's name would be worse.
   */
  const open = useCallback(
    (row: PatientRow) => {
      if (hasChart(row)) onOpenChart()
      else setNoChartOpen(true)
    },
    [onOpenChart],
  )

  const columns = useMemo<GridColDef<PatientRow>[]>(() => {
    const filterHeader = (field: PatientFilterId) => () => (
      <HeaderFilter
        title={patients.columns[field]}
        label={patients.filters.labels[field]}
        value={filters[field]}
        options={FILTER_OPTIONS[field]}
        onChange={(value) => setFilters((current) => ({ ...current, [field]: value }))}
      />
    )

    return [
      { field: 'id', headerName: patients.columns.id, flex: 0.9, minWidth: 110 },
      { field: 'firstName', headerName: patients.columns.firstName, flex: 1, minWidth: 110 },
      { field: 'lastName', headerName: patients.columns.lastName, flex: 1, minWidth: 120 },
      {
        field: 'dateOfBirth',
        headerName: patients.columns.dateOfBirth,
        flex: 1,
        minWidth: 120,
        // Sorted on the ISO value, shown the way the record writes it.
        valueFormatter: (value: string) => dayjs(value).format(patients.dateOfBirthFormat),
      },
      {
        field: 'status',
        headerName: patients.columns.status,
        flex: 1,
        minWidth: 130,
        // Sorts on the word the chip shows, not on the id behind it.
        valueGetter: (value: PatientStatusId) => STATUS_BY_ID.get(value)?.label ?? value,
        renderHeader: filterHeader('status'),
        renderCell: ({ row }) => {
          const status = STATUS_BY_ID.get(row.status)
          // The same chip the record's own header uses for this status.
          return (
            <Chip
              label={status?.label ?? row.status}
              size="small"
              color={status?.tone ?? 'default'}
              variant="outlined"
            />
          )
        },
      },
      {
        field: 'procedure',
        headerName: patients.columns.procedure,
        flex: 1.3,
        minWidth: 150,
        renderHeader: filterHeader('procedure'),
      },
      {
        field: 'provider',
        headerName: patients.columns.provider,
        flex: 1.4,
        minWidth: 170,
        valueGetter: (value: string | null) => value ?? '',
        renderHeader: filterHeader('provider'),
        // An empty cell could mean "none" or "failed to load"; the words settle it.
        renderCell: ({ row }) =>
          row.provider ?? (
            <Typography variant="body2" component="span" color="text.secondary">
              {patients.unassignedProvider}
            </Typography>
          ),
      },
      {
        field: ACTIONS_FIELD,
        type: 'actions',
        width: 56,
        renderCell: (params) => (
          <GridActionsCell {...params}>
            <GridActionsCellItem
              showInMenu
              label={patients.rowMenu.openChart}
              onClick={() => open(params.row)}
            />
          </GridActionsCell>
        ),
      },
    ]
  }, [filters, open])

  return (
    <Paper
      component="main"
      elevation={0}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        sx={{ px: 2.5, py: 2, gap: 2, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}
      >
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {patients.title}
        </Typography>

        <TextField
          type="search"
          name="patient-search"
          // A patient's name must not be offered back by the browser later.
          autoComplete="off"
          size="small"
          label={patients.search.label}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ minWidth: 260 }}
        />

        {patients.actions.map((action) => (
          <Button
            key={action.id}
            variant={action.primary ? 'contained' : 'outlined'}
            startIcon={action.icon ? <Icon name={action.icon} size={20} /> : undefined}
          >
            {action.label}
          </Button>
        ))}
      </Stack>

      <Divider />

      {/* The grid needs a parent with a real height; this flex column is it. */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          label={patients.title}
          rows={rows}
          columns={columns}
          columnHeaderHeight={HEADER_HEIGHT}
          disableColumnMenu
          // A click on a row opens it; it must not also leave the row tinted
          // as "selected" for when the user comes back.
          rowSelection={false}
          onCellClick={(params) => {
            if (params.field !== ACTIONS_FIELD) open(params.row)
          }}
          // Keyboard parity for the click: Enter on any focused cell of the row.
          onCellKeyDown={(params, event) => {
            if (event.key === 'Enter' && params.field !== ACTIONS_FIELD) open(params.row)
          }}
          initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZES[0] } } }}
          pageSizeOptions={PAGE_SIZES}
          localeText={{ noRowsLabel: patients.noMatches }}
          sx={{
            // The card is the frame; a second border inside it would double up.
            border: 0,
            borderRadius: 0,
            // IDs and dates are read down the column; equal-width digits line
            // up. Only those two columns — the feature also widens the hyphen
            // in a name like "Al-Faraje".
            '& .MuiDataGrid-cell[data-field="id"], & .MuiDataGrid-cell[data-field="dateOfBirth"]': {
              fontVariantNumeric: 'tabular-nums',
            },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            // No cell outline on a click: here a click opens the row, it does
            // not pick a cell, and the stock ring was left behind on whichever
            // cell was hit. The ring is kept for the keyboard (`:focus-visible`),
            // where it is the only sign of which row Enter will open.
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-cell:focus-visible': {
              outline: '1px solid',
              outlineColor: 'primary.main',
              outlineOffset: -1,
            },
          }}
        />
      </Box>

      <Snackbar
        open={noChartOpen}
        autoHideDuration={4000}
        onClose={() => setNoChartOpen(false)}
        message={patients.noChartMessage}
      />
    </Paper>
  )
}

// ─── DAY SCHEDULE ─────────────────────────────────────────────────────────

/** Height of one hour row and width of the time gutter, in spacing units. */
const HOUR_UNITS = 12
const GUTTER_UNITS = 7

const ISO_DATE = 'YYYY-MM-DD'

/** In the accessibility tree, not on screen — the standard clip pattern. */
const SCREEN_READER_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const

const STATUS_OF_APPOINTMENT = new Map(
  patients.schedule.statuses.map((status) => [status.id, status]),
)

/** `HH:mm` as minutes since midnight. */
function minutes(time: string) {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

interface PlacedAppointment {
  appointment: Appointment
  /** Which side-by-side lane it sits in, and how many its cluster needs. */
  lane: number
  lanes: number
}

/**
 * Lays a day out so overlapping appointments sit side by side instead of on
 * top of each other.
 *
 * Appointments are walked in start order. Each takes the first lane that is
 * already free at its start; a run of appointments that overlap one another
 * (a cluster) shares one lane count, so every card in it is the same width.
 * An appointment that overlaps nothing gets the full width.
 */
function placeAppointments(appointments: Appointment[]): PlacedAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) => minutes(a.start) - minutes(b.start) || minutes(a.end) - minutes(b.end),
  )

  const placed: PlacedAppointment[] = []
  let cluster: PlacedAppointment[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneEnds.length
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }

  for (const appointment of sorted) {
    const start = minutes(appointment.start)
    if (cluster.length > 0 && start >= clusterEnd) closeCluster()

    let lane = laneEnds.findIndex((end) => end <= start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = minutes(appointment.end)
    clusterEnd = Math.max(clusterEnd, laneEnds[lane])

    const item = { appointment, lane, lanes: 1 }
    cluster.push(item)
    placed.push(item)
  }
  closeCluster()

  return placed
}

function DaySchedulePanel() {
  const { schedule } = patients
  const [date, setDate] = useState(schedule.today)

  const placed = useMemo(
    () => placeAppointments(schedule.appointments.filter((item) => item.date === date)),
    [schedule, date],
  )

  const shiftDay = (days: number) =>
    setDate((current) => dayjs(current).add(days, 'day').format(ISO_DATE))

  const hours = Array.from(
    { length: schedule.lastHour - schedule.firstHour },
    (_, index) => schedule.firstHour + index,
  )
  /** A time as hour rows down from the top of the grid. */
  const rowsDown = (time: string) => (minutes(time) - schedule.firstHour * 60) / 60

  // The record's own caret, turned on its side — the same trick the chart
  // uses to flip it for "More / Less".
  const dayButton = (label: string, days: number, turn: string) => (
    <Tooltip title={label}>
      <IconButton aria-label={label} size="small" onClick={() => shiftDay(days)}>
        <Box component="span" sx={{ display: 'flex', transform: turn }}>
          <Icon name="dropdown" size={20} />
        </Box>
      </IconButton>
    </Tooltip>
  )

  return (
    <Paper
      component="aside"
      aria-label={schedule.label}
      elevation={0}
      sx={{
        width: 300,
        flexShrink: 0,
        minHeight: 0,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        sx={{ px: 1.5, py: 2, alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
      >
        {dayButton(schedule.previousDay, -1, 'rotate(90deg)')}
        <Typography variant="subtitle2" component="h2" aria-live="polite">
          {dayjs(date).format(schedule.dateFormat)}
        </Typography>
        {dayButton(schedule.nextDay, 1, 'rotate(-90deg)')}
      </Stack>

      <Divider />

      {/* The only scrolling region: twelve hour rows are taller than the card. */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Box
          sx={(theme) => ({
            position: 'relative',
            // Every position below is a multiple of these two, so the grid
            // lines, the cards and the "now" line cannot drift apart.
            '--hour': theme.spacing(HOUR_UNITS),
            '--gutter': theme.spacing(GUTTER_UNITS),
          })}
        >
          {hours.map((hour, index) => (
            <Stack key={hour} direction="row" sx={{ height: 'var(--hour)' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  width: 'var(--gutter)',
                  flexShrink: 0,
                  pt: 0.5,
                  pr: 1,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  borderRight: 1,
                  borderColor: 'divider',
                }}
              >
                {`${String(hour).padStart(2, '0')}:00`}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderTop: index > 0 ? 1 : 0,
                  borderColor: 'divider',
                  // The half hour, dashed so it reads as lighter than the hour.
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    borderTop: '1px dashed',
                    borderColor: 'divider',
                  },
                }}
              />
            </Stack>
          ))}

          <Box
            component="ul"
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 'var(--gutter)',
              right: 0,
              m: 0,
              p: 0,
              listStyle: 'none',
            }}
          >
            {placed.map(({ appointment, lane, lanes }) => {
              const status = appointment.status && STATUS_OF_APPOINTMENT.get(appointment.status)
              const length = rowsDown(appointment.end) - rowsDown(appointment.start)

              return (
                <Box
                  component="li"
                  key={appointment.id}
                  sx={{
                    position: 'absolute',
                    top: `calc(var(--hour) * ${rowsDown(appointment.start)})`,
                    height: `calc(var(--hour) * ${length})`,
                    left: `${(lane / lanes) * 100}%`,
                    width: `${100 / lanes}%`,
                    // Padding rather than a gap, so back-to-back visits stay
                    // visibly two cards.
                    p: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      overflow: 'hidden',
                      px: 1,
                      py: 0.5,
                      borderRadius: 0.5,
                      // The page colour, as a recessed tile on the card. Opaque
                      // on purpose: a translucent tint let the hour lines show
                      // through the appointment.
                      bgcolor: 'background.default',
                      // The bar is an index into the status written beside it,
                      // never the only place the status is stated.
                      borderLeft: 4,
                      borderLeftColor: status ? `${status.tone}.main` : 'text.disabled',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="p"
                      noWrap
                      sx={{ fontWeight: 600, lineHeight: 1.4 }}
                    >
                      {/* Sighted users read the time off the card's position;
                          a screen reader has no position to read. */}
                      <Box component="span" sx={SCREEN_READER_ONLY}>
                        {`${appointment.start}–${appointment.end} `}
                      </Box>
                      {appointment.title}
                    </Typography>
                    {/* Status and room share a line and WRAP rather than
                        truncate: a half-hour card is two lines tall, and a
                        card squeezed beside an overlapping one is narrow. */}
                    <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 1 }}>
                      {status && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                          {status.label}
                        </Typography>
                      )}
                      {appointment.room && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                          {appointment.room}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Box>
              )
            })}
          </Box>

          {placed.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                position: 'absolute',
                top: 'var(--hour)',
                left: 'var(--gutter)',
                right: 0,
                px: 2,
                textAlign: 'center',
              }}
            >
              {schedule.emptyDay}
            </Typography>
          )}

          {/* Only on the dataset's own today — a "now" on another day is a lie. */}
          {date === schedule.today && (
            <Box
              role="img"
              aria-label={`${schedule.nowLabel} ${schedule.now}`}
              sx={{
                position: 'absolute',
                left: 'var(--gutter)',
                right: 0,
                top: `calc(var(--hour) * ${rowsDown(schedule.now)})`,
                height: 2,
                transform: 'translateY(-50%)',
                bgcolor: 'error.main',
                pointerEvents: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: (theme) => theme.spacing(1),
                  height: (theme) => theme.spacing(1),
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'error.main',
                },
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  )
}

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function Patients({
  onOpenChart,
}: {
  /** Leaves the list for the record — called when a row with a chart is picked. */
  onOpenChart: () => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        // Pinned to the viewport like the chart screen: the table and the
        // schedule each scroll inside their own card, the page never does.
        height: '100vh',
        overflow: 'clip',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Rail rail={patients.rail} />
      <Stack
        direction="row"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          p: (theme) => theme.layout.gutter,
          // Same card gap as the chart screen: two thirds of the page gutter.
          gap: (theme) => theme.spacing((theme.layout.gutter * 2) / 3),
        }}
      >
        <PatientList onOpenChart={onOpenChart} />
        <DaySchedulePanel />
      </Stack>
    </Box>
  )
}
