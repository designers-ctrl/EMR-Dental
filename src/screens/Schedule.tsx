/**
 * The Schedule screen — the practice's day, one column per operatory.
 *
 * One job: see who is in which chair when, and book around it. The grid is the
 * whole screen; the header only steps the day and holds the actions.
 *
 * Nothing here is new to the design system. The card, header, day stepper and
 * buttons are the ones the Patients screen already draws, and a visit is the
 * same recessed tile with a status bar that its day column uses — widened to
 * carry the visit's details. The arrangement follows the design reference
 * (time down the side, operatories across, visits placed by their times); the
 * look is the theme's.
 *
 * Like every screen it is a pure projection of its dataset
 * (`src/data/schedule.ts`) and brings its own rail — there is no shared shell.
 */

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'

import { Icon } from '../components/Icon.tsx'
import { Rail } from '../components/Rail.tsx'
import { patients } from '../data/patients.ts'
import { schedule, type Visit } from '../data/schedule.ts'

/** Height of one slot row, width of the time gutter and the least an operatory column may be — spacing units. */
const SLOT_UNITS = 5
const GUTTER_UNITS = 9
const COLUMN_MIN_UNITS = 22

const ISO_DATE = 'YYYY-MM-DD'

const STATUS_BY_ID = new Map(schedule.statuses.map((status) => [status.id, status]))

/** `HH:mm` as minutes since midnight. */
function minutes(time: string) {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

/** A time as slot rows down from the top of the grid. */
const slotsDown = (time: string) =>
  (minutes(time) - schedule.firstHour * 60) / schedule.slotMinutes

/** In the accessibility tree, not on screen — the standard clip pattern. */
const SCREEN_READER_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const

// ─── VISIT CARD ───────────────────────────────────────────────────────────

/** Room kept on the right of a card's top lines for the edit button, spacing units. */
const EDIT_CLEARANCE = 3

/**
 * One labelled line on a visit card: the label in bold, its value after it.
 *
 * Kept to ONE line and cut with an ellipsis when the column is narrow — a
 * phone number or an address broken across two lines mid-word reads as two
 * different values. `full` puts the whole value in the native tooltip.
 */
function VisitLine({
  label,
  full,
  wrap = false,
  children,
}: {
  label: string
  full?: string
  /**
   * Let the line break instead of cutting it. For the patient's name: it is a
   * link, a link is cut whole or not at all, and a card that read
   * "Patient: …" would have lost the one thing it is for.
   */
  wrap?: boolean
  children: React.ReactNode
}) {
  return (
    <Typography variant="caption" component="p" noWrap={!wrap} title={full} sx={{ lineHeight: 1.4 }}>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Box>{' '}
      {children}
    </Typography>
  )
}

function VisitCard({
  visit,
  onOpenPatient,
}: {
  visit: Visit
  onOpenPatient: (visit: Visit) => void
}) {
  const status = STATUS_BY_ID.get(visit.status)
  const { visitLabels } = schedule

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        px: 1,
        py: 0.75,
        borderRadius: 0.5,
        // The page colour, as a recessed tile on the card — opaque, so the
        // grid lines do not show through the visit.
        bgcolor: 'background.default',
        // The bar is an index into the status written on the first line,
        // never the only place the status is stated.
        borderLeft: 4,
        borderLeftColor: status ? `${status.tone}.main` : 'text.disabled',
      }}
    >
      {/* The status in words, with the time for a screen reader — sighted
          users read the time off the card's position in the grid. */}
      <Typography
        variant="caption"
        component="p"
        color="text.secondary"
        noWrap
        // Level with the edit button, so it stops short of it.
        sx={{ fontWeight: 600, lineHeight: 1.4, pr: EDIT_CLEARANCE }}
      >
        <Box component="span" sx={SCREEN_READER_ONLY}>
          {`${visit.start}–${visit.end} `}
        </Box>
        {status?.label}
      </Typography>

      <VisitLine label={`${visitLabels.patient}:`} wrap>
        {/* A link, because it leads to the patient's record. */}
        <Link
          component="button"
          variant="caption"
          underline="hover"
          onClick={() => onOpenPatient(visit)}
          sx={{ fontWeight: 600, verticalAlign: 'baseline', textAlign: 'left' }}
        >
          {visit.patient}
        </Link>
      </VisitLine>
      <VisitLine label={visitLabels.provider} full={visit.provider}>
        {visit.provider}
      </VisitLine>
      <VisitLine label={`${visitLabels.reason}:`} full={visit.reason}>
        {visit.reason}
      </VisitLine>
      <VisitLine label={`${visitLabels.phone}:`} full={visit.phone}>
        {visit.phone}
      </VisitLine>
      <VisitLine label={`${visitLabels.email}:`} full={visit.email}>
        {visit.email}
      </VisitLine>

      <Tooltip title={schedule.editVisit}>
        <IconButton
          aria-label={`${schedule.editVisit}: ${visit.patient}`}
          size="small"
          // Tight to the corner, level with the status line only.
          sx={{ position: 'absolute', top: 2, right: 2, p: 0.25, color: 'text.secondary' }}
        >
          <Icon name="edit" size={18} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ─── DAY GRID ─────────────────────────────────────────────────────────────

function DayGrid({ onOpenChart }: { onOpenChart: () => void }) {
  const [date, setDate] = useState(schedule.today)
  const [noChartOpen, setNoChartOpen] = useState(false)

  const visitsByOperatory = useMemo(() => {
    const found = new Map<string, Visit[]>()
    for (const visit of schedule.visits) {
      if (visit.date !== date) continue
      const list = found.get(visit.operatoryId)
      if (list) list.push(visit)
      else found.set(visit.operatoryId, [visit])
    }
    return found
  }, [date])
  const dayIsEmpty = visitsByOperatory.size === 0

  const shiftDay = (days: number) =>
    setDate((current) => dayjs(current).add(days, 'day').format(ISO_DATE))

  /**
   * Picking a patient. Only the visit whose record this frontend has a chart
   * for leaves the screen; any other SAYS it has none rather than doing
   * nothing — the same rule the Patients list follows.
   */
  const openPatient = (visit: Visit) => {
    if (visit.patientId === patients.chartedPatientId) onOpenChart()
    else setNoChartOpen(true)
  }

  const slotsPerHour = 60 / schedule.slotMinutes
  const slotCount = (schedule.lastHour - schedule.firstHour) * slotsPerHour
  const slots = Array.from({ length: slotCount }, (_, index) => {
    const time = dayjs(schedule.today)
      .hour(schedule.firstHour)
      .minute(index * schedule.slotMinutes)
    return {
      index,
      onTheHour: index % slotsPerHour === 0,
      clock: time.format(schedule.timeFormat),
      meridiem: time.format(schedule.meridiemFormat),
    }
  })
  /** Half-hour blocks: a solid line on top, the quarter-hour dashed inside. */
  const blocks = Array.from({ length: slotCount / 2 }, (_, index) => index)

  // The record's own caret, turned on its side — as the Patients day column does.
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
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
          {schedule.title}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexGrow: 1 }}>
          {dayButton(schedule.previousDay, -1, 'rotate(90deg)')}
          <Typography
            variant="subtitle2"
            component="p"
            aria-live="polite"
            sx={{ minWidth: 96, textAlign: 'center' }}
          >
            {dayjs(date).format(schedule.dateFormat)}
          </Typography>
          {dayButton(schedule.nextDay, 1, 'rotate(-90deg)')}
        </Stack>

        {schedule.actions.map((action) => (
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

      {/*
        The only scrolling region, in both directions: twelve hours of
        quarter-hour rows are taller than the card, and seven operatories at a
        readable width are wider than a small window. The operatory names stay
        pinned to the top and the times to the left while it scrolls.
      */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Box
          sx={(theme) => ({
            // Every position below is a multiple of these, so the grid lines,
            // the time labels, the cards and the "now" line cannot drift apart.
            '--slot': theme.spacing(SLOT_UNITS),
            '--gutter': theme.spacing(GUTTER_UNITS),
            '--column': theme.spacing(COLUMN_MIN_UNITS),
            minWidth: `calc(var(--gutter) + var(--column) * ${schedule.operatories.length})`,
          })}
        >
          {/* ── Operatory names ─────────────────────────────────────────── */}
          <Stack
            direction="row"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 3,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 'var(--gutter)',
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 1,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
              }}
            />
            {schedule.operatories.map((operatory) => (
              <Typography
                key={operatory.id}
                variant="subtitle2"
                component="h2"
                color="text.secondary"
                sx={{
                  flex: '1 1 0',
                  minWidth: 'var(--column)',
                  py: 1,
                  textAlign: 'center',
                  borderRight: 1,
                  borderColor: 'divider',
                }}
              >
                {operatory.label}
              </Typography>
            ))}
          </Stack>

          {/* ── The day ─────────────────────────────────────────────────── */}
          <Stack direction="row" sx={{ position: 'relative' }}>
            {/* Times, one per row; the hour in bold so the eye can find it. */}
            <Box
              sx={{
                width: 'var(--gutter)',
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 2,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
              }}
            >
              {slots.map((slot) => (
                <Typography
                  key={slot.index}
                  variant="caption"
                  component="p"
                  sx={{
                    height: 'var(--slot)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: slot.onTheHour ? 700 : 400,
                    color: slot.onTheHour ? 'text.primary' : 'text.secondary',
                    borderTop: slot.index > 0 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <span>{slot.clock}</span>
                  <span>{slot.meridiem}</span>
                </Typography>
              ))}
            </Box>

            {schedule.operatories.map((operatory) => (
              <Box
                key={operatory.id}
                sx={{
                  flex: '1 1 0',
                  minWidth: 'var(--column)',
                  position: 'relative',
                  borderRight: 1,
                  borderColor: 'divider',
                }}
              >
                {blocks.map((block) => (
                  <Box
                    key={block}
                    sx={{
                      height: 'calc(var(--slot) * 2)',
                      position: 'relative',
                      borderTop: block > 0 ? 1 : 0,
                      borderColor: 'divider',
                      // The quarter hour, dashed so it reads as lighter.
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
                ))}

                <Box
                  component="ul"
                  aria-label={operatory.label}
                  sx={{ position: 'absolute', inset: 0, m: 0, p: 0, listStyle: 'none' }}
                >
                  {(visitsByOperatory.get(operatory.id) ?? []).map((visit) => (
                    <Box
                      component="li"
                      key={visit.id}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `calc(var(--slot) * ${slotsDown(visit.start)})`,
                        height: `calc(var(--slot) * ${slotsDown(visit.end) - slotsDown(visit.start)})`,
                        // Padding rather than a gap, so back-to-back visits
                        // stay visibly two cards.
                        p: 0.25,
                      }}
                    >
                      <VisitCard visit={visit} onOpenPatient={openPatient} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}

            {dayIsEmpty && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  top: 'calc(var(--slot) * 4)',
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
                  top: `calc(var(--slot) * ${slotsDown(schedule.now)})`,
                  height: 2,
                  zIndex: 1,
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
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={noChartOpen}
        autoHideDuration={4000}
        onClose={() => setNoChartOpen(false)}
        message={schedule.noChartMessage}
      />
    </Paper>
  )
}

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function Schedule({
  onOpenChart,
  onNavigate,
}: {
  /** Leaves the schedule for the record — called when the charted patient is picked. */
  onOpenChart: () => void
  /** A rail item was picked; the app decides whether it leads anywhere. */
  onNavigate: (id: string) => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        // Pinned to the viewport like the other screens: the grid scrolls
        // inside its card, the page never does.
        height: '100vh',
        overflow: 'clip',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Rail rail={schedule.rail} onSelect={onNavigate} />
      <Stack
        direction="row"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          p: (theme) => theme.layout.gutter,
        }}
      >
        <DayGrid onOpenChart={onOpenChart} />
      </Stack>
    </Box>
  )
}
