/**
 * The Imaging section of the patient record — the scans on file, as cards.
 *
 * Reached through `PatientChart.tsx`, which draws it in the place of the chart
 * when the record's Imaging section is up: the patient sidebar stays on the
 * left and this fills the right. It is a panel, not a screen — no rail, no
 * page chrome of its own.
 *
 * One job: find a scan and look at it. The cards lead, three to a row; the
 * header only searches them and uploads. A card opens the scan in a viewer;
 * its menu removes the scan (after asking) or puts another file in its place.
 *
 * Nothing here is new to the design system: the card, its header, the search
 * field and the primary button are the Patients list's; a scan card is the
 * chart's finding card with a menu button added; the viewer is the Dialog the
 * Storybook previews. The arrangement follows the design reference, the look
 * is the theme's.
 */

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'

import { Icon } from '../components/Icon.tsx'
import { imaging, type Scan } from '../data/imaging.ts'

/** A scan's date, the way the record writes dates. */
const dateOf = (scan: Scan) => dayjs(scan.takenOn).format(imaging.dateFormat)

const BYTES_PER_KB = 1024
const BYTES_PER_MB = BYTES_PER_KB * 1024

/** A picked file's size, written the way the seeded scans write theirs. */
const sizeLabel = (bytes: number) =>
  bytes >= BYTES_PER_MB / 10
    ? `${(bytes / BYTES_PER_MB).toFixed(1)} ${imaging.sizeUnits.mb}`
    : `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} ${imaging.sizeUnits.kb}`

/** Lets go of a picture this page made a URL for; the bundled sample is left alone. */
const release = (image: string) => {
  if (image.startsWith('blob:')) URL.revokeObjectURL(image)
}

// ─── SCAN CARD ────────────────────────────────────────────────────────────

/**
 * One scan: what kind of image, the file behind it, and when it was taken.
 *
 * The whole card opens the scan. Its menu button is a SIBLING of that button,
 * laid over the card's corner, not a child of it — a button inside a button is
 * not valid markup, and a click on the menu must not also open the viewer.
 */
function ScanCard({
  scan,
  onOpen,
  onRemove,
  onReupload,
}: {
  scan: Scan
  onOpen: () => void
  onRemove: () => void
  onReupload: () => void
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  /** Closes the menu first, so focus is back on its button before anything opens. */
  const pick = (action: () => void) => () => {
    setMenuAnchor(null)
    action()
  }

  return (
    <Box component="li" sx={{ position: 'relative', minWidth: 0 }}>
      <ButtonBase
        onClick={onOpen}
        aria-label={`${imaging.openPrefix} ${scan.kind}, ${scan.fileName}, ${dateOf(scan)}`}
        sx={{
          width: '100%',
          gap: 2,
          // Room on the right for the menu button laid over the corner.
          pl: 2,
          pr: 6,
          py: 2,
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          textAlign: 'left',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: (theme) => theme.transitions.create(['box-shadow', 'border-color']),
          '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main', boxShadow: 2 },
        }}
      >
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
            bgcolor: 'background.default',
          }}
        >
          <Icon name={imaging.scanIcon} size={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {scan.kind}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {scan.fileName}{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {scan.size}
            </Box>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontVariantNumeric: 'tabular-nums' }}
          >
            {dateOf(scan)}
          </Typography>
        </Box>
      </ButtonBase>

      <Tooltip title={imaging.menu.label}>
        <IconButton
          aria-label={`${imaging.menu.label}: ${scan.kind}`}
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
          size="small"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{ position: 'absolute', top: 12, right: 8, color: 'text.secondary' }}
        >
          {/* The record's own "more" glyph, turned upright as a row menu's is. */}
          <Box component="span" sx={{ display: 'flex', transform: 'rotate(90deg)' }}>
            <Icon name="more" size={20} />
          </Box>
        </IconButton>
      </Tooltip>
      <Menu open={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={pick(onRemove)}>
          <ListItemIcon>
            <Icon name={imaging.menu.remove.icon} size={20} />
          </ListItemIcon>
          {imaging.menu.remove.label}
        </MenuItem>
        <MenuItem onClick={pick(onReupload)}>
          <ListItemIcon>
            <Icon name={imaging.menu.reupload.icon} size={20} />
          </ListItemIcon>
          {imaging.menu.reupload.label}
        </MenuItem>
      </Menu>
    </Box>
  )
}

// ─── SECTION ──────────────────────────────────────────────────────────────

export function ImagingPanel() {
  const [query, setQuery] = useState('')
  const [openScan, setOpenScan] = useState<Scan | null>(null)
  // Seeded from the dataset; removing and re-uploading change this copy only.
  const [onFile, setOnFile] = useState<Scan[]>(imaging.scans)
  // The scan a removal is being asked about, and whether the question is up.
  // Two values so the dialog still names the scan while it fades out.
  const [removing, setRemoving] = useState<Scan | null>(null)
  const [askingRemove, setAskingRemove] = useState(false)

  // One file picker serves every card: the ref says whose file is being replaced.
  const fileInput = useRef<HTMLInputElement>(null)
  const reuploadId = useRef<string | null>(null)

  const startReupload = (scan: Scan) => {
    reuploadId.current = scan.id
    fileInput.current?.click()
  }

  const finishReupload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const id = reuploadId.current
    // Cleared so picking the same file again still reports a change.
    event.target.value = ''
    reuploadId.current = null
    const replaced = onFile.find((scan) => scan.id === id)
    if (!file || !replaced) return
    release(replaced.image)
    const image = URL.createObjectURL(file)
    setOnFile((current) =>
      current.map((scan) =>
        // The kind and the date stay the scan's own: only its file changed.
        scan.id === id
          ? { ...scan, fileName: file.name, size: sizeLabel(file.size), image }
          : scan,
      ),
    )
  }

  const confirmRemove = () => {
    setAskingRemove(false)
    if (!removing) return
    release(removing.image)
    setOnFile((current) => current.filter((scan) => scan.id !== removing.id))
  }

  // Newest first; narrowed by whatever of the kind or file name was typed.
  const scans = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return onFile
      .filter((scan) => !needle || `${scan.kind} ${scan.fileName}`.toLowerCase().includes(needle))
      .sort((a, b) => b.takenOn.localeCompare(a.takenOn))
  }, [onFile, query])

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
          {imaging.title}
        </Typography>

        <TextField
          type="search"
          name="scan-search"
          autoComplete="off"
          size="small"
          // A prompt, not a floating label: with a leading icon the label
          // would sit shrunk on the border for good.
          placeholder={imaging.search.label}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ minWidth: 240 }}
          slotProps={{
            htmlInput: { 'aria-label': imaging.search.label },
            input: {
              // Decorative: the field's name already says what it searches.
              startAdornment: (
                <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                  <Icon name={imaging.search.icon} size={18} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Nothing is behind it yet — like the header actions on the Patients
            list — but it is where uploading will hang from. */}
        <Button
          variant="contained"
          startIcon={<Icon name={imaging.upload.icon} size={20} />}
        >
          {imaging.upload.label}
        </Button>
      </Stack>

      <Divider />

      {/* The only scrolling region. */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2.5 }}>
        {scans.length > 0 ? (
          <Box
            component="ul"
            aria-label={imaging.title}
            sx={{
              m: 0,
              p: 0,
              listStyle: 'none',
              display: 'grid',
              // Three to a row; fewer only when the card would be squeezed
              // too narrow to read a file name in.
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {scans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                onOpen={() => setOpenScan(scan)}
                onRemove={() => {
                  setRemoving(scan)
                  setAskingRemove(true)
                }}
                onReupload={() => startReupload(scan)}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {onFile.length > 0 ? imaging.noMatches : imaging.empty}
          </Typography>
        )}
      </Box>

      {/* Never shown: a card's "Reupload" opens the system's file picker through it. */}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={finishReupload} />

      {/* A removed scan does not come back, so removing asks first. */}
      <Dialog
        open={askingRemove}
        onClose={() => setAskingRemove(false)}
        aria-labelledby="scan-remove-title"
      >
        <DialogTitle id="scan-remove-title">{imaging.removeConfirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            {imaging.removeConfirm.body
              .replace('{scan}', removing?.kind ?? '')
              .replace('{file}', removing?.fileName ?? '')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAskingRemove(false)}>{imaging.removeConfirm.cancel}</Button>
          <Button color="error" variant="contained" onClick={confirmRemove}>
            {imaging.removeConfirm.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      {/* The viewer: the scan, as large as the window allows, under a heading
          that says which one it is. */}
      <Dialog
        open={openScan !== null}
        onClose={() => setOpenScan(null)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="scan-viewer-title"
      >
        {openScan && (
          <>
            <DialogTitle
              id="scan-viewer-title"
              sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: 2 }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {openScan.kind}
                <Typography variant="body2" color="text.secondary">
                  {`${openScan.fileName} · ${openScan.size} · ${dateOf(openScan)}`}
                </Typography>
              </Box>
              <IconButton aria-label={imaging.viewer.close} onClick={() => setOpenScan(null)}>
                <Icon name="close" size={22} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Box
                component="img"
                src={openScan.image}
                alt={`${openScan.kind} — ${imaging.viewer.imageNote}`}
                sx={{
                  display: 'block',
                  width: '100%',
                  // Never taller than the window: the whole scan stays in view.
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                  // Radiographs are read on black.
                  bgcolor: 'common.black',
                }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Paper>
  )
}
