/**
 * The app rail — the icon column down the left edge of every screen.
 *
 * There is still no shared shell: each screen mounts its own `<Rail>` beside
 * its own content. What is shared is the rail itself, extracted from
 * `PatientChart.tsx` when the Patients list became the second screen to draw
 * one.
 *
 * Two parts. The sections on top are where you can go; the avatar at the
 * bottom is who is signed in, and opens the menu that belongs to them —
 * Settings, Support and, always last, Log out.
 *
 * At rest the rail is icons only. Hovered — or reached with the keyboard — it
 * OPENS: it grows to `layout.railWidthExpanded` and shows the logotype beside
 * the mark, a label beside every icon, and the signed-in user's name and email
 * beside the avatar. It grows over the screen, never beside it: the screen's
 * layout only ever reserves `layout.railWidth`, so nothing to the right
 * reflows while the pointer crosses the rail. Every icon keeps its x position
 * in both states — the rail widens to the right and the labels fade in after
 * the icons; nothing jumps.
 *
 * The open state is pure CSS (`OPEN`, below), so hovering re-renders nothing.
 * The one piece of React state behind it is whether the account menu is up:
 * the menu's backdrop covers the rail, which ends `:hover`, and the rail must
 * stay open under the menu it anchors.
 *
 * The rail is dataset-driven like everything else: the screen hands it the
 * `AppRail` from its dataset. `onSelect` reports the item picked — the menu's
 * Log out included — so the app can change screen; the rail does not know
 * which items lead anywhere. What it DOES know is which ones lead nowhere yet
 * (`available: false`), and it draws those disabled.
 */

import { useId, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme, type Theme } from '@mui/material/styles'

import logo from '../assets/EMRdentallogo.svg'
import logotype from '../assets/logotype.svg'
import type { AppRail, RailAccount, RailSection } from '../data/patientChart.ts'
import { Icon } from './Icon.tsx'

/**
 * The keyboard's focus ring. `ButtonBase` ships no visible focus state of its
 * own — it leaves that to whoever styles it — so without this a keyboard user
 * cannot see where they are in a column of identical icon buttons.
 */
const FOCUS_RING = {
  '&.Mui-focusVisible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
} as const

/**
 * When the rail is open. `:has(:focus-visible)` rather than `:focus-within`:
 * a mouse click leaves focus on the button it clicked, and `:focus-within`
 * would then hold the rail open after the pointer had left it. Keyboard focus
 * is what should open it, and that is exactly what `:focus-visible` matches.
 */
const OPEN = ['&:hover', '&:has(:focus-visible)', '&[data-menu-open]']

/** Marks what fades in when the rail opens — the logotype, labels, the account's name. */
const REVEAL = 'rail-reveal'

/**
 * Opening waits `shortest` (150ms) so a pointer crossing the rail on its way
 * somewhere else doesn't flash it open; closing starts at once. The delay sits
 * on the OPEN rule because a transition takes the delay of the state it is
 * entering.
 */
const openTransition = (theme: Theme, props: string[]) =>
  theme.transitions.create(props, {
    duration: theme.transitions.duration.shorter,
    delay: theme.transitions.duration.shortest,
  })
const closeTransition = (theme: Theme, props: string[]) =>
  theme.transitions.create(props, { duration: theme.transitions.duration.shorter })

/** The gap either side of a 48px item in the 88px rail — which centres it while closed. */
const itemInset = (theme: Theme) => (theme.layout.railWidth - theme.layout.iconButton) / 2

/**
 * The mark's edge, and the logotype scaled to keep the Figma lock-up's
 * proportions (a 48px mark beside a 175 × 16 logotype, 8px apart).
 */
const MARK = 34
const LOGOTYPE = { width: (MARK * 175) / 48, height: (MARK * 16) / 48 }

export function Rail({
  rail,
  onSelect,
}: {
  rail: AppRail
  /** Called with the picked item's `id`, after the rail marks it active. */
  onSelect?: (id: string) => void
}) {
  const { groups, account } = rail
  const [activeId, setActiveId] = useState(rail.activeItemId)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    // The slot the screen's layout reserves: always the closed width. The nav
    // inside is pinned to its left edge and grows past it, over the screen.
    <Box
      sx={{
        position: 'relative',
        width: (theme) => theme.layout.railWidth,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer,
      }}
    >
      <Stack
        component="nav"
        aria-label="Sections"
        data-menu-open={menuOpen || undefined}
        sx={(theme) => ({
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: theme.layout.railWidth,
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
          overflowX: 'hidden',
          overflowY: 'auto',
          py: 2,
          transition: closeTransition(theme, ['width', 'box-shadow']),
          [`& .${REVEAL}`]: {
            opacity: 0,
            transition: closeTransition(theme, ['opacity']),
          },
          [OPEN.join(', ')]: {
            width: theme.layout.railWidthExpanded,
            boxShadow: theme.shadows[8],
            transition: openTransition(theme, ['width', 'box-shadow']),
          },
          [OPEN.map((state) => `${state} .${REVEAL}`).join(', ')]: {
            opacity: 1,
            transition: openTransition(theme, ['opacity']),
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&, & *': { transition: 'none !important' },
          },
        })}
      >
        {/* The mark sits where it always has, centred in the closed rail; the
            logotype appears beside it. The mark carries the product's name,
            so the logotype — the same name, drawn — is hidden from AT. */}
        <Stack
          direction="row"
          sx={{
            mb: 2,
            pl: (theme) => `${(theme.layout.railWidth - MARK) / 2}px`,
            gap: 0.75,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt={rail.brandName}
            sx={{ width: MARK, height: MARK, flexShrink: 0 }}
          />
          {/* The Figma logotype is drawn white, for a dark surface. Used as a
              mask, the file stays exactly as exported and takes its ink from
              the theme instead — so it reads on the paper rail in both
              schemes. */}
          <Box
            className={REVEAL}
            aria-hidden
            sx={{
              ...LOGOTYPE,
              flexShrink: 0,
              bgcolor: 'primary.main',
              mask: `url(${logotype}) center / 100% 100% no-repeat`,
            }}
          />
        </Stack>

        {groups.map((group, index) => (
          <Stack key={group.id} sx={{ flexShrink: 0 }}>
            {index > 0 && <Divider flexItem sx={{ my: 1.5, mx: 2 }} />}
            {group.items.map((item) => (
              <RailButton
                key={item.id}
                item={item}
                active={item.id === activeId}
                unavailableHint={rail.unavailableHint}
                onClick={() => {
                  setActiveId(item.id)
                  onSelect?.(item.id)
                }}
              />
            ))}
          </Stack>
        ))}

        <Box sx={{ flexGrow: 1, minHeight: 24 }} />
        <AccountMenu account={account} onSelect={onSelect} onOpenChange={setMenuOpen} />
      </Stack>
    </Box>
  )
}

/**
 * A row as wide as the rail less its inset: closed, that leaves exactly the
 * 48px icon box; open, the label takes the rest. Shared by the sections and
 * the account button, so the avatar lines up with the icons above it.
 */
const rowSx = (theme: Theme) => ({
  position: 'relative' as const,
  flexShrink: 0,
  mx: `${itemInset(theme)}px`,
  width: `calc(100% - ${2 * itemInset(theme)}px)`,
  minHeight: theme.layout.iconButton,
  justifyContent: 'flex-start',
  borderRadius: 1.5,
  textAlign: 'left' as const,
})

/** The 48px square every row's icon (or avatar) sits centred in. */
const ICON_BOX = {
  width: (theme: Theme) => theme.layout.iconButton,
  height: (theme: Theme) => theme.layout.iconButton,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
} as const

function RailButton({
  item,
  active,
  unavailableHint,
  onClick,
}: {
  item: RailSection
  active: boolean
  unavailableHint: string
  onClick: () => void
}) {
  // An open rail names every item, so the tooltip is left for the one thing
  // the label doesn't say: that a section has no screen behind it yet. The
  // accessible name says it too, in the same breath.
  const name = item.available ? item.label : `${item.label} — ${unavailableHint}`
  // MUI places a tooltip once, when it opens. Opened any sooner it would be
  // placed against the closed 48px button and then sit on top of the label
  // as the rail grows, so it waits for the rail to finish opening.
  const { duration } = useTheme().transitions

  return (
    <Tooltip
      title={item.available ? '' : unavailableHint}
      placement="right"
      enterDelay={duration.shortest + duration.shorter}
    >
      {/* A section that is not built yet is `aria-disabled`, not `disabled`:
          it keeps its place in the tab order and its hover, so the tooltip
          still opens. It carries no handler, so a click and Enter/Space both
          do nothing. */}
      <ButtonBase
        aria-label={name}
        aria-current={active ? 'page' : undefined}
        aria-disabled={item.available ? undefined : true}
        disableRipple={!item.available}
        onClick={item.available ? onClick : undefined}
        sx={[
          rowSx,
          {
            my: 0.25,
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
          },
          FOCUS_RING,
          // The theme's own disabled ink, and no hover wash: nothing here
          // invites a click.
          !item.available && {
            color: 'action.disabled',
            cursor: 'default',
            '&:hover': { bgcolor: 'transparent' },
          },
        ]}
      >
        <Box sx={ICON_BOX}>
          <Icon name={item.icon} />
        </Box>
        <Typography
          className={REVEAL}
          variant="body2"
          noWrap
          sx={{ flex: 1, minWidth: 0, pr: 1.5, fontWeight: active ? 500 : undefined }}
        >
          {item.label}
        </Typography>
      </ButtonBase>
    </Tooltip>
  )
}

/**
 * The signed-in user's avatar, and the menu it opens. With the rail open the
 * name and email sit beside the avatar, on the same button.
 *
 * The menu opens to the RIGHT of the open rail and grows upward from the
 * button's bottom edge: the button sits in the bottom-left corner of the
 * window, so there is no room below it and none to its left.
 */
function AccountMenu({
  account,
  onSelect,
  onOpenChange,
}: {
  account: RailAccount
  onSelect?: (id: string) => void
  /** Tells the rail to stay open under the menu. */
  onOpenChange: (open: boolean) => void
}) {
  const theme = useTheme()
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const menuId = useId()
  const open = Boolean(anchor)

  // The menu is placed against the OPEN rail's right edge, worked out from
  // the token rather than measured: a click can land while the rail is still
  // growing (or before it has started), and a menu anchored to the button's
  // width at that instant would end up on top of the name it belongs to.
  const openAt = (button: HTMLElement) => {
    const rect = button.getBoundingClientRect()
    const railLeft = button.closest('nav')?.getBoundingClientRect().left ?? 0
    return { top: rect.bottom, left: railLeft + theme.layout.railWidthExpanded }
  }

  const setOpen = (next: { top: number; left: number } | null) => {
    setAnchor(next)
    onOpenChange(Boolean(next))
  }

  const pick = (id: string) => {
    setOpen(null)
    onSelect?.(id)
  }

  return (
    <>
      <ButtonBase
        aria-label={`${account.menuLabel}: ${account.name}`}
        aria-haspopup="menu"
        aria-expanded={open ? true : undefined}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => setOpen(openAt(event.currentTarget))}
        sx={[
          rowSx,
          {
            transition: (theme) => theme.transitions.create('background-color'),
            '&:hover': { bgcolor: 'action.hover' },
          },
          open && { bgcolor: 'action.selected' },
          FOCUS_RING,
        ]}
      >
        <Box sx={ICON_BOX}>
          <Avatar sx={{ bgcolor: 'primary.main', typography: 'body2', fontWeight: 500 }}>
            {account.initials}
          </Avatar>
        </Box>
        <Box className={REVEAL} sx={{ flex: 1, minWidth: 0, pl: 0.5, pr: 1.5 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'text.primary' }}>
            {account.name}
          </Typography>
          <Typography variant="caption" noWrap component="p" sx={{ color: 'text.secondary' }}>
            {account.email}
          </Typography>
        </Box>
      </ButtonBase>

      <Menu
        id={menuId}
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={anchor ?? undefined}
        onClose={() => setOpen(null)}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { ml: 1.5, minWidth: 220, borderRadius: 1.5 } },
          list: { 'aria-label': account.menuLabel },
        }}
      >
        {account.items.map((item) => (
          // Listed even when there is nothing behind them yet, and disabled
          // for the same reason the rail's sections are.
          <MenuItem key={item.id} disabled={!item.available} onClick={() => pick(item.id)}>
            <ListItemIcon>
              <Icon name={item.icon} size={20} />
            </ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => pick(account.logOut.id)}>
          <ListItemIcon>
            <Icon name={account.logOut.icon} size={20} />
          </ListItemIcon>
          {account.logOut.label}
        </MenuItem>
      </Menu>
    </>
  )
}
