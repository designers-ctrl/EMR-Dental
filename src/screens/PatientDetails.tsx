/**
 * The Patient details — everything on file about the patient, in a dialog.
 *
 * The sidebar of the patient record is a digest, and "See full patient
 * details" under its allergies opens this OVER the record: the section that
 * was up (the chart, the imaging) stays where it is underneath, dimmed, with
 * everything entered on it intact, and closing the dialog is back to exactly
 * that. It used to take the chart's place on the right instead — which threw
 * away whatever had been charted, and left no way back but picking a section
 * again. One dialog, five tabs — Personal, Family, Insurance, M&D history, Rx
 * history.
 *
 * Read-only for now. The Edit and New member buttons are where editing will
 * hang from; nothing is behind them yet, like the unbuilt actions elsewhere.
 * The history's tick boxes are drawn as boxes because that is how a history is
 * read, but they do not take a click — an accidental tick on a medical history
 * is exactly the edit this must not allow without an editor and a Save.
 *
 * Nothing here is new to the design system: the card, breadcrumb, status chip
 * and labelled fields are the chart sidebar's, the tables are the Patients
 * list's (same grid, same filter in each header), and the medication table is
 * the tooth panel's own, handed the whole patient's prescriptions.
 *
 * A pure projection of its dataset (`src/data/patientDetails.ts`). Mounted by
 * `PatientChart.tsx`, which owns whether it is open.
 */

import { useId, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'

import { distinctOptions } from '../components/filterOptions.ts'
import { HeaderFilter } from '../components/HeaderFilter.tsx'
import { Icon } from '../components/Icon.tsx'
import { patientChart } from '../data/patientChart.ts'
import {
  patientDetails,
  type DetailCheck,
  type DetailField,
  type DetailSection,
  type FamilyColumnId,
  type FamilyMember,
  type PatientDetailsTabId,
} from '../data/patientDetails.ts'
import { MedicationTable } from './ToothRecordTabs.tsx'

// ─── LABELLED VALUES AND CHECKLISTS ───────────────────────────────────────

/** Three across on a wide card, fewer as it narrows — never squeezed. */
const THREE_COLUMNS = {
  xs: '1fr',
  sm: 'repeat(2, minmax(0, 1fr))',
  lg: 'repeat(3, minmax(0, 1fr))',
} as const

/**
 * Labelled values, three across — a description list, which is what it is.
 * A value that is not on file is said in words: an empty cell could as easily
 * mean "failed to load".
 */
function FieldGrid({ fields }: { fields: DetailField[] }) {
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: THREE_COLUMNS,
        columnGap: 3,
        rowGap: 2.5,
        m: 0,
      }}
    >
      {fields.map((field) => (
        <Box key={field.id} sx={{ minWidth: 0 }}>
          <Typography component="dt" variant="caption" color="text.secondary">
            {field.label}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{
              m: 0,
              fontWeight: 500,
              overflowWrap: 'anywhere',
              color: field.value === null ? 'text.secondary' : 'text.primary',
            }}
          >
            {field.value ?? patientDetails.notRecorded}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

/**
 * A checklist as it was recorded: every line shown, ticked or not, because
 * "not ticked" is part of the history too.
 *
 * Real checkboxes, so they are announced as ticked or not — but read-only and
 * out of reach of the pointer and the Tab key. See the note at the top.
 *
 * Laid out in CSS columns rather than a grid: the list is read DOWN each
 * column, the way the form it came from is.
 */
function CheckList({ checks }: { checks: DetailCheck[] }) {
  return (
    <Box
      component="ul"
      sx={{ m: 0, p: 0, listStyle: 'none', columnCount: { xs: 1, sm: 2, lg: 3 }, columnGap: 3 }}
    >
      {checks.map((item) => (
        <Box component="li" key={item.id} sx={{ breakInside: 'avoid' }}>
          <FormControlLabel
            label={item.label}
            control={
              <Checkbox
                checked={item.checked}
                size="small"
                disableRipple
                tabIndex={-1}
                slotProps={{ input: { readOnly: true, 'aria-readonly': true } }}
              />
            }
            slotProps={{ typography: { variant: 'body2' } }}
            sx={{ pointerEvents: 'none' }}
          />
        </Box>
      ))}
    </Box>
  )
}

/** A titled block: its heading, its own Edit where it has one, then its content. */
function Section({ section }: { section: DetailSection }) {
  return (
    <Stack component="section" spacing={2} aria-label={section.title}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {section.title}
        </Typography>
        {section.editable && (
          <Button
            variant="outlined"
            size="small"
            aria-label={`${patientDetails.actions.edit}: ${section.title}`}
          >
            {patientDetails.actions.edit}
          </Button>
        )}
      </Stack>
      {section.fields && <FieldGrid fields={section.fields} />}
      {section.checks && <CheckList checks={section.checks} />}
    </Stack>
  )
}

/** Sections one under another, ruled apart. */
function Sections({ sections }: { sections: DetailSection[] }) {
  return (
    <Stack spacing={3} divider={<Divider />}>
      {sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </Stack>
  )
}

/** The line that says a tab's contents are a sample — on screen, not only in the dataset. */
function Disclaimer({ children }: { children: string }) {
  return (
    <Typography variant="caption" component="p" color="text.secondary">
      {children}
    </Typography>
  )
}

// ─── FAMILY ───────────────────────────────────────────────────────────────

const FAMILY_COLUMNS: FamilyColumnId[] = [
  'firstName',
  'lastName',
  'gender',
  'email',
  'phone',
  'dateOfBirth',
  'relationship',
  'status',
]

/** Each column's share of the card's width, and the least it may shrink to (px). */
const FAMILY_WIDTHS: Record<FamilyColumnId, { flex: number; minWidth: number }> = {
  firstName: { flex: 1, minWidth: 110 },
  lastName: { flex: 1, minWidth: 110 },
  gender: { flex: 0.8, minWidth: 100 },
  email: { flex: 1.8, minWidth: 200 },
  phone: { flex: 1.2, minWidth: 140 },
  dateOfBirth: { flex: 1, minWidth: 120 },
  relationship: { flex: 1, minWidth: 120 },
  status: { flex: 1, minWidth: 130 },
}

/** Header height in px — taller than stock, for the filter under each label. */
const HEADER_HEIGHT = 64

type FamilyFilters = Record<FamilyColumnId, string>

const NO_FAMILY_FILTERS = Object.fromEntries(
  FAMILY_COLUMNS.map((id) => [id, '']),
) as FamilyFilters

/** What the grid shares with the Patients list: no ring left by a click, kept for the keyboard. */
const GRID_SX = {
  border: 0,
  borderRadius: 0,
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-visible': {
    outline: '1px solid',
    outlineColor: 'primary.main',
    outlineOffset: -1,
  },
} as const

function FamilyTable() {
  const { family, dateFormat, notRecorded } = patientDetails
  const [filters, setFilters] = useState<FamilyFilters>(NO_FAMILY_FILTERS)

  const columns = useMemo<GridColDef<FamilyMember>[]>(() => {
    const statusLabel = (id: FamilyMember['status']) =>
      family.statuses.find((status) => status.id === id)?.label ?? id
    // A cell's value as it is SHOWN — what a filter option has to match.
    const shown = (member: FamilyMember, id: FamilyColumnId): string | null =>
      id === 'dateOfBirth'
        ? dayjs(member.dateOfBirth).format(dateFormat)
        : id === 'status'
          ? statusLabel(member.status)
          : member[id]

    const empty = (
      <Typography variant="body2" component="span" color="text.secondary">
        {notRecorded}
      </Typography>
    )

    return FAMILY_COLUMNS.map((id) => ({
      field: id,
      headerName: family.columns[id],
      ...FAMILY_WIDTHS[id],
      // Sorts on the word shown: the status by its name, the rest as they are.
      valueGetter: (_value: unknown, member: FamilyMember) =>
        id === 'status' ? statusLabel(member.status) : (member[id] ?? ''),
      renderHeader: () => (
        <HeaderFilter
          title={family.columns[id]}
          label={`${family.filters.by} ${family.columns[id].toLowerCase()}`}
          allLabel={family.filters.all}
          value={filters[id]}
          options={distinctOptions(family.members.map((member) => shown(member, id)))}
          onChange={(value) => setFilters((current) => ({ ...current, [id]: value }))}
        />
      ),
      // Sorted on the ISO value, shown the way the record writes dates.
      ...(id === 'dateOfBirth' && {
        valueFormatter: (value: string) => dayjs(value).format(dateFormat),
      }),
      // An address and a number are things you can act on — real links, which
      // open the mail client and the dialler.
      ...(id === 'email' && {
        renderCell: ({ row }: { row: FamilyMember }) =>
          row.email ? (
            <Link href={`mailto:${row.email}`} variant="body2" underline="hover" noWrap>
              {row.email}
            </Link>
          ) : (
            empty
          ),
      }),
      ...(id === 'phone' && {
        renderCell: ({ row }: { row: FamilyMember }) =>
          row.phone ? (
            <Link
              href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
              variant="body2"
              underline="hover"
              noWrap
            >
              {row.phone}
            </Link>
          ) : (
            empty
          ),
      }),
      // The same small outlined chip the patient's own status wears. Its word
      // is the status; the colour only helps find it.
      ...(id === 'status' && {
        renderCell: ({ row }: { row: FamilyMember }) => {
          const status = family.statuses.find((option) => option.id === row.status)
          return (
            <Chip
              label={status?.label ?? row.status}
              size="small"
              color={status?.tone ?? 'default'}
              variant="outlined"
            />
          )
        },
      }),
    }))
  }, [family, dateFormat, notRecorded, filters])

  const rows = useMemo(() => {
    const statusLabel = (id: FamilyMember['status']) =>
      family.statuses.find((status) => status.id === id)?.label ?? id
    return family.members.filter((member) =>
      FAMILY_COLUMNS.every((id) => {
        if (!filters[id]) return true
        const value =
          id === 'dateOfBirth'
            ? dayjs(member.dateOfBirth).format(dateFormat)
            : id === 'status'
              ? statusLabel(member.status)
              : member[id]
        return value === filters[id]
      }),
    )
  }, [family, dateFormat, filters])

  return (
    <DataGrid
      label={family.label}
      rows={rows}
      columns={columns}
      // As tall as its rows; the card around it is what scrolls.
      autoHeight
      columnHeaderHeight={HEADER_HEIGHT}
      disableColumnMenu
      rowSelection={false}
      // A family is a handful of rows — nothing to page through.
      hideFooter
      localeText={{ noRowsLabel: family.noMatches }}
      sx={{
        ...GRID_SX,
        '& .MuiDataGrid-cell[data-field="dateOfBirth"], & .MuiDataGrid-cell[data-field="phone"]': {
          fontVariantNumeric: 'tabular-nums',
        },
      }}
    />
  )
}

// ─── PANEL ────────────────────────────────────────────────────────────────

/** Tabs whose content is a table: it runs edge to edge, so the panel adds no padding. */
const TABLE_TABS: ReadonlySet<PatientDetailsTabId> = new Set(['family'])

/**
 * The details dialog: wide, and as tall as the window allows whatever tab is
 * up — a dialog that changed height from tab to tab would jump under the
 * pointer.
 */
export function PatientDetailsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: { height: '100%', borderRadius: 2 } } }}
    >
      <PatientDetailsContent titleId={titleId} onClose={onClose} />
    </Dialog>
  )
}

/**
 * What the dialog holds: its heading, the sections as tabs, the action that
 * belongs to the one in view, and its content.
 *
 * The heading names the patient. The sidebar that says whose record this is
 * lies dimmed behind the dialog, and a page of personal and medical details
 * must never leave "whose?" to be worked out from what is behind it.
 *
 * The tab in view is held here, inside the dialog, so each opening starts on
 * the first tab.
 */
function PatientDetailsContent({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  const { odontogram, patient } = patientChart
  const [tab, setTab] = useState<PatientDetailsTabId>(patientDetails.tabs[0].id)
  const baseId = useId()
  const tabId = (id: PatientDetailsTabId) => `${baseId}-tab-${id}`
  const panelId = `${baseId}-panel`

  return (
    <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        sx={{ flexShrink: 0, px: 2.5, pt: 2, gap: 2, alignItems: 'flex-start' }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography id={titleId} variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            {patientDetails.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${patient.name} · ${patient.idLabel} ${patient.id}`}
          </Typography>
        </Box>
        <IconButton aria-label={patientDetails.close} onClick={onClose} edge="end">
          <Icon name="close" size={22} />
        </IconButton>
      </Stack>

      {/* ── The sections, and the action that belongs to the one in view ── */}
      <Stack
        direction="row"
        sx={{
          flexShrink: 0,
          px: 2.5,
          pt: 1,
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, id: PatientDetailsTabId) => setTab(id)}
          aria-label={patientDetails.tabsLabel}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 'auto', minWidth: 0 }}
        >
          {patientDetails.tabs.map((option) => (
            <Tab
              key={option.id}
              value={option.id}
              id={tabId(option.id)}
              aria-controls={panelId}
              label={option.label}
              sx={{
                minHeight: 48,
                minWidth: 0,
                color: 'text.secondary',
                '&.Mui-selected': { fontWeight: 700 },
              }}
            />
          ))}
        </Tabs>

        {tab === 'personal' && (
          <Button variant="outlined" size="small">
            {patientDetails.actions.edit}
          </Button>
        )}
        {tab === 'family' && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Icon name={patientDetails.actions.newMember.icon} size={18} />}
          >
            {patientDetails.actions.newMember.label}
          </Button>
        )}
      </Stack>

      <Divider />

      {/* The only part that scrolls. */}
      <Box
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(tab)}
        sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: TABLE_TABS.has(tab) ? 0 : 2.5 }}
      >
        {tab === 'personal' && <FieldGrid fields={patientDetails.personal.fields} />}

        {tab === 'family' && <FamilyTable />}

        {tab === 'insurance' && <Sections sections={patientDetails.insurance.sections} />}

        {tab === 'history' && (
          <Stack spacing={2.5}>
            <Disclaimer>{patientDetails.history.disclaimer}</Disclaimer>
            <Sections sections={patientDetails.history.sections} />
          </Stack>
        )}

        {/* Every prescription on the record — the same rows the tooth panel
            shows tooth by tooth, here all together. */}
        {tab === 'rx' && (
          <MedicationTable
            prescribed={odontogram.toothPanel.medication.rows}
            emptyText={patientDetails.rx.empty}
            stretch
          />
        )}
      </Box>
    </Box>
  )
}
