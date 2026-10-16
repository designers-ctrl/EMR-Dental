/**
 * The "Add treatment" dialog — a procedure, its fee, a note and, if wanted, a
 * prescription, for one finding on one tooth.
 *
 * Reached through `PatientChart.tsx`, from "Add treatment" on a record in the
 * tooth panel. It is a helper, not a screen: the chart owns whether it is up
 * and what happens to what it reports; this owns only what is being typed.
 *
 * One job: choose the procedure. That is the only field Save insists on — the
 * fee follows from it and cannot be typed, and the note and the prescription
 * are optional and say so.
 *
 * A modal on purpose: it opens in the middle of the window over a dimmed
 * chart, because the plan line is decided as one thing and then the clinician
 * is back on the tooth.
 *
 * Nothing here is new to the design system: the Dialog, the Autocomplete, the
 * leading-icon field, the Chip and the buttons are the Storybook's; the glyphs
 * are the record's own. The arrangement follows the design reference.
 *
 * The category chip beside the title is the one place a DATA-VIZ colour is
 * used outside a chart, and it was asked for: a finding's kind is a category,
 * which is what that palette is for — and it keeps the status colours
 * (error, warning…) free to mean what they mean.
 */

import { useId, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import { alpha, darken } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { Icon } from '../components/Icon.tsx'
import { chartSeriesColors } from '../theme.ts'
import {
  treatment,
  type PrescriptionDraft,
  type TreatmentProcedure,
} from '../data/treatment.ts'

/** What Save reports: the plan line as it was filled in. */
export interface TreatmentPlanLine {
  procedure: TreatmentProcedure
  notes: string
  prescriptions: PrescriptionDraft[]
}

const feeFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const procedureLabel = (procedure: TreatmentProcedure) => `${procedure.code} · ${procedure.name}`

/*
 * The category chip's colour: the series palette's orange — the slot nearest
 * the stain a carious lesion is drawn in on the chart and the dot that flags
 * it in the tooth list.
 *
 * The light row, because the product app is pinned light (`main.tsx`); a
 * scheme toggle would have to pick the row, as charts do.
 *
 * The hue itself is too light to read as small text (about 3:1 on white), so
 * it tints the chip and edges it, and the label is the same hue darkened —
 * still orange, and well past 4.5:1 on the tint.
 */
const CATEGORY_HUE = chartSeriesColors.light[1]
const CATEGORY_CHIP_SX = {
  bgcolor: alpha(CATEGORY_HUE, 0.14),
  border: `1px solid ${alpha(CATEGORY_HUE, 0.5)}`,
  color: darken(CATEGORY_HUE, 0.5),
  fontWeight: 500,
}

// ─── FIELD ────────────────────────────────────────────────────────────────

/**
 * A field under its own heading, as the design reference sets them: the name
 * stands above the box in bold instead of floating on its border, so the box
 * can carry a prompt and a leading icon.
 */
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="subtitle2"
      sx={{ display: 'block', fontWeight: 700, mb: 0.75 }}
    >
      {children}
    </Typography>
  )
}

// ─── PRESCRIPTION LINE ────────────────────────────────────────────────────

/**
 * One prescription, as a card: read by default, three fields while it is being
 * edited. The pencil and the bin are a line's only actions.
 *
 * Removing does not ask first: the line is a draft inside a dialog nothing has
 * been saved from yet, and Cancel throws the same words away.
 */
function PrescriptionLine({
  draft,
  editing,
  onEdit,
  onChange,
  onDone,
  onRemove,
}: {
  draft: PrescriptionDraft
  editing: boolean
  onEdit: () => void
  onChange: (patch: Partial<PrescriptionDraft>) => void
  onDone: () => void
  onRemove: () => void
}) {
  const { prescription } = treatment
  const remove = (
    <Tooltip title={prescription.remove.label}>
      <IconButton aria-label={`${prescription.remove.label}: ${draft.name}`} onClick={onRemove}>
        <Icon name={prescription.remove.icon} size={22} />
      </IconButton>
    </Tooltip>
  )

  if (editing) {
    return (
      <Stack
        component="li"
        spacing={1.5}
        sx={{ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          size="small"
          fullWidth
          autoFocus
          label={prescription.fields.name}
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            label={prescription.fields.quantity}
            value={draft.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
            sx={{ flex: '1 1 0' }}
          />
          <TextField
            size="small"
            label={prescription.fields.directions}
            value={draft.directions}
            onChange={(event) => onChange({ directions: event.target.value })}
            sx={{ flex: '2 1 0' }}
          />
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {remove}
          {/* A line with no medication on it is not a prescription yet. */}
          <Button variant="outlined" disabled={!draft.name.trim()} onClick={onDone}>
            {prescription.done}
          </Button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack
      component="li"
      direction="row"
      sx={{
        gap: 1.5,
        pl: 2,
        pr: 1,
        py: 1.5,
        alignItems: 'flex-start',
        borderRadius: 1.5,
        bgcolor: 'background.default',
      }}
    >
      {/* A pill at the head of the line: this card is a medication, at a glance. */}
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1,
          color: 'primary.main',
          bgcolor: 'background.paper',
        }}
      >
        <Icon name={prescription.icon} size={22} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {draft.name}
        </Typography>
        {draft.quantity && (
          <Typography variant="body2" color="text.secondary">
            {`${prescription.quantityPrefix} ${draft.quantity}`}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {draft.directions || prescription.noDirections}
        </Typography>
      </Box>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />}
        sx={{ alignItems: 'center', gap: 1, flexShrink: 0 }}
      >
        <Chip label={prescription.status} size="small" />
        <Stack direction="row">
          <Tooltip title={prescription.edit.label}>
            <IconButton aria-label={`${prescription.edit.label}: ${draft.name}`} onClick={onEdit}>
              <Icon name={prescription.edit.icon} size={22} />
            </IconButton>
          </Tooltip>
          {remove}
        </Stack>
      </Stack>
    </Stack>
  )
}

// ─── DIALOG ───────────────────────────────────────────────────────────────

/**
 * What is typed here starts over each time the dialog is opened: the chart
 * gives it a new `key` per opening, so there is no state to reset by hand.
 */
export function AddTreatmentDialog({
  open,
  toothLine,
  surface,
  category,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  /**
   * A plan already saved, to edit — the dialog opens filled in from it.
   * Absent, it opens empty, with the dataset's starter prescription line.
   */
  initial?: TreatmentPlanLine
  /** The tooth, in both notations and with its type — "Tooth 28R · FDI 44 · Premolar". */
  toothLine: string
  /** The surface in hand on the record the dialog was opened from. */
  surface: string
  /** The kind of finding being treated — "Carious lesion". */
  category: string
  onClose: () => void
  onSave: (line: TreatmentPlanLine) => void
}) {
  const baseId = useId()
  const titleId = `${baseId}-title`
  const procedureId = `${baseId}-procedure`
  const feeId = `${baseId}-fee`
  const notesId = `${baseId}-notes`
  const prescriptionId = `${baseId}-prescription`

  const [procedure, setProcedure] = useState<TreatmentProcedure | null>(initial?.procedure ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [drafts, setDrafts] = useState<PrescriptionDraft[]>(
    initial?.prescriptions ?? treatment.prescription.drafts,
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  // Raised by a Save with no procedure; lowered the moment one is chosen.
  const [missingProcedure, setMissingProcedure] = useState(false)
  // Lines are only ever added, so a count makes each new id unique.
  const [added, setAdded] = useState(0)

  const addDraft = () => {
    const id = `rx-new-${added}`
    setAdded(added + 1)
    setDrafts((current) => [...current, { id, name: '', quantity: '', directions: '' }])
    setEditingId(id)
  }

  const save = () => {
    if (!procedure) {
      setMissingProcedure(true)
      return
    }
    onSave({
      procedure,
      notes: notes.trim(),
      // A line left without a medication was never a prescription.
      prescriptions: drafts.filter((draft) => draft.name.trim()),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={titleId}>
      <Stack
        direction="row"
        sx={{ px: 3, pt: 3, pb: 2.5, gap: 2, alignItems: 'flex-start' }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* The kind of finding, as a category beside the title rather than
              a sentence under it. */}
          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}>
            <Typography id={titleId} variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              {treatment.title}
            </Typography>
            <Chip label={category} size="small" sx={CATEGORY_CHIP_SX} />
          </Stack>
          {/* Which tooth, then which face of it — the face a little heavier,
              being the part that changes from one opening to the next. */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {`${toothLine} · `}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {surface}
            </Box>
          </Typography>
        </Box>
        <IconButton aria-label={treatment.close} onClick={onClose} edge="end">
          <Icon name="close" size={22} />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <FieldLabel htmlFor={procedureId}>{treatment.procedure.label}</FieldLabel>
            <Autocomplete
              id={procedureId}
              options={treatment.procedures}
              value={procedure}
              onChange={(_event, value) => {
                setProcedure(value)
                if (value) setMissingProcedure(false)
              }}
              getOptionLabel={procedureLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={treatment.procedure.noOptions}
              popupIcon={<Icon name={treatment.procedure.openIcon} size={22} />}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={treatment.procedure.placeholder}
                  error={missingProcedure}
                  helperText={
                    missingProcedure ? treatment.procedure.required : treatment.procedure.helper
                  }
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      // Decorative: the heading above already names the field.
                      startAdornment: (
                        <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                          <Icon name={treatment.procedure.icon} size={20} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box>
            <FieldLabel htmlFor={feeId}>{treatment.fee.label}</FieldLabel>
            <TextField
              id={feeId}
              fullWidth
              value={procedure ? feeFormat.format(procedure.fee) : treatment.fee.empty}
              helperText={treatment.fee.helper}
              // Read, not typed: the fee belongs to the procedure. Tinted so it
              // does not look like one more box to fill in.
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">{treatment.fee.currency}</InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <FieldLabel htmlFor={notesId}>{treatment.notes.label}</FieldLabel>
            <TextField
              id={notesId}
              fullWidth
              multiline
              minRows={3}
              placeholder={treatment.notes.placeholder}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Box>

          <Divider />

          <Box>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}
            >
              <Typography id={prescriptionId} variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
                {treatment.prescription.title}
              </Typography>
              <Button
                startIcon={<Icon name={treatment.prescription.add.icon} size={20} />}
                onClick={addDraft}
                // One line is typed at a time.
                disabled={editingId !== null}
              >
                {treatment.prescription.add.label}
              </Button>
            </Stack>
            {drafts.length > 0 && (
              <Stack
                component="ul"
                aria-labelledby={prescriptionId}
                spacing={1}
                sx={{ m: 0, p: 0, listStyle: 'none' }}
              >
                {drafts.map((draft) => (
                  <PrescriptionLine
                    key={draft.id}
                    draft={draft}
                    editing={draft.id === editingId}
                    onEdit={() => setEditingId(draft.id)}
                    onChange={(patch) =>
                      setDrafts((current) =>
                        current.map((entry) =>
                          entry.id === draft.id ? { ...entry, ...patch } : entry,
                        ),
                      )
                    }
                    onDone={() => setEditingId(null)}
                    onRemove={() => {
                      setDrafts((current) => current.filter((entry) => entry.id !== draft.id))
                      if (editingId === draft.id) setEditingId(null)
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          {treatment.cancel}
        </Button>
        <Button variant="contained" onClick={save}>
          {treatment.save}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
