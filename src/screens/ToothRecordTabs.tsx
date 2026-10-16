/**
 * The two tabs of the tooth panel that are not a chart form: Medication and
 * History.
 *
 * Reached through `PatientChart.tsx`, which hands each to the panel as a tab's
 * content. They live in their own file rather than as local functions there
 * because neither needs anything of the chart's state beyond what it is passed.
 *
 * Nothing here is new to the design system: the table is the Patients list's
 * (the same grid, the same filter in each header), and the history cards are
 * the outlined rows the panel already uses for a tooth's notes.
 */

import { useId, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'

import { distinctOptions } from '../components/filterOptions.ts'
import { HeaderFilter } from '../components/HeaderFilter.tsx'
import { alpha } from '@mui/material/styles'

import { Icon } from '../components/Icon.tsx'
import fluorideToothpaste from '../assets/medications/fluoride-toothpaste.png'
import paracetamol from '../assets/medications/paracetamol.png'
import {
  patientChart,
  type MedicationColumnId,
  type MedicationImageId,
  type ToothMedication,
} from '../data/patientChart.ts'

// ─── MEDICATION ───────────────────────────────────────────────────────────

/** The columns, in reading order. */
const MEDICATION_COLUMNS: MedicationColumnId[] = [
  'name',
  'prescribed',
  'reason',
  'provider',
  'pharmacy',
  'npi',
  'dea',
]

/**
 * Column widths in px (the grid's own unit). Fixed, not flexed: seven columns
 * do not fit the panel, so the table keeps each one readable and scrolls
 * sideways inside itself instead of squeezing them all to a few characters.
 */
const MEDICATION_WIDTHS: Record<MedicationColumnId, number> = {
  name: 220,
  prescribed: 140,
  reason: 170,
  provider: 180,
  pharmacy: 180,
  npi: 130,
  dea: 130,
}

/** The pack shots by id — see `MedicationImageId`. Stock product photos standing in; not a real patient's medication. */
const MEDICATION_IMAGES: Record<MedicationImageId, string> = {
  'fluoride-toothpaste': fluorideToothpaste,
  paracetamol,
}

/**
 * The small picture at the head of a medication card: its pack shot where
 * one exists, the prescription glyph where none does. `image` is the row's
 * own; without it the shot is looked up by the drug's name, so a line typed
 * in the treatment dialog shows the same picture as the record's row for the
 * same drug. Decorative either way — the name beside it says what it is.
 */
export function MedicationThumb({
  name,
  image,
  size = 56,
}: {
  name: string
  image?: MedicationImageId
  size?: number
}) {
  const id =
    image ??
    patientChart.odontogram.toothPanel.medication.rows.find((row) => row.name === name)?.image
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        color: 'primary.main',
      }}
    >
      {id ? (
        <Box
          component="img"
          src={MEDICATION_IMAGES[id]}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
        />
      ) : (
        <Icon name="erx" size={Math.round(size * 0.43)} />
      )}
    </Box>
  )
}

/** Header height in px — taller than stock, for the filter under each label. */
const HEADER_HEIGHT = 64

/** Thickness of the table's horizontal scrollbar, px. */
const SCROLLBAR_SIZE = 10

type MedicationFilters = Record<MedicationColumnId, string>

/** `''` on every filter means "All". */
const NO_FILTERS = Object.fromEntries(
  MEDICATION_COLUMNS.map((id) => [id, '']),
) as MedicationFilters

/**
 * What was prescribed for one tooth.
 *
 * The same table as the Patients list, narrowed from its headers the same way.
 * A tooth with nothing prescribed gets the panel's empty line instead of an
 * empty grid — a table with headers and no rows reads as "failed to load".
 */
export function ToothMedicationTable({ fdi }: { fdi: number }) {
  const { medication, empty } = patientChart.odontogram.toothPanel
  // Newest first, as the history is.
  const prescribed = useMemo(
    () =>
      medication.rows
        .filter((row) => row.fdi === fdi)
        .sort((a, b) => b.prescribed.localeCompare(a.prescribed)),
    [medication.rows, fdi],
  )

  if (prescribed.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty.medication}
      </Typography>
    )
  }

  /*
   * One card per prescription — the panel is too narrow for the seven-column
   * table the Patients record uses, and a tooth has a handful at most. The
   * drug leads, then why, then when and by whom, and the two registry numbers
   * last: identifiers, not something to read at a glance.
   */
  return (
    <Stack component="ul" aria-label={medication.label} spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {prescribed.map((row) => (
        <Box
          component="li"
          key={row.id}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <MedicationThumb name={row.name} image={row.image} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              {/* The drug, with the date it was written opposite — the two
                  things a glance down the list wants. */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3, flexGrow: 1 }}>
                  {row.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                >
                  {dayjs(row.prescribed).format(medication.dateFormat)}
                </Typography>
              </Stack>
              {/* Why, as a badge: the reason is the one word that sorts a list
                  of prescriptions, so it stands apart from the prose. */}
              <Chip
                size="small"
                label={row.reason}
                sx={{ mt: 1, bgcolor: 'background.paper', fontWeight: 500 }}
              />
            </Box>
          </Stack>

          {/* Who wrote it and where it goes, under a rule: the prescriber
              with the person glyph, the pharmacy with its own, and their two
              registry numbers last — identifiers, not something to read at a
              glance. */}
          <Divider sx={{ my: 1.5 }} />
          {/* The two side by side, 20px apart, in the same ink as the
              registry line under them. */}
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2.5, rowGap: 0.5, alignItems: 'center', color: 'text.primary' }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Icon name="general" size={16} />
              <Typography variant="body2">{row.provider}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Icon name="pharmacy" size={16} />
              <Typography variant="body2">{row.pharmacy}</Typography>
            </Stack>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}
          >
            {`${medication.columns.npi} ${row.npi} · ${medication.columns.dea} ${row.dea}`}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/**
 * The medication table itself, for whichever prescriptions it is handed: one
 * tooth's in the tooth panel, the whole patient's on the Rx history tab of the
 * patient's details.
 *
 * `stretch` is for the page: there the table has the width of a card, so its
 * columns share it out instead of keeping fixed widths and scrolling sideways.
 */
export function MedicationTable({
  prescribed,
  emptyText,
  stretch = false,
}: {
  prescribed: ToothMedication[]
  /** Said instead of an empty grid when there is nothing prescribed at all. */
  emptyText: string
  stretch?: boolean
}) {
  const table = patientChart.odontogram.toothPanel.medication
  const [filters, setFilters] = useState<MedicationFilters>(NO_FILTERS)

  const columns = useMemo<GridColDef<ToothMedication>[]>(() => {
    // A cell's value as it is SHOWN — what a filter option has to match.
    const shown = (row: ToothMedication, id: MedicationColumnId) =>
      id === 'prescribed' ? dayjs(row.prescribed).format(table.dateFormat) : row[id]

    return MEDICATION_COLUMNS.map((id) => ({
      field: id,
      headerName: table.columns[id],
      // In proportion on a page, at a fixed width in the panel.
      ...(stretch
        ? { flex: MEDICATION_WIDTHS[id], minWidth: 120 }
        : { width: MEDICATION_WIDTHS[id] }),
      renderHeader: () => (
        <HeaderFilter
          title={table.columns[id]}
          label={`${table.filters.by} ${table.columns[id].toLowerCase()}`}
          allLabel={table.filters.all}
          value={filters[id]}
          options={distinctOptions(prescribed.map((row) => shown(row, id)))}
          onChange={(value) => setFilters((current) => ({ ...current, [id]: value }))}
        />
      ),
      // Sorted on the ISO value, shown the way the record writes dates.
      ...(id === 'prescribed' && {
        valueFormatter: (value: string) => dayjs(value).format(table.dateFormat),
      }),
      // The pharmacy is somewhere you can go — a link, like "Set date" on the
      // record. Nothing is behind it yet.
      ...(id === 'pharmacy' && {
        renderCell: ({ value }: { value?: string }) => (
          <Link component="button" type="button" variant="body2" underline="hover">
            {value}
          </Link>
        ),
      }),
    }))
  }, [table, filters, prescribed, stretch])

  const rows = useMemo(
    () =>
      prescribed.filter((row) =>
        MEDICATION_COLUMNS.every((id) => {
          if (!filters[id]) return true
          const value =
            id === 'prescribed' ? dayjs(row.prescribed).format(table.dateFormat) : row[id]
          return value === filters[id]
        }),
      ),
    [prescribed, filters, table.dateFormat],
  )

  if (prescribed.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    )
  }

  return (
    <DataGrid
      label={table.label}
      rows={rows}
      columns={columns}
      // As tall as its rows: a tooth has a handful of prescriptions, and the
      // panel around the table is what scrolls.
      autoHeight
      columnHeaderHeight={HEADER_HEIGHT}
      disableColumnMenu
      rowSelection={false}
      // No paging for a list this short. The grid still pages at a hundred
      // rows underneath, which one tooth's prescriptions will not reach.
      hideFooter
      localeText={{ noRowsLabel: table.noMatches }}
      // The grid sizes its own scrollbars from the browser's — which is zero
      // here, because the theme hides native scrollbars app-wide. Stating a
      // size gives the horizontal bar a track to live in.
      scrollbarSize={SCROLLBAR_SIZE}
      sx={{
        /*
         * A VISIBLE horizontal scrollbar, on this table alone. Seven columns
         * are wider than the panel, and with every scrollbar in the app
         * hidden there was nothing to say the table went on to the right —
         * and nothing for a mouse without a sideways wheel to scroll it by.
         * This puts the bar back for the grid's own scrollbar element; the
         * rest of the app stays bar-less.
         */
        '& .MuiDataGrid-scrollbar--horizontal': {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { display: 'block', height: SCROLLBAR_SIZE },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: SCROLLBAR_SIZE,
            backgroundColor: (theme) => theme.vars.palette.action.disabled,
          },
        },
        // Dates and the two registry numbers are read down the column;
        // equal-width digits line them up.
        '& .MuiDataGrid-cell[data-field="prescribed"], & .MuiDataGrid-cell[data-field="npi"], & .MuiDataGrid-cell[data-field="dea"]':
          { fontVariantNumeric: 'tabular-nums' },
        // A click here picks nothing, so it leaves no ring behind; the ring
        // stays for the keyboard, as on the Patients list.
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
        '& .MuiDataGrid-cell:focus-visible': {
          outline: '1px solid',
          outlineColor: 'primary.main',
          outlineOffset: -1,
        },
      }}
    />
  )
}

// ─── HISTORY ──────────────────────────────────────────────────────────────

/** One action marked on a tooth, ready to show. */
export interface ToothAction {
  /** Stable for the life of the entry — the list's key, and what Done reports. */
  id: string
  /** What was decided — "Treat". */
  label: string
  /** What it was decided ABOUT: the tooth and what was assessed on it. */
  summary: string
  done: boolean
}

/**
 * The actions marked on one tooth, newest first — one card each.
 *
 * A card says what was decided and on what, and carries one button: Done. The
 * button is a toggle, like the one that marks the tooth in the first place —
 * `aria-pressed` and a tick say it is on, so a done action is never told apart
 * by its colour alone, and a slip can be undone by pressing it again.
 */
export function ToothHistoryList({
  part,
  fdi,
  actions,
  onToggleDone,
}: {
  /**
   * Which half shows: the `actions` marked on the tooth (the Treatment tab)
   * or the dated `updates` on record (the History dialog). The two used to
   * share one tab.
   */
  part: 'actions' | 'updates'
  fdi: number
  actions: ToothAction[]
  onToggleDone: (id: string) => void
}) {
  const { toothPanel } = patientChart.odontogram
  const { history } = toothPanel
  const updatesId = useId()

  // What is on record for this tooth, newest first.
  const updates = useMemo(
    () =>
      history.updates
        .filter((update) => update.fdi === fdi)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [history.updates, fdi],
  )

  const shown = part === 'actions' ? actions.length : updates.length
  if (shown === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {part === 'actions' ? toothPanel.empty.treatment : toothPanel.empty.history}
      </Typography>
    )
  }

  return (
    <Stack spacing={2.5}>
      {part === 'actions' && (
        <Stack
          component="ul"
          aria-label={toothPanel.history.label}
          spacing={1}
          sx={{ m: 0, p: 0, listStyle: 'none' }}
        >
          {actions.map((action) => (
            <Stack
              component="li"
              key={action.id}
              direction="row"
              sx={{
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                alignItems: 'center',
                borderRadius: 1.5,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" component="p" color="text.secondary">
                  {`${action.label}:`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, lineHeight: 1.4, overflowWrap: 'anywhere' }}
                >
                  {action.summary}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                aria-pressed={action.done}
                startIcon={action.done ? <Icon name="check" size={18} /> : undefined}
                onClick={() => onToggleDone(action.id)}
                sx={{ flexShrink: 0 }}
              >
                {toothPanel.history.done}
              </Button>
            </Stack>
          ))}
        </Stack>
      )}

      {/*
        The dated record of what has happened to the tooth before today — one
        card per update: what, the detail, and under it when and by whom. Read
        only: history is not edited from here.
      */}
      {part === 'updates' && (
        <Box>
          <Typography
            id={updatesId}
            variant="caption"
            component="h4"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 600, mb: 1 }}
          >
            {history.updatesTitle}
          </Typography>
          <Stack
            component="ul"
            aria-labelledby={updatesId}
            spacing={1}
            sx={{ m: 0, p: 0, listStyle: 'none' }}
          >
            {updates.map((update) => (
              <Stack
                component="li"
                key={update.id}
                direction="row"
                sx={{
                  gap: 1.25,
                  px: 1.5,
                  py: 1.25,
                  alignItems: 'flex-start',
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <Box
                  aria-hidden
                  sx={{ display: 'flex', flexShrink: 0, pt: 0.25, color: 'text.secondary' }}
                >
                  <Icon name="history" size={16} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {update.title}
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                    {update.detail}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {`${dayjs(update.date).format(history.dateFormat)} · ${update.by}`}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
